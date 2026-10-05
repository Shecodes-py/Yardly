from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user. Email + phone are the primary contact channels."""

    class Status(models.TextChoices):
        UNVERIFIED = "UNVERIFIED", "Unverified"
        PENDING_AUDIT = "PENDING_AUDIT", "Pending Household Audit"
        PENDING_APPROVAL = "PENDING_APPROVAL", "Pending Admin Approval"
        PENDING_VERIFICATION = "PENDING_VERIFICATION", "Pending verification"
        VERIFIED = "VERIFIED", "Verified"
        SUSPENDED = "SUSPENDED", "Suspended"
        BANNED = "BANNED", "Banned"

    class Role(models.TextChoices):
        RESIDENT = "RESIDENT", "Estate Resident"
        GATE_SECURITY = "GATE_SECURITY", "Estate Security Officer"

        ESTATE_ADMIN = "ESTATE_ADMIN", "Estate Administrator"

    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, unique=True)
    role = models.CharField(max_length=25, choices=Role.choices, default=Role.RESIDENT)
    profile_picture = models.ImageField(upload_to="profile_pictures/", blank=True, null=True)
    bio = models.CharField(max_length=280, blank=True)
    status = models.CharField(max_length=25, choices=Status.choices, default=Status.UNVERIFIED)
    phone_verified_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "phone_number", "first_name", "last_name"]

    def __str__(self):
        return f"{self.get_full_name() or self.username} [{self.role}] ({self.email})"

    @property
    def is_verified(self):
        return self.status == self.Status.VERIFIED

    @property
    def can_transact(self):
        return self.status in {self.Status.VERIFIED}

    @property
    def is_gate_security(self):
        return self.role == self.Role.GATE_SECURITY

    @property
    def is_estate_admin(self):
        return self.role == self.Role.ESTATE_ADMIN or self.is_superuser


class HouseholdAudit(models.Model):
    """Mandatory onboarding audit completed by an estate resident."""

    class OccupantType(models.TextChoices):
        OWNER = "OWNER", "Home Owner"
        TENANT = "TENANT", "Tenant / Renter"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="household_audit")
    estate = models.ForeignKey("estates.Estate", on_delete=models.CASCADE, related_name="household_audits")
    unit_address = models.CharField(max_length=150, help_text="e.g. Block 4, House 12")
    occupant_type = models.CharField(max_length=15, choices=OccupantType.choices, default=OccupantType.TENANT)
    occupant_count = models.PositiveIntegerField(default=1)
    
    # Emergency Contact & Next of Kin
    next_of_kin_name = models.CharField(max_length=150)
    next_of_kin_relationship = models.CharField(max_length=50, help_text="e.g. Spouse, Parent, Sibling")
    next_of_kin_phone = models.CharField(max_length=30)
    
    # Registered Vehicles
    vehicle_plates = models.CharField(max_length=255, blank=True, help_text="Car plate numbers separated by commas")
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Audit for {self.user.get_full_name()} ({self.unit_address})"


class PasswordResetCode(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)


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
