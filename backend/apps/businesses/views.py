from django.db.models import Avg, Count
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsVerifiedResident, get_verified_estate_id

from .models import BusinessCategory, BusinessInquiry, BusinessProfile, BusinessReview
from .serializers import (
    BusinessCategorySerializer,
    BusinessInquirySerializer,
    BusinessProfileCreateSerializer,
    BusinessProfileSerializer,
    BusinessReviewSerializer,
)


class BusinessCategoryListView(generics.ListAPIView):
    queryset = BusinessCategory.objects.filter(active=True)
    serializer_class = BusinessCategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class BusinessProfileListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method == "POST":
            return [permissions.IsAuthenticated(), IsVerifiedResident()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        return BusinessProfileCreateSerializer if self.request.method == "POST" else BusinessProfileSerializer

    def get_queryset(self):
        estate_id = get_verified_estate_id(self.request.user)
        if not estate_id:
            return BusinessProfile.objects.none()

        qs = BusinessProfile.objects.filter(estate_id=estate_id).select_related("category", "owner")
        
        params = self.request.query_params
        if category := params.get("category"):
            qs = qs.filter(category_id=category)
        if promoted := params.get("promoted"):
            qs = qs.filter(is_promoted=(promoted.lower() == "true"))
        if search := params.get("search"):
            qs = qs.filter(name__icontains=search)

        return qs

    def create(self, request, *args, **kwargs):
        estate_id = get_verified_estate_id(request.user)
        if not estate_id:
            raise PermissionDenied("Must be a verified resident to register a business profile.")
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        business = serializer.save(owner=request.user, estate_id=estate_id)
        return Response(BusinessProfileSerializer(business).data, status=201)


class BusinessDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BusinessProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        estate_id = get_verified_estate_id(self.request.user)
        return BusinessProfile.objects.filter(estate_id=estate_id).select_related("category", "owner")

    def perform_update(self, serializer):
        business = self.get_object()
        if business.owner_id != self.request.user.id:
            raise PermissionDenied("Only the business owner can update this profile.")
        serializer.save()


class BusinessReviewListCreateView(generics.ListCreateAPIView):
    serializer_class = BusinessReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return BusinessReview.objects.filter(business_id=self.kwargs["business_id"]).select_related("reviewer")

    def create(self, request, *args, **kwargs):
        estate_id = get_verified_estate_id(request.user)
        business = generics.get_object_or_404(BusinessProfile, pk=self.kwargs["business_id"], estate_id=estate_id)
        
        if business.owner_id == request.user.id:
            raise ValidationError("You cannot review your own business.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = serializer.save(business=business, reviewer=request.user)

        # Update average rating and review count
        stats = BusinessReview.objects.filter(business=business).aggregate(
            avg=Avg("rating"), count=Count("id")
        )
        business.average_rating = round(stats["avg"] or 0, 2)
        business.review_count = stats["count"] or 0
        business.save(update_fields=["average_rating", "review_count"])

        return Response(BusinessReviewSerializer(review).data, status=201)


class BusinessInquiryCreateView(generics.CreateAPIView):
    serializer_class = BusinessInquirySerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        estate_id = get_verified_estate_id(self.request.user)
        business = generics.get_object_or_404(BusinessProfile, pk=self.kwargs["business_id"], estate_id=estate_id)
        serializer.save(business=business, sender=self.request.user)
