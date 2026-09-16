from rest_framework import serializers

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source="reviewer.get_full_name", read_only=True)

    class Meta:
        model = Review
        fields = ["id", "job", "reviewer", "reviewer_name", "reviewee", "rating", "comment", "created_at"]
        read_only_fields = ["job", "reviewer", "reviewee"]


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ["rating", "comment"]
