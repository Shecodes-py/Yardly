from django.urls import path

from .views import (
    CategoryListView,
    JobCancelView,
    JobCompleteView,
    JobConfirmView,
    JobDetailView,
    JobListCreateView,
    JobStartView,
    MyJobsView,
    MyWorkView,
)

urlpatterns = [
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("jobs/", JobListCreateView.as_view(), name="job-list-create"),
    path("my-jobs/", MyJobsView.as_view(), name="my-jobs"),
    path("my-work/", MyWorkView.as_view(), name="my-work"),
    path("jobs/<int:pk>/", JobDetailView.as_view(), name="job-detail"),
    path("jobs/<int:pk>/cancel/", JobCancelView.as_view(), name="job-cancel"),
    path("jobs/<int:pk>/start/", JobStartView.as_view(), name="job-start"),
    path("jobs/<int:pk>/complete/", JobCompleteView.as_view(), name="job-complete"),
    path("jobs/<int:pk>/confirm/", JobConfirmView.as_view(), name="job-confirm"),
]
