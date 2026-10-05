from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from apps.estates.models import Estate, EstateMembership

from .models import HouseholdAudit, User, WorkerProfile


class WorkerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkerProfile
        fields = ["skills", "availability_note", "average_rating", "completed_jobs_count"]
        read_only_fields = ["average_rating", "completed_jobs_count"]


class HouseholdAuditSerializer(serializers.ModelSerializer):
    class Meta:
        model = HouseholdAudit
        fields = [
            "id", "unit_address", "occupant_type", "occupant_count",
            "next_of_kin_name", "next_of_kin_relationship", "next_of_kin_phone",
            "vehicle_plates", "is_completed", "created_at"
        ]
        read_only_fields = ["id", "is_completed", "created_at"]


class UserSerializer(serializers.ModelSerializer):
    worker_profile = WorkerProfileSerializer(read_only=True)
    household_audit = HouseholdAuditSerializer(read_only=True)
    estate = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "first_name", "last_name", "email", "phone_number", "role",
            "profile_picture", "bio", "status", "created_at",
            "worker_profile", "household_audit", "estate",
        ]
        read_only_fields = ["id", "role", "status", "created_at"]

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
    role = serializers.ChoiceField(choices=User.Role.choices, default=User.Role.RESIDENT)

    class Meta:
        model = User
        fields = [
            "first_name", "last_name", "email", "phone_number", "role",
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
        role = validated_data.get("role", User.Role.RESIDENT)

        user = User(username=validated_data["email"], **validated_data)
        user.set_password(password)

        if role == User.Role.RESIDENT:
            user.status = User.Status.PENDING_AUDIT
        else:
            user.status = User.Status.PENDING_APPROVAL

        user.save()
        EstateMembership.objects.create(user=user, estate=self.estate)
        WorkerProfile.objects.create(user=user)
        return user
