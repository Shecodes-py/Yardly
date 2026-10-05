from django.urls import path
from .views import (
    AdminHousePaymentTrackerView,
    AdminMaintenanceListView,
    AdminMaintenanceUpdateView,
    AdminPendingMembershipsView,
    AdminRotateGateCodeView,
    AdminUpdateInviteCodeView,
    AdminVerifyMembershipView,
    DailyGateCodeView,
    EmergencyContactListView,
    EstateListView,
    JoinEstateView,
    LevyListCreateView,
    MaintenanceTicketListCreateView,
    PaymentReceiptListView,
    ProcessLevyPaymentView,
)

urlpatterns = [
    path("estates/", EstateListView.as_view(), name="estate-list"),
    path("estates/join/", JoinEstateView.as_view(), name="estate-join"),
    path("estates/gate-code/", DailyGateCodeView.as_view(), name="estate-daily-gate-code"),
    path("estates/emergency-contacts/", EmergencyContactListView.as_view(), name="estate-emergency-contacts"),
    path("estates/maintenance/", MaintenanceTicketListCreateView.as_view(), name="estate-maintenance-list-create"),

    # Levies & Stamped Digital Receipts
    path("estates/levies/", LevyListCreateView.as_view(), name="estate-levy-list-create"),
    path("estates/levies/<int:levy_id>/pay/", ProcessLevyPaymentView.as_view(), name="estate-levy-pay"),
    path("estates/receipts/", PaymentReceiptListView.as_view(), name="estate-receipt-list"),
    path("estates/admin/payment-tracker/", AdminHousePaymentTrackerView.as_view(), name="admin-house-payment-tracker"),

    path("estates/admin/invite-code/", AdminUpdateInviteCodeView.as_view(), name="admin-update-invite-code"),
    # Admin endpoints
    path("estates/admin/memberships/pending/", AdminPendingMembershipsView.as_view(), name="admin-pending-memberships"),
    path("estates/admin/memberships/<int:pk>/verify/", AdminVerifyMembershipView.as_view(), name="admin-verify-membership"),
    path("estates/admin/gate-code/rotate/", AdminRotateGateCodeView.as_view(), name="admin-rotate-gate-code"),
    path("estates/admin/maintenance/", AdminMaintenanceListView.as_view(), name="admin-maintenance-list"),
    path("estates/admin/maintenance/<int:pk>/status/", AdminMaintenanceUpdateView.as_view(), name="admin-maintenance-update"),
]
