from django.shortcuts import render
from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.common.permissions import get_verified_estate_id

from apps.common.email import welcome_email

from .models import HouseholdAudit, User
from .serializers import HouseholdAuditSerializer, RegisterSerializer, UserSerializer


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    return Response({"status": "ok", "app": "Yardly API"})


class RegisterView(generics.CreateAPIView):
    """Creates account with selected role & enrolls in estate."""

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        welcome_email(user)
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
            status=201,
        )


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class HouseholdAuditView(APIView):
    """GET/POST mandatory resident onboarding household audit."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        audit = getattr(request.user, "household_audit", None)
        if not audit:
            return Response(None, status=200)
        return Response(HouseholdAuditSerializer(audit).data)

    def post(self, request):
        user = request.user
        membership = user.estate_memberships.first()
        if not membership:
            raise PermissionDenied("You must belong to an estate to complete a household audit.")

        audit, created = HouseholdAudit.objects.get_or_create(user=user, defaults={"estate": membership.estate})
        serializer = HouseholdAuditSerializer(audit, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        audit = serializer.save(is_completed=True)

        # Also update unit address on membership & flip user status to PENDING_VERIFICATION
        membership.unit_address = audit.unit_address
        membership.save(update_fields=["unit_address"])

        if user.status in {User.Status.PENDING_AUDIT, User.Status.UNVERIFIED}:
            user.status = User.Status.PENDING_VERIFICATION
            user.save(update_fields=["status"])

        return Response(HouseholdAuditSerializer(audit).data, status=201)


class AdminPendingGuardsView(generics.ListAPIView):
    """Estate Admin View: List security guards awaiting admin approval."""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        estate_id = get_verified_estate_id(self.request.user)
        if not estate_id:
            return User.objects.none()
        return User.objects.filter(
            estate_memberships__estate_id=estate_id,
            role=User.Role.GATE_SECURITY,
            status=User.Status.PENDING_APPROVAL,
        )


class AdminApproveGuardView(APIView):
    """Estate Admin approves a pending security guard."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        guard = generics.get_object_or_404(User, pk=pk, role=User.Role.GATE_SECURITY)
        guard.status = User.Status.VERIFIED
        guard.save(update_fields=["status"])
        return Response(UserSerializer(guard).data)


class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
