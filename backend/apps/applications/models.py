from django.conf import settings
from django.db import models


class JobApplication(models.Model):
    """A worker's bid to be selected for a job (section 13)."""

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACCEPTED = "ACCEPTED", "Accepted"
        REJECTED = "REJECTED", "Rejected"
        WITHDRAWN = "WITHDRAWN", "Withdrawn"

    job = models.ForeignKey("jobs.Job", on_delete=models.CASCADE, related_name="applications")
    worker = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="job_applications"
    )
    message = models.CharField(max_length=500, blank=True)
    proposed_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("job", "worker")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.worker} -> {self.job} ({self.status})"
