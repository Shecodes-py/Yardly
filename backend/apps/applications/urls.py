from django.urls import path

from .views import (
    ApplicationAcceptView,
    ApplicationWithdrawView,
    JobApplicationListCreateView,
    MyApplicationsView,
)

urlpatterns = [
    path("jobs/<int:job_id>/applications/", JobApplicationListCreateView.as_view(), name="job-application-list-create"),
    path("my-applications/", MyApplicationsView.as_view(), name="my-applications"),
    path("applications/<int:pk>/accept/", ApplicationAcceptView.as_view(), name="application-accept"),
    path("applications/<int:pk>/withdraw/", ApplicationWithdrawView.as_view(), name="application-withdraw"),
]
