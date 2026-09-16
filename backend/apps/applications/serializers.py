from rest_framework import serializers

from apps.jobs.serializers import JobListSerializer
from apps.users.serializers import UserSerializer

from .models import JobApplication


class JobApplicationSerializer(serializers.ModelSerializer):
    worker = UserSerializer(read_only=True)

    class Meta:
        model = JobApplication
        fields = ["id", "job", "worker", "message", "proposed_price", "status", "created_at"]
        read_only_fields = ["job", "status"]


class MyApplicationSerializer(serializers.ModelSerializer):
    """A worker's own application, with the job summary nested in — used by
    the 'My Work' screen to show tasks applied to but not yet assigned."""

    job = JobListSerializer(read_only=True)

    class Meta:
        model = JobApplication
        fields = ["id", "job", "message", "proposed_price", "status", "created_at"]


class JobApplicationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobApplication
        fields = ["message", "proposed_price"]
