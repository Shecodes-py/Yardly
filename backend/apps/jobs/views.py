from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsVerifiedResident, get_verified_estate_id
from apps.notifications.services import notify

from .models import Category, Job
from .serializers import CategorySerializer, JobCreateSerializer, JobDetailSerializer, JobListSerializer


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(active=True)
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class MyJobsView(generics.ListAPIView):
    """Tasks the current user has posted, any status — the 'My Tasks' screen."""

    serializer_class = JobDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Job.objects.filter(owner=self.request.user).select_related("category")


class MyWorkView(generics.ListAPIView):
    """Tasks the current user is/was assigned to — the 'My Work' screen."""

    serializer_class = JobDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Job.objects.filter(assigned_worker=self.request.user).select_related("category")


class JobListCreateView(generics.ListCreateAPIView):
    """GET: feed of jobs in the caller's verified estate, with basic filters
    (category, date, budget, ordering). POST: post a new task (rule: only
    verified residents, and only within their own estate — PRD rules 1, 3)."""

    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated(), IsVerifiedResident()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        return JobCreateSerializer if self.request.method == "POST" else JobListSerializer

    def get_queryset(self):
        estate_id = get_verified_estate_id(self.request.user)
        if not estate_id:
            return Job.objects.none()

        qs = Job.objects.filter(estate_id=estate_id).select_related("category")

        params = self.request.query_params
        if category := params.get("category"):
            qs = qs.filter(category_id=category)
        if date := params.get("date"):
            qs = qs.filter(preferred_date=date)
        if max_budget := params.get("max_budget"):
            qs = qs.filter(budget__lte=max_budget)
        qs = qs.filter(status=Job.Status.OPEN)

        ordering = params.get("ordering", "-created_at")
        if ordering in {"-created_at", "budget", "-budget", "preferred_date"}:
            qs = qs.order_by(ordering)
        return qs

    def create(self, request, *args, **kwargs):
        if not get_verified_estate_id(request.user):
            raise PermissionDenied("You must belong to a verified estate to post a task.")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        job = serializer.save()
        return Response(JobDetailSerializer(job, context={"request": request}).data, status=201)


class JobDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = JobDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        estate_id = get_verified_estate_id(self.request.user)
        return Job.objects.filter(estate_id=estate_id)

    def perform_update(self, serializer):
        job = self.get_object()
        if job.owner_id != self.request.user.id:
            raise PermissionDenied("Only the job owner can edit this task.")
        if job.status != Job.Status.OPEN:
            raise PermissionDenied("Only an open task can be edited.")
        serializer.save()


class JobCancelView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        job = generics.get_object_or_404(Job, pk=pk)
        if job.owner_id != request.user.id:
            raise PermissionDenied("Only the job owner can cancel this task.")
        job.transition_to(Job.Status.CANCELLED)
        if job.assigned_worker_id:
            notify(
                job.assigned_worker, "JOB_CANCELLED", f"'{job.title}' was cancelled",
                related_job=job,
            )
        return Response(JobDetailSerializer(job, context={"request": request}).data)


class JobStartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        job = generics.get_object_or_404(Job, pk=pk)
        if job.assigned_worker_id != request.user.id:
            raise PermissionDenied("Only the assigned worker can start this task.")
        job.transition_to(Job.Status.IN_PROGRESS)
        job.started_at = timezone.now()
        job.save(update_fields=["started_at"])
        notify(job.owner, "JOB_STARTED", f"Work has started on '{job.title}'", related_job=job)
        return Response(JobDetailSerializer(job, context={"request": request}).data)


class JobCompleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        job = generics.get_object_or_404(Job, pk=pk)
        if job.assigned_worker_id != request.user.id:
            raise PermissionDenied("Only the assigned worker can mark this task complete.")
        job.transition_to(Job.Status.COMPLETED)
        job.completed_at = timezone.now()
        job.save(update_fields=["completed_at"])
        notify(
            job.owner, "JOB_MARKED_COMPLETE",
            f"{request.user.get_full_name()} says your task has been completed.",
            related_job=job,
        )
        return Response(JobDetailSerializer(job, context={"request": request}).data)


class JobConfirmView(APIView):
    """Customer confirms completion -> CLOSED, per section 17."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        job = generics.get_object_or_404(Job, pk=pk)
        if job.owner_id != request.user.id:
            raise PermissionDenied("Only the job owner can confirm completion.")
        job.transition_to(Job.Status.CLOSED)
        job.closed_at = timezone.now()
        job.save(update_fields=["closed_at"])
        if job.assigned_worker_id:
            worker_profile = getattr(job.assigned_worker, "worker_profile", None)
            if worker_profile:
                worker_profile.completed_jobs_count += 1
                worker_profile.save(update_fields=["completed_jobs_count"])
            notify(
                job.assigned_worker, "COMPLETION_CONFIRMED",
                f"Completion confirmed for '{job.title}'", related_job=job,
            )
        return Response(JobDetailSerializer(job, context={"request": request}).data)
