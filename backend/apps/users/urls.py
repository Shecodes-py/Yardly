from django.urls import path
from .views import (
    AdminApproveGuardView,
    AdminPendingGuardsView,
    HouseholdAuditView,
    MeView,
    RegisterView,
    UserDetailView,
)

from .password_reset import PasswordResetRequestView, PasswordResetConfirmView

urlpatterns = [
    path("auth/password-reset/", PasswordResetRequestView.as_view(), name="password-reset"),
    path("auth/password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("me/", MeView.as_view(), name="me"),
    path("household-audit/", HouseholdAuditView.as_view(), name="household-audit"),
    path("users/<int:pk>/", UserDetailView.as_view(), name="user-detail"),

    # Admin Guard Approvals
    path("admin/guards/pending/", AdminPendingGuardsView.as_view(), name="admin-pending-guards"),
    path("admin/guards/<int:pk>/approve/", AdminApproveGuardView.as_view(), name="admin-approve-guard"),
]
