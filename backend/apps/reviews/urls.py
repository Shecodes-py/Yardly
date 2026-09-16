from django.urls import path

from .views import JobReviewListCreateView

urlpatterns = [
    path("jobs/<int:job_id>/reviews/", JobReviewListCreateView.as_view(), name="job-review-list-create"),
]
