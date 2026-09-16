from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user. Email + phone are the primary contact channels."""

    class Status(models.TextChoices):
        UNVERIFIED = "UNVERIFIED", "Unverified"
        PENDING_VERIFICATION = "PENDING_VERIFICATION", "Pending verification"
        VERIFIED = "VERIFIED", "Verified"
        SUSPENDED = "SUSPENDED", "Suspended"
        BANNED = "BANNED", "Banned"

    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, unique=True)
    profile_picture = models.ImageField(upload_to="profile_pictures/", blank=True, null=True)
    bio = models.CharField(max_length=280, blank=True)
    status = models.CharField(max_length=25, choices=Status.choices, default=Status.UNVERIFIED)
    phone_verified_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "phone_number", "first_name", "last_name"]

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.email})"

    @property
    def is_verified(self):
        return self.status == self.Status.VERIFIED

    @property
    def can_transact(self):
        return self.status in {self.Status.VERIFIED}


class WorkerProfile(models.Model):
    """Extra profile data for a user acting as a tasker/worker."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="worker_profile")
    skills = models.ManyToManyField("jobs.Category", blank=True, related_name="skilled_workers")
    availability_note = models.CharField(max_length=280, blank=True)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    completed_jobs_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"WorkerProfile<{self.user}>"
