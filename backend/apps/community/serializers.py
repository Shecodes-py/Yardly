from rest_framework import serializers
from apps.users.serializers import UserSerializer
from .models import ClassifiedItem, FeedItem


class FeedItemSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = FeedItem
        fields = ["id", "author", "category", "title", "content", "image", "created_at", "updated_at"]
        read_only_fields = ["id", "author", "created_at", "updated_at"]


class FeedItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeedItem
        fields = ["category", "title", "content", "image"]


class ClassifiedItemSerializer(serializers.ModelSerializer):
    seller = UserSerializer(read_only=True)

    class Meta:
        model = ClassifiedItem
        fields = [
            "id", "seller", "title", "description", "price", "condition",
            "category", "status", "contact_phone", "image", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "seller", "created_at", "updated_at"]


class ClassifiedItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassifiedItem
        fields = ["title", "description", "price", "condition", "category", "contact_phone", "image"]
