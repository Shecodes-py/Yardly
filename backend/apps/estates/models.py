import uuid
from django.conf import settings
from django.db import models


def generate_invite_code():
    return uuid.uuid4().hex[:8].upper()


def generate_gate_code():
    return f"GATE-{uuid.uuid4().hex[:4].upper()}"


def generate_receipt_ref():
    return f"REC-{uuid.uuid4().hex[:8].upper()}"


class Estate(models.Model):
    """A gated residential community. Discovery, services, and security are scoped to one."""

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"

    name = models.CharField(max_length=150)
    location = models.CharField(max_length=255)
    invite_code = models.CharField(max_length=20, unique=True, default=generate_invite_code)
    daily_gate_code = models.CharField(max_length=20, default=generate_gate_code)
    gate_code_updated_at = models.DateTimeField(auto_now=True)
    rules_document = models.TextField(blank=True, help_text="Estate rules, guidelines, and notices")
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
    unit_address = models.CharField(max_length=150, blank=True, help_text="House / Flat / House number")
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


class EmergencyContact(models.Model):
    """Emergency numbers (Gate desk, Fire, Police, Ambulance) for an estate."""

    estate = models.ForeignKey(Estate, on_delete=models.CASCADE, related_name="emergency_contacts")
    title = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=30)
    description = models.CharField(max_length=255, blank=True)
    is_gate_desk = models.BooleanField(default=False)

    class Meta:
        ordering = ["-is_gate_desk", "title"]

    def __str__(self):
        return f"{self.title} - {self.phone_number} ({self.estate.name})"


class MaintenanceTicket(models.Model):
    """Maintenance or complaint ticket submitted by a resident."""

    class IssueType(models.TextChoices):
        WATER = "WATER", "Water / Plumbing"
        POWER = "POWER", "Power / Electrical"
        GATE = "GATE", "Gate / Access"
        SECURITY = "SECURITY", "Security Concern"
        INFRASTRUCTURE = "INFRASTRUCTURE", "Roads / Infrastructure"
        OTHER = "OTHER", "Other Complaint"

    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        RESOLVED = "RESOLVED", "Resolved"
        CLOSED = "CLOSED", "Closed"

    resident = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="maintenance_tickets"
    )
    estate = models.ForeignKey(Estate, on_delete=models.CASCADE, related_name="maintenance_tickets")
    issue_type = models.CharField(max_length=20, choices=IssueType.choices, default=IssueType.OTHER)
    title = models.CharField(max_length=150)
    description = models.TextField()
    location = models.CharField(max_length=255, blank=True, help_text="Block / House number affected")
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.OPEN)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.issue_type}] {self.title} - {self.status}"


class EstateLevy(models.Model):
    """Monthly dues or special levies defined by the Estate Admin."""

    estate = models.ForeignKey(Estate, on_delete=models.CASCADE, related_name="levies")
    title = models.CharField(max_length=150, help_text="e.g. October 2026 Security & Facility Maintenance Levy")
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=15000.00)
    month_year = models.CharField(max_length=30, help_text="e.g. OCTOBER 2026")
    due_date = models.DateField()
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} (₦{self.amount})"


class PaymentReceipt(models.Model):
    """Automated digital stamped receipt generated upon online levy payment."""

    class PaymentMethod(models.TextChoices):
        PAYSTACK = "PAYSTACK", "Paystack Online"
        SIMULATED_TEST = "SIMULATED_TEST", "Test Simulation Mode"
        BANK_TRANSFER = "BANK_TRANSFER", "Bank Transfer"

    class Status(models.TextChoices):
        SUCCESS = "SUCCESS", "Success / Paid"
        PENDING = "PENDING", "Pending"
        FAILED = "FAILED", "Failed"

    levy = models.ForeignKey(EstateLevy, on_delete=models.CASCADE, related_name="receipts")
    resident = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="payment_receipts")
    estate = models.ForeignKey(Estate, on_delete=models.CASCADE, related_name="receipts")
    unit_address = models.CharField(max_length=150)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    reference = models.CharField(max_length=50, unique=True, default=generate_receipt_ref)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.SIMULATED_TEST)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.SUCCESS)
    paid_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-paid_at"]
        unique_together = ("levy", "resident")

    def __str__(self):
        return f"Receipt {self.reference} - {self.resident} ({self.levy.month_year}) [PAID]"
