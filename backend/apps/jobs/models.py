from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class Category(models.Model):
    """Database-driven job categories (section 9 of the PRD)."""

    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Icon identifier used by the frontend")
    active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Job(models.Model):
    """A task posted by a resident. State transitions are validated in transition_to()."""

    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        ASSIGNED = "ASSIGNED", "Assigned"
        IN_PROGRESS = "IN_PROGRESS", "In progress"
        COMPLETED = "COMPLETED", "Completed"
        CLOSED = "CLOSED", "Closed"
        CANCELLED = "CANCELLED", "Cancelled"
        DISPUTED = "DISPUTED", "Disputed"

    # Valid forward transitions. CANCELLED/DISPUTED are reachable from most
    # active states and are handled separately in transition_to().
    ALLOWED_TRANSITIONS = {
        Status.OPEN: {Status.ASSIGNED, Status.CANCELLED},
        Status.ASSIGNED: {Status.IN_PROGRESS, Status.CANCELLED, Status.DISPUTED},
        Status.IN_PROGRESS: {Status.COMPLETED, Status.DISPUTED, Status.CANCELLED},
        Status.COMPLETED: {Status.CLOSED, Status.DISPUTED},
        Status.CLOSED: set(),
        Status.CANCELLED: set(),
        Status.DISPUTED: {Status.CLOSED, Status.CANCELLED},
    }

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="posted_jobs"
    )
    estate = models.ForeignKey("estates.Estate", on_delete=models.CASCADE, related_name="jobs")
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="jobs")
    assigned_worker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="assigned_jobs",
    )

    title = models.CharField(max_length=150)
    description = models.TextField()
    budget = models.DecimalField(max_digits=10, decimal_places=2)
    preferred_date = models.DateField()
    preferred_time = models.TimeField()

    # Shown publicly in the feed, e.g. "Chevron Estate — Zone B".
    approximate_location = models.CharField(max_length=255)
    # Only ever exposed to the assigned worker after ASSIGNED.
    exact_location = models.CharField(max_length=255, blank=True)

    required_skills = models.CharField(max_length=255, blank=True)
    workers_needed = models.PositiveSmallIntegerField(default=1)

    status = models.CharField(max_length=15, choices=Status.choices, default=Status.OPEN)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    assigned_at = models.DateTimeField(blank=True, null=True)
    started_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    closed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} [{self.status}]"

    def can_transition_to(self, new_status):
        return new_status in self.ALLOWED_TRANSITIONS.get(self.status, set())

    def transition_to(self, new_status, save=True):
        if not self.can_transition_to(new_status):
            raise ValidationError(
                f"Cannot transition job from {self.status} to {new_status}."
            )
        self.status = new_status
        if save:
            self.save(update_fields=["status", "updated_at"])
        return self


class JobImage(models.Model):
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="job_images/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for {self.job_id}"
