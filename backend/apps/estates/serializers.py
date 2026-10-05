from rest_framework import serializers

from .models import EmergencyContact, Estate, EstateLevy, EstateMembership, MaintenanceTicket, PaymentReceipt


class EstateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estate
        fields = ["id", "name", "location", "invite_code", "status", "rules_document"]


class EstateGateCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estate
        fields = ["id", "name", "daily_gate_code", "gate_code_updated_at"]


class EstateMembershipSerializer(serializers.ModelSerializer):
    estate = EstateSerializer(read_only=True)

    class Meta:
        model = EstateMembership
        fields = ["id", "estate", "unit_address", "verification_status", "verified_at", "created_at"]


class JoinEstateSerializer(serializers.Serializer):
    invite_code = serializers.CharField()
    unit_address = serializers.CharField(required=False, allow_blank=True)

    def validate_invite_code(self, value):
        try:
            self.estate = Estate.objects.get(invite_code__iexact=value, status=Estate.Status.ACTIVE)
        except Estate.DoesNotExist:
            raise serializers.ValidationError("Invalid estate invite code.")
        return value

    def save(self):
        user = self.context["request"].user
        unit_address = self.validated_data.get("unit_address", "")
        membership, created = EstateMembership.objects.get_or_create(
            user=user, estate=self.estate,
            defaults={"unit_address": unit_address}
        )
        if not created and unit_address:
            membership.unit_address = unit_address
            membership.save(update_fields=["unit_address"])
        return membership


class EmergencyContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmergencyContact
        fields = ["id", "title", "phone_number", "description", "is_gate_desk"]


class MaintenanceTicketSerializer(serializers.ModelSerializer):
    resident_name = serializers.CharField(source="resident.get_full_name", read_only=True)

    class Meta:
        model = MaintenanceTicket
        fields = [
            "id", "resident", "resident_name", "issue_type", "title",
            "description", "location", "status", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "resident", "status", "created_at", "updated_at"]


class MaintenanceTicketCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaintenanceTicket
        fields = ["issue_type", "title", "description", "location"]


class EstateLevySerializer(serializers.ModelSerializer):
    class Meta:
        model = EstateLevy
        fields = ["id", "title", "amount", "month_year", "due_date", "description", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]


class PaymentReceiptSerializer(serializers.ModelSerializer):
    levy_title = serializers.CharField(source="levy.title", read_only=True)
    month_year = serializers.CharField(source="levy.month_year", read_only=True)
    resident_name = serializers.CharField(source="resident.get_full_name", read_only=True)

    class Meta:
        model = PaymentReceipt
        fields = [
            "id", "levy", "levy_title", "month_year", "resident", "resident_name",
            "unit_address", "amount_paid", "reference", "payment_method",
            "status", "paid_at"
        ]
        read_only_fields = ["id", "reference", "paid_at"]


class AdminAccessCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estate
        fields = ["id", "name", "invite_code", "daily_gate_code", "gate_code_updated_at"]


class UpdateInviteCodeSerializer(serializers.Serializer):
    invite_code = serializers.RegexField(r"^[A-Z0-9_-]{4,20}$", max_length=20)

    def validate_invite_code(self, value):
        estate_id = self.context["estate_id"]
        if Estate.objects.filter(invite_code__iexact=value).exclude(pk=estate_id).exists():
            raise serializers.ValidationError("This invite code is already in use. Choose another.")
        return value
