from rest_framework import serializers
from apps.users.serializers import UserSerializer
from .models import DeliveryPass, SecurityAlert, VisitorPass


def extract_unit_address(user):
    if not user:
        return "Resident Unit"
    if hasattr(user, "household_audit") and user.household_audit.unit_address:
        return user.household_audit.unit_address
    membership = user.estate_memberships.first()
    if membership and membership.unit_address:
        return membership.unit_address
    return "Resident Unit"


class VisitorPassSerializer(serializers.ModelSerializer):
    resident = UserSerializer(read_only=True)
    resident_unit_address = serializers.SerializerMethodField()

    class Meta:
        model = VisitorPass
        fields = [
            "id", "resident", "resident_unit_address", "visitor_name", "visitor_phone", "pass_code",
            "expected_date", "expected_time", "vehicle_number", "notes",
            "status", "checked_in_at", "checked_out_at", "created_at"
        ]
        read_only_fields = ["id", "pass_code", "status", "checked_in_at", "checked_out_at", "created_at"]

    def get_resident_unit_address(self, obj):
        return extract_unit_address(obj.resident)


class VisitorPassCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisitorPass
        fields = ["visitor_name", "visitor_phone", "expected_date", "expected_time", "vehicle_number", "notes"]


class DeliveryPassSerializer(serializers.ModelSerializer):
    resident = UserSerializer(read_only=True)
    resident_unit_address = serializers.SerializerMethodField()

    class Meta:
        model = DeliveryPass
        fields = [
            "id", "resident", "resident_unit_address", "company_name", "rider_name", "rider_phone",
            "pass_code", "package_details", "status", "arrived_at", "created_at"
        ]
        read_only_fields = ["id", "pass_code", "status", "arrived_at", "created_at"]

    def get_resident_unit_address(self, obj):
        return extract_unit_address(obj.resident)


class DeliveryPassCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeliveryPass
        fields = ["company_name", "rider_name", "rider_phone", "package_details"]


class SecurityAlertSerializer(serializers.ModelSerializer):
    reporter = UserSerializer(read_only=True)

    class Meta:
        model = SecurityAlert
        fields = [
            "id", "reporter", "alert_type", "description", "unit_location",
            "status", "created_at"
        ]
        read_only_fields = ["id", "status", "created_at"]


class SecurityAlertCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SecurityAlert
        fields = ["alert_type", "description", "unit_location"]
