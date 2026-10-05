from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class BusinessCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, blank=True)
    active = models.BooleanField(default=True)

    class Meta:
        verbose_name_plural = "Business Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class BusinessProfile(models.Model):
    """Local vendor/service provider directory profile with ad promotion support."""

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="business_profiles"
    )
    estate = models.ForeignKey("estates.Estate", on_delete=models.CASCADE, related_name="business_profiles")
    category = models.ForeignKey(BusinessCategory, on_delete=models.PROTECT, related_name="businesses")
    name = models.CharField(max_length=150)
    tagline = models.CharField(max_length=255, blank=True, help_text="e.g. Fast & Reliable Electrical Fixes")
    description = models.TextField()
    phone_number = models.CharField(max_length=30)
    whatsapp_number = models.CharField(max_length=30, blank=True)
    address_or_unit = models.CharField(max_length=255, blank=True, help_text="e.g. Block 2, Shop 4 or Resident Unit")
    opening_hours = models.CharField(max_length=100, blank=True, help_text="e.g. Mon-Sat: 8:00 AM - 7:00 PM")
    is_promoted = models.BooleanField(default=False, help_text="Promoted featured ad flag")
    photo = models.ImageField(upload_to="business_photos/", blank=True, null=True)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    review_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_promoted", "-average_rating", "-created_at"]

    def __str__(self):
        prefix = "[AD] " if self.is_promoted else ""
        return f"{prefix}{self.name} ({self.category.name})"


class BusinessReview(models.Model):
    business = models.ForeignKey(BusinessProfile, on_delete=models.CASCADE, related_name="reviews")
    reviewer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="business_reviews")
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("business", "reviewer")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.reviewer} -> {self.business.name}: {self.rating}★"


class BusinessInquiry(models.Model):
    business = models.ForeignKey(BusinessProfile, on_delete=models.CASCADE, related_name="inquiries")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="business_inquiries")
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Inquiry from {self.sender} to {self.business.name}"
