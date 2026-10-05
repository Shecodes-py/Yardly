from django.conf import settings
from django.db import models


class FeedItem(models.Model):
    """Community posts: announcements, lost & found, recommendations, events, notices."""

    class Category(models.TextChoices):
        ANNOUNCEMENT = "ANNOUNCEMENT", "Official Announcement"
        LOST_FOUND = "LOST_FOUND", "Lost & Found"
        RECOMMENDATION = "RECOMMENDATION", "Recommendation"
        EVENT = "EVENT", "Estate Event"
        NOTICE = "NOTICE", "Community Notice"
        GENERAL = "GENERAL", "General Post"

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="feed_posts"
    )
    estate = models.ForeignKey("estates.Estate", on_delete=models.CASCADE, related_name="feed_posts")
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.GENERAL)
    title = models.CharField(max_length=150)
    content = models.TextField()
    image = models.ImageField(upload_to="feed_images/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.category}] {self.title}"


class ClassifiedItem(models.Model):
    """Estate Buy & Sell classifieds (furniture, electronics, food, giveaways)."""

    class Condition(models.TextChoices):
        NEW = "NEW", "Brand New"
        LIKE_NEW = "LIKE_NEW", "Like New"
        USED = "USED", "Fairly Used"

    class Category(models.TextChoices):
        FURNITURE = "FURNITURE", "Furniture & Home"
        ELECTRONICS = "ELECTRONICS", "Electronics & Appliances"
        FOOD_GROCERIES = "FOOD_GROCERIES", "Food & Homemade Items"
        KIDS_BABY = "KIDS_BABY", "Kids & Baby"
        GIVEAWAY = "GIVEAWAY", "Free / Giveaway"
        OTHER = "OTHER", "Other Items"

    class Status(models.TextChoices):
        AVAILABLE = "AVAILABLE", "Available"
        RESERVED = "RESERVED", "Reserved"
        SOLD = "SOLD", "Sold"

    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="classified_items"
    )
    estate = models.ForeignKey("estates.Estate", on_delete=models.CASCADE, related_name="classified_items")
    title = models.CharField(max_length=150)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="0 for free giveaways")
    condition = models.CharField(max_length=15, choices=Condition.choices, default=Condition.USED)
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.OTHER)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.AVAILABLE)
    contact_phone = models.CharField(max_length=30, blank=True)
    image = models.ImageField(upload_to="classified_images/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} - ₦{self.price} ({self.status})"
