from rest_framework import serializers

from .models import Block, Report


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ["id", "reported_user", "job", "reason", "description", "status", "created_at"]
        read_only_fields = ["status"]


class BlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Block
        fields = ["id", "blocked_user", "created_at"]
