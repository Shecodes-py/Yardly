from django.urls import path
from .views import (
    DeliveryPassListCreateView,
    GuardDeliveryArrivedView,
    GuardPassListView,
    SecurityAlertListCreateView,
    VisitorPassCancelView,
    VisitorPassCheckInView,
    VisitorPassListCreateView,
)

urlpatterns = [
    path("gate/passes/", VisitorPassListCreateView.as_view(), name="visitor-pass-list-create"),
    path("gate/passes/<int:pk>/cancel/", VisitorPassCancelView.as_view(), name="visitor-pass-cancel"),
    path("gate/passes/checkin/<str:pass_code>/", VisitorPassCheckInView.as_view(), name="visitor-pass-checkin"),
    path("gate/guard/passes/", GuardPassListView.as_view(), name="guard-pass-list"),
    path("gate/deliveries/", DeliveryPassListCreateView.as_view(), name="delivery-pass-list-create"),
    path("gate/deliveries/<int:pk>/arrive/", GuardDeliveryArrivedView.as_view(), name="guard-delivery-arrive"),
    path("gate/alerts/", SecurityAlertListCreateView.as_view(), name="security-alert-list-create"),
]
