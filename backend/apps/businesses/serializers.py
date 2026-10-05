from rest_framework import serializers
from apps.users.serializers import UserSerializer
from .models import BusinessCategory, BusinessInquiry, BusinessProfile, BusinessReview


class BusinessCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessCategory
        fields = ["id", "name", "icon", "active"]


class BusinessReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source="reviewer.get_full_name", read_only=True)

    class Meta:
        model = BusinessReview
        fields = ["id", "reviewer", "reviewer_name", "rating", "comment", "created_at"]
        read_only_fields = ["id", "reviewer", "created_at"]


class BusinessProfileSerializer(serializers.ModelSerializer):
    category = BusinessCategorySerializer(read_only=True)
    owner = UserSerializer(read_only=True)

    class Meta:
        model = BusinessProfile
        fields = [
            "id", "owner", "category", "name", "tagline", "description",
            "phone_number", "whatsapp_number", "address_or_unit", "opening_hours",
            "is_promoted", "photo", "average_rating", "review_count", "created_at"
        ]
        read_only_fields = ["id", "owner", "average_rating", "review_count", "created_at"]


class BusinessProfileCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessProfile
        fields = [
            "category", "name", "tagline", "description", "phone_number",
            "whatsapp_number", "address_or_unit", "opening_hours", "photo"
        ]


class BusinessInquirySerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.get_full_name", read_only=True)

    class Meta:
        model = BusinessInquiry
        fields = ["id", "business", "sender", "sender_name", "message", "created_at"]
        read_only_fields = ["id", "sender", "created_at"]
