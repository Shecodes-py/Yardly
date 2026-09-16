import uuid

from django.conf import settings
from django.db import models


def generate_invite_code():
    return uuid.uuid4().hex[:8].upper()


class Estate(models.Model):
    """A gated residential community. Discovery and jobs are scoped to one."""

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"

    name = models.CharField(max_length=150)
    location = models.CharField(max_length=255)
    invite_code = models.CharField(max_length=20, unique=True, default=generate_invite_code)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class EstateMembership(models.Model):
    """Links a user to an estate they belong to, with verification state."""

    class VerificationStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        VERIFIED = "VERIFIED", "Verified"
        REJECTED = "REJECTED", "Rejected"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="estate_memberships"
    )
    estate = models.ForeignKey(Estate, on_delete=models.CASCADE, related_name="memberships")
    verification_status = models.CharField(
        max_length=10, choices=VerificationStatus.choices, default=VerificationStatus.PENDING
    )
    verified_at = models.DateTimeField(blank=True, null=True)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="verifications_performed",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "estate")

    def __str__(self):
        return f"{self.user} @ {self.estate} ({self.verification_status})"
