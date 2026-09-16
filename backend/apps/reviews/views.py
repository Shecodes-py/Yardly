from django.db import IntegrityError
from django.db.models import Avg
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from apps.jobs.models import Job
from apps.notifications.services import notify

from .models import Review
from .serializers import ReviewCreateSerializer, ReviewSerializer


class JobReviewListCreateView(generics.ListCreateAPIView):
    """Reviews for a job. Creating one requires the job to be CLOSED and the
    caller to be one of the two participants (owner <-> assigned worker) —
    PRD rules 7 and 8."""

    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        return ReviewCreateSerializer if self.request.method == "POST" else ReviewSerializer

    def get_job(self):
        return generics.get_object_or_404(Job, pk=self.kwargs["job_id"])

    def get_queryset(self):
        return Review.objects.filter(job_id=self.kwargs["job_id"]).select_related("reviewer")

    def create(self, request, *args, **kwargs):
        job = self.get_job()
        if job.status != Job.Status.CLOSED:
            raise ValidationError("Reviews can only be left for completed tasks.")

        user = request.user
        if user.id == job.owner_id:
            reviewee = job.assigned_worker
        elif user.id == job.assigned_worker_id:
            reviewee = job.owner
        else:
            raise PermissionDenied("Only job participants can leave a review.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            review = serializer.save(job=job, reviewer=user, reviewee=reviewee)
        except IntegrityError:
            raise ValidationError("You have already reviewed this participant for this task.")

        worker_profile = getattr(reviewee, "worker_profile", None)
        if worker_profile:
            avg = Review.objects.filter(reviewee=reviewee).aggregate(avg=Avg("rating"))["avg"]
            worker_profile.average_rating = round(avg or 0, 2)
            worker_profile.save(update_fields=["average_rating"])

        notify(reviewee, "NEW_REVIEW", f"{user.get_full_name()} left you a review", related_job=job)
        return Response(ReviewSerializer(review).data, status=201)
