from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsVerifiedResident, get_verified_estate_id
from apps.notifications.services import notify

from .models import DeliveryPass, SecurityAlert, VisitorPass
from .serializers import (
    DeliveryPassCreateSerializer,
    DeliveryPassSerializer,
    SecurityAlertCreateSerializer,
    SecurityAlertSerializer,
    VisitorPassCreateSerializer,
    VisitorPassSerializer,
)


class VisitorPassListCreateView(generics.ListCreateAPIView):
    """List visitor passes for the resident's estate; create a pass (requires IsVerifiedResident)."""

    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated(), IsVerifiedResident()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        return VisitorPassCreateSerializer if self.request.method == "POST" else VisitorPassSerializer

    def get_queryset(self):
        estate_id = get_verified_estate_id(self.request.user)
        if not estate_id:
            return VisitorPass.objects.none()
        return VisitorPass.objects.filter(estate_id=estate_id, resident=self.request.user)

    def create(self, request, *args, **kwargs):
        estate_id = get_verified_estate_id(request.user)
        if not estate_id:
            raise PermissionDenied("You must be a verified resident of an estate to create a visitor pass.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        visitor_pass = serializer.save(resident=request.user, estate_id=estate_id)

        return Response(VisitorPassSerializer(visitor_pass).data, status=201)


class VisitorPassCancelView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsVerifiedResident]

    def post(self, request, pk):
        estate_id = get_verified_estate_id(request.user)
        visitor_pass = generics.get_object_or_404(VisitorPass, pk=pk, estate_id=estate_id)
        if visitor_pass.resident_id != request.user.id:
            raise PermissionDenied("You can only cancel your own visitor pass.")
        visitor_pass.status = VisitorPass.Status.CANCELLED
        visitor_pass.save(update_fields=["status"])
        return Response(VisitorPassSerializer(visitor_pass).data)


class VisitorPassCheckInView(APIView):
    """Security Guard or System check-in endpoint for a visitor pass."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pass_code):
        estate_id = get_verified_estate_id(request.user)
        visitor_pass = generics.get_object_or_404(VisitorPass, pass_code__iexact=pass_code, estate_id=estate_id)
        if visitor_pass.status != VisitorPass.Status.PENDING:
            raise ValidationError(f"Pass is not pending entry (current status: {visitor_pass.status}).")
        
        visitor_pass.status = VisitorPass.Status.CHECKED_IN
        visitor_pass.checked_in_at = timezone.now()
        visitor_pass.save(update_fields=["status", "checked_in_at"])

        notify(
            visitor_pass.resident,
            "VISITOR_CHECKED_IN",
            f"Your visitor '{visitor_pass.visitor_name}' has checked in at the gate.",
        )

        return Response(VisitorPassSerializer(visitor_pass).data)


class GuardPassListView(generics.ListAPIView):
    """Gateman view: list all active/today's visitor passes in the estate."""

    serializer_class = VisitorPassSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        estate_id = get_verified_estate_id(self.request.user)
        if not estate_id:
            return VisitorPass.objects.none()
        qs = VisitorPass.objects.filter(estate_id=estate_id).select_related("resident")
        if search := self.request.query_params.get("search"):
            qs = qs.filter(visitor_name__icontains=search) | qs.filter(pass_code__icontains=search)
        return qs


class DeliveryPassListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated(), IsVerifiedResident()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        return DeliveryPassCreateSerializer if self.request.method == "POST" else DeliveryPassSerializer

    def get_queryset(self):
        estate_id = get_verified_estate_id(self.request.user)
        if not estate_id:
            return DeliveryPass.objects.none()
        return DeliveryPass.objects.filter(estate_id=estate_id)

    def create(self, request, *args, **kwargs):
        estate_id = get_verified_estate_id(request.user)
        if not estate_id:
            raise PermissionDenied("Must be a verified resident to register expected deliveries.")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        delivery_pass = serializer.save(resident=request.user, estate_id=estate_id)
        return Response(DeliveryPassSerializer(delivery_pass).data, status=201)


class GuardDeliveryArrivedView(APIView):
    """Gateman marks delivery rider as arrived at the gate."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        estate_id = get_verified_estate_id(request.user)
        delivery = generics.get_object_or_404(DeliveryPass, pk=pk, estate_id=estate_id)
        delivery.status = DeliveryPass.Status.ARRIVED
        delivery.arrived_at = timezone.now()
        delivery.save(update_fields=["status", "arrived_at"])

        notify(
            delivery.resident,
            "DELIVERY_ARRIVED",
            f"Your {delivery.company_name} rider ({delivery.rider_name or 'Rider'}) has arrived at the gate.",
        )

        return Response(DeliveryPassSerializer(delivery).data)


class SecurityAlertListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        return SecurityAlertCreateSerializer if self.request.method == "POST" else SecurityAlertSerializer

    def get_queryset(self):
        estate_id = get_verified_estate_id(self.request.user)
        if not estate_id:
            return SecurityAlert.objects.none()
        return SecurityAlert.objects.filter(estate_id=estate_id).select_related("reporter")

    def create(self, request, *args, **kwargs):
        estate_id = get_verified_estate_id(request.user)
        if not estate_id:
            raise PermissionDenied("Must be a resident of an estate to raise a security alert.")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        alert = serializer.save(reporter=request.user, estate_id=estate_id)
        return Response(SecurityAlertSerializer(alert).data, status=201)
