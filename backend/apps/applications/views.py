from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsVerifiedResident
from apps.jobs.models import Job
from apps.notifications.services import notify

from .models import JobApplication
from .serializers import JobApplicationCreateSerializer, JobApplicationSerializer, MyApplicationSerializer


class MyApplicationsView(generics.ListAPIView):
    """Applications the current user has submitted as a worker."""

    serializer_class = MyApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return JobApplication.objects.filter(worker=self.request.user).select_related("job", "job__category")


class JobApplicationListCreateView(generics.ListCreateAPIView):
    """Applications for a single job. Only the job owner can list them
    (applicant identities shouldn't leak to other applicants); any verified
    resident other than the owner can apply while the job is OPEN."""

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated(), IsVerifiedResident()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        return JobApplicationCreateSerializer if self.request.method == "POST" else JobApplicationSerializer

    def get_job(self):
        return generics.get_object_or_404(Job, pk=self.kwargs["job_id"])

    def get_queryset(self):
        job = self.get_job()
        if job.owner_id != self.request.user.id:
            raise PermissionDenied("Only the job owner can view applicants.")
        return JobApplication.objects.filter(job=job).select_related("worker")

    def create(self, request, *args, **kwargs):
        job = self.get_job()
        if job.owner_id == request.user.id:
            raise ValidationError("You cannot apply to your own task.")
        if job.status != Job.Status.OPEN:
            raise ValidationError("This task is no longer open for applications.")
        if JobApplication.objects.filter(job=job, worker=request.user).exists():
            raise ValidationError("You have already applied to this task.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = serializer.save(job=job, worker=request.user)
        notify(
            job.owner, "NEW_APPLICATION", f"New applicant for '{job.title}'",
            related_job=job,
        )
        return Response(JobApplicationSerializer(application).data, status=201)


class ApplicationAcceptView(APIView):
    """Job owner assigns the task to one applicant; every other pending
    application on the job automatically becomes REJECTED (section 14)."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        application = generics.get_object_or_404(
            JobApplication.objects.select_related("job"), pk=pk
        )
        job = application.job
        if job.owner_id != request.user.id:
            raise PermissionDenied("Only the job owner can select an applicant.")
        if job.status != Job.Status.OPEN:
            raise ValidationError("This task is not open for assignment.")

        application.status = JobApplication.Status.ACCEPTED
        application.save(update_fields=["status", "updated_at"])

        job.assigned_worker = application.worker
        job.assigned_at = timezone.now()
        job.transition_to(Job.Status.ASSIGNED, save=False)
        job.save(update_fields=["assigned_worker", "assigned_at", "status", "updated_at"])

        others = JobApplication.objects.filter(job=job, status=JobApplication.Status.PENDING).exclude(
            pk=application.pk
        )
        for other in others:
            notify(
                other.worker, "APPLICATION_REJECTED", f"Your application for '{job.title}' was not selected",
                related_job=job,
            )
        others.update(status=JobApplication.Status.REJECTED)

        notify(
            application.worker, "APPLICATION_ACCEPTED", f"You were assigned to '{job.title}'",
            related_job=job,
        )
        return Response(JobApplicationSerializer(application).data)


class ApplicationWithdrawView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        application = generics.get_object_or_404(JobApplication, pk=pk)
        if application.worker_id != request.user.id:
            raise PermissionDenied("You can only withdraw your own application.")
        if application.status != JobApplication.Status.PENDING:
            raise ValidationError("Only a pending application can be withdrawn.")
        application.status = JobApplication.Status.WITHDRAWN
        application.save(update_fields=["status", "updated_at"])
        return Response(JobApplicationSerializer(application).data)
