from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from apps.common.permissions import IsVerifiedResident, get_verified_estate_id

from apps.common.email import announcement_emails

from .models import ClassifiedItem, FeedItem
from .serializers import (
    ClassifiedItemCreateSerializer,
    ClassifiedItemSerializer,
    FeedItemCreateSerializer,
    FeedItemSerializer,
)


class FeedListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated(), IsVerifiedResident()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        return FeedItemCreateSerializer if self.request.method == "POST" else FeedItemSerializer

    def get_queryset(self):
        estate_id = get_verified_estate_id(self.request.user)
        if not estate_id:
            return FeedItem.objects.none()
        qs = FeedItem.objects.filter(estate_id=estate_id).select_related("author")
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category=category)
        return qs

    def create(self, request, *args, **kwargs):
        estate_id = get_verified_estate_id(request.user)
        if not estate_id:
            raise PermissionDenied("Must be a verified resident to post to the community feed.")
        email_requested = request.data.get("send_email", False)
        if not isinstance(email_requested, bool):
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"send_email": ["Must be true or false."]})
        if email_requested and (not request.user.is_estate_admin or request.data.get("category") != "ANNOUNCEMENT"):
            raise PermissionDenied("Only estate administrators can email announcements.")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = serializer.save(author=request.user, estate_id=estate_id)
        result = FeedItemSerializer(item).data
        if email_requested:
            result["email_delivery"] = announcement_emails(item)
        return Response(result, status=201)


class ClassifiedListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated(), IsVerifiedResident()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        return ClassifiedItemCreateSerializer if self.request.method == "POST" else ClassifiedItemSerializer

    def get_queryset(self):
        estate_id = get_verified_estate_id(self.request.user)
        if not estate_id:
            return ClassifiedItem.objects.none()
        qs = ClassifiedItem.objects.filter(estate_id=estate_id).select_related("seller")
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category=category)
        return qs

    def create(self, request, *args, **kwargs):
        estate_id = get_verified_estate_id(request.user)
        if not estate_id:
            raise PermissionDenied("Must be a verified resident to post classified listings.")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = serializer.save(seller=request.user, estate_id=estate_id)
        return Response(ClassifiedItemSerializer(item).data, status=201)
