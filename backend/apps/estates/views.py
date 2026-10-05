from django.utils import timezone
from django.db import transaction, IntegrityError
import logging
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsEstateAdmin, IsVerifiedResident, get_verified_estate_id
from apps.users.models import User

from .models import EmergencyContact, Estate, EstateLevy, EstateMembership, MaintenanceTicket, PaymentReceipt, generate_gate_code, generate_receipt_ref
from .serializers import (
    AdminAccessCodeSerializer,
    UpdateInviteCodeSerializer,
    EmergencyContactSerializer,
    EstateGateCodeSerializer,
    EstateLevySerializer,
    EstateMembershipSerializer,
    EstateSerializer,
    JoinEstateSerializer,
    MaintenanceTicketCreateSerializer,
    MaintenanceTicketSerializer,
    PaymentReceiptSerializer,
)


class EstateListView(generics.ListAPIView):
    queryset = Estate.objects.filter(status=Estate.Status.ACTIVE)
    serializer_class = EstateSerializer
    permission_classes = [permissions.IsAuthenticated]


class JoinEstateView(generics.GenericAPIView):
    serializer_class = JoinEstateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        membership = serializer.save()
        return Response(
            {
                "estate": EstateSerializer(membership.estate).data,
                "verification_status": membership.verification_status,
            },
            status=201,
        )


class DailyGateCodeView(APIView):
    """Only VERIFIED residents can access the estate daily gate code."""

    permission_classes = [permissions.IsAuthenticated, IsVerifiedResident]

    def get(self, request):
        estate_id = get_verified_estate_id(request.user)
        if not estate_id:
            raise PermissionDenied("You must be a verified resident to view the daily gate code.")
        estate = Estate.objects.get(pk=estate_id)
        return Response((AdminAccessCodeSerializer if request.user.is_estate_admin else EstateGateCodeSerializer)(estate).data)


class EmergencyContactListView(generics.ListAPIView):
    serializer_class = EmergencyContactSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        estate_id = get_verified_estate_id(self.request.user)
        if not estate_id:
            return EmergencyContact.objects.none()
        return EmergencyContact.objects.filter(estate_id=estate_id)


class MaintenanceTicketListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated(), IsVerifiedResident()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        return MaintenanceTicketCreateSerializer if self.request.method == "POST" else MaintenanceTicketSerializer

    def get_queryset(self):
        estate_id = get_verified_estate_id(self.request.user)
        if not estate_id:
            return MaintenanceTicket.objects.none()
        return MaintenanceTicket.objects.filter(estate_id=estate_id, resident=self.request.user)

    def create(self, request, *args, **kwargs):
        estate_id = get_verified_estate_id(request.user)
        if not estate_id:
            raise PermissionDenied("Must be a verified resident to submit a maintenance ticket.")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ticket = serializer.save(resident=request.user, estate_id=estate_id)
        return Response(MaintenanceTicketSerializer(ticket).data, status=201)


# ==========================================
# ESTATE LEVIES & PAYMENT RECEIPTS
# ==========================================

class LevyListCreateView(generics.ListCreateAPIView):
    serializer_class = EstateLevySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        membership = self.request.user.estate_memberships.first()
        if not membership:
            return EstateLevy.objects.none()
        return EstateLevy.objects.filter(estate_id=membership.estate_id, is_active=True)

    def create(self, request, *args, **kwargs):
        membership = request.user.estate_memberships.first()
        if not membership or not request.user.is_estate_admin:
            raise PermissionDenied("Only Estate Admins can create monthly levies.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        levy = serializer.save(estate_id=membership.estate_id)
        return Response(EstateLevySerializer(levy).data, status=201)


class ProcessLevyPaymentView(APIView):
    """Online payments remain unavailable until provider verification is integrated."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, levy_id):
        return Response(
            {"detail": "Online payments are not available yet. Contact your estate management for payment instructions."},
            status=503,
        )


class PaymentReceiptListView(generics.ListAPIView):
    """Lists receipts for current user or all receipts for admin."""

    serializer_class = PaymentReceiptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        membership = user.estate_memberships.first()
        if not membership:
            return PaymentReceipt.objects.none()

        if user.is_estate_admin:
            return PaymentReceipt.objects.filter(estate_id=membership.estate_id, status=PaymentReceipt.Status.SUCCESS).exclude(payment_method=PaymentReceipt.PaymentMethod.SIMULATED_TEST).select_related("levy", "resident")
        return PaymentReceipt.objects.filter(resident=user, status=PaymentReceipt.Status.SUCCESS).exclude(payment_method=PaymentReceipt.PaymentMethod.SIMULATED_TEST).select_related("levy", "resident")


class AdminHousePaymentTrackerView(APIView):
    """Estate Admin House-by-House Payment Tracker showing Paid vs Unpaid units for active levies."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        membership = request.user.estate_memberships.first()
        if not membership:
            return Response([])

        estate_id = membership.estate_id
        active_levies = EstateLevy.objects.filter(estate_id=estate_id, is_active=True)
        memberships = EstateMembership.objects.filter(estate_id=estate_id, verification_status="VERIFIED").select_related("user")

        results = []
        for levy in active_levies:
            receipts = PaymentReceipt.objects.filter(levy=levy, status=PaymentReceipt.Status.SUCCESS).exclude(payment_method=PaymentReceipt.PaymentMethod.SIMULATED_TEST)
            paid_user_ids = set(receipts.values_list("resident_id", flat=True))

            paid_units = []
            unpaid_units = []

            for m in memberships:
                unit_info = {
                    "resident_id": m.user.id,
                    "resident_name": m.user.get_full_name(),
                    "email": m.user.email,
                    "unit_address": m.unit_address or "Resident Unit",
                }
                if m.user.id in paid_user_ids:
                    paid_units.append(unit_info)
                else:
                    unpaid_units.append(unit_info)

            results.append({
                "levy": EstateLevySerializer(levy).data,
                "total_expected": len(memberships) * float(levy.amount),
                "total_collected": float(len(paid_units) * float(levy.amount)),
                "paid_count": len(paid_units),
                "unpaid_count": len(unpaid_units),
                "paid_units": paid_units,
                "unpaid_units": unpaid_units,
            })

        return Response(results)


# ==========================================
# ESTATE ADMIN ENDPOINTS
# ==========================================

class AdminPendingMembershipsView(generics.ListAPIView):
    """Estate Admin view: list all pending resident applications for approval."""

    serializer_class = EstateMembershipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        membership = self.request.user.estate_memberships.first()
        if not membership:
            return EstateMembership.objects.none()
        return EstateMembership.objects.filter(
            estate_id=membership.estate_id,
            verification_status=EstateMembership.VerificationStatus.PENDING
        ).select_related("user", "estate")


class AdminVerifyMembershipView(APIView):
    """Estate Admin approves & verifies a pending resident."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        membership = generics.get_object_or_404(EstateMembership, pk=pk)
        membership.verification_status = EstateMembership.VerificationStatus.VERIFIED
        membership.verified_at = timezone.now()
        membership.verified_by = request.user
        membership.save(update_fields=["verification_status", "verified_at", "verified_by"])

        # Flip user status to VERIFIED
        user = membership.user
        user.status = User.Status.VERIFIED
        user.save(update_fields=["status"])

        return Response(EstateMembershipSerializer(membership).data)


class AdminRotateGateCodeView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEstateAdmin]

    def post(self, request):
        estate_id = get_verified_estate_id(request.user)
        with transaction.atomic():
            estate = Estate.objects.select_for_update().get(pk=estate_id)
            previous = estate.daily_gate_code
            while estate.daily_gate_code == previous:
                estate.daily_gate_code = generate_gate_code()
            estate.save(update_fields=["daily_gate_code", "gate_code_updated_at"])
        logging.getLogger("yardly.estates").info("gate_code_rotated estate_id=%s user_id=%s", estate.pk, request.user.pk)
        return Response(AdminAccessCodeSerializer(estate).data)


class AdminUpdateInviteCodeView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsEstateAdmin]

    def post(self, request):
        estate_id = get_verified_estate_id(request.user)
        payload = {"invite_code": str(request.data.get("invite_code", "")).strip().upper()}
        serializer = UpdateInviteCodeSerializer(data=payload, context={"estate_id": estate_id})
        serializer.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                estate = Estate.objects.select_for_update().get(pk=estate_id)
                estate.invite_code = serializer.validated_data["invite_code"]
                estate.save(update_fields=["invite_code"])
        except IntegrityError:
            raise ValidationError({"invite_code": ["This invite code is already in use. Choose another."]})
        logging.getLogger("yardly.estates").info("invite_code_updated estate_id=%s user_id=%s", estate.pk, request.user.pk)
        return Response(AdminAccessCodeSerializer(estate).data)


class AdminMaintenanceListView(generics.ListAPIView):
    """Estate Admin view: list all maintenance tickets in the estate."""

    serializer_class = MaintenanceTicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        membership = self.request.user.estate_memberships.first()
        if not membership:
            return MaintenanceTicket.objects.none()
        return MaintenanceTicket.objects.filter(estate_id=membership.estate_id).select_related("resident")


class AdminMaintenanceUpdateView(APIView):
    """Estate Admin updates a maintenance ticket status (OPEN -> IN_PROGRESS -> RESOLVED)."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        ticket = generics.get_object_or_404(MaintenanceTicket, pk=pk)
        new_status = request.data.get("status")
        if new_status in dict(MaintenanceTicket.Status.choices):
            ticket.status = new_status
            ticket.save(update_fields=["status", "updated_at"])
        return Response(MaintenanceTicketSerializer(ticket).data)
