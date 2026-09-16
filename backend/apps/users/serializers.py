from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from apps.estates.models import Estate, EstateMembership

from .models import User, WorkerProfile


class WorkerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkerProfile
        fields = ["skills", "availability_note", "average_rating", "completed_jobs_count"]
        read_only_fields = ["average_rating", "completed_jobs_count"]


class UserSerializer(serializers.ModelSerializer):
    worker_profile = WorkerProfileSerializer(read_only=True)
    estate = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "first_name", "last_name", "email", "phone_number",
            "profile_picture", "bio", "status", "created_at",
            "worker_profile", "estate",
        ]
        read_only_fields = ["id", "status", "created_at"]

    def get_estate(self, obj):
        membership = obj.estate_memberships.select_related("estate").first()
        if not membership:
            return None
        return {
            "id": membership.estate_id,
            "name": membership.estate.name,
            "verification_status": membership.verification_status,
        }


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    invite_code = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "first_name", "last_name", "email", "phone_number",
            "password", "invite_code",
        ]

    def validate_invite_code(self, value):
        try:
            self.estate = Estate.objects.get(invite_code__iexact=value, status=Estate.Status.ACTIVE)
        except Estate.DoesNotExist:
            raise serializers.ValidationError("Invalid estate invite code.")
        return value

    def create(self, validated_data):
        validated_data.pop("invite_code")
        password = validated_data.pop("password")
        user = User(username=validated_data["email"], **validated_data)
        user.set_password(password)
        user.status = User.Status.PENDING_VERIFICATION
        user.save()
        EstateMembership.objects.create(user=user, estate=self.estate)
        WorkerProfile.objects.create(user=user)
        return user
