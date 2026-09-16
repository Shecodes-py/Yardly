from django.conf import settings
from django.db import models


class Notification(models.Model):
    """In-app / push notification (section 22)."""

    class Type(models.TextChoices):
        NEW_RELEVANT_JOB = "NEW_RELEVANT_JOB", "New relevant job"
        NEW_APPLICATION = "NEW_APPLICATION", "Someone applied"
        APPLICATION_ACCEPTED = "APPLICATION_ACCEPTED", "Application accepted"
        APPLICATION_REJECTED = "APPLICATION_REJECTED", "Application rejected"
        JOB_STARTED = "JOB_STARTED", "Job starting"
        JOB_MARKED_COMPLETE = "JOB_MARKED_COMPLETE", "Worker marked job complete"
        COMPLETION_CONFIRMED = "COMPLETION_CONFIRMED", "Completion confirmed"
        PAYMENT_SENT = "PAYMENT_SENT", "Payment marked sent"
        PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED", "Payment confirmed"
        NEW_REVIEW = "NEW_REVIEW", "New review"
        JOB_CANCELLED = "JOB_CANCELLED", "Job cancelled"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    type = models.CharField(max_length=30, choices=Type.choices)
    title = models.CharField(max_length=150)
    body = models.CharField(max_length=500, blank=True)
    related_job = models.ForeignKey(
        "jobs.Job", on_delete=models.CASCADE, blank=True, null=True, related_name="notifications"
    )
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.type} -> {self.user}"
