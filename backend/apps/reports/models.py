from django.conf import settings
from django.db import models


class Report(models.Model):
    """A safety report against a user or job (section 20)."""

    class Reason(models.TextChoices):
        HARASSMENT = "HARASSMENT", "Harassment"
        FRAUD = "FRAUD", "Fraud"
        UNSAFE_BEHAVIOUR = "UNSAFE_BEHAVIOUR", "Unsafe behaviour"
        INAPPROPRIATE_TASK = "INAPPROPRIATE_TASK", "Inappropriate task"
        THEFT = "THEFT", "Theft"
        PAYMENT_DISPUTE = "PAYMENT_DISPUTE", "Payment dispute"
        OTHER = "OTHER", "Other"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        UNDER_REVIEW = "UNDER_REVIEW", "Under review"
        RESOLVED = "RESOLVED", "Resolved"
        DISMISSED = "DISMISSED", "Dismissed"

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reports_filed"
    )
    reported_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reports_received"
    )
    job = models.ForeignKey(
        "jobs.Job", on_delete=models.CASCADE, blank=True, null=True, related_name="reports"
    )
    reason = models.CharField(max_length=25, choices=Reason.choices)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Report by {self.reporter} on {self.reported_user} ({self.reason})"


class Block(models.Model):
    """One user blocking another (section 20)."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="blocks_made"
    )
    blocked_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="blocked_by"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "blocked_user")

    def __str__(self):
        return f"{self.user} blocked {self.blocked_user}"
