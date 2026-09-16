from rest_framework import serializers

from .models import Estate, EstateMembership


class EstateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estate
        fields = ["id", "name", "location", "status"]


class EstateMembershipSerializer(serializers.ModelSerializer):
    estate = EstateSerializer(read_only=True)

    class Meta:
        model = EstateMembership
        fields = ["id", "estate", "verification_status", "verified_at", "created_at"]


class JoinEstateSerializer(serializers.Serializer):
    invite_code = serializers.CharField()

    def validate_invite_code(self, value):
        try:
            self.estate = Estate.objects.get(invite_code__iexact=value, status=Estate.Status.ACTIVE)
        except Estate.DoesNotExist:
            raise serializers.ValidationError("Invalid estate invite code.")
        return value

    def save(self):
        user = self.context["request"].user
        membership, _ = EstateMembership.objects.get_or_create(user=user, estate=self.estate)
        return membership
