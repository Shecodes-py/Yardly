from django.urls import path

from .views import BlockListCreateView, ReportCreateView

urlpatterns = [
    path("reports/", ReportCreateView.as_view(), name="report-create"),
    path("blocks/", BlockListCreateView.as_view(), name="block-list-create"),
]
