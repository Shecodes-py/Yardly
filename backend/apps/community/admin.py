from django.contrib import admin
from .models import ClassifiedItem, FeedItem


@admin.register(FeedItem)
class FeedItemAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "author", "estate", "created_at")
    list_filter = ("category", "estate")
    search_fields = ("title", "content", "author__email")


@admin.register(ClassifiedItem)
class ClassifiedItemAdmin(admin.ModelAdmin):
    list_display = ("title", "price", "category", "condition", "seller", "estate", "status", "created_at")
    list_filter = ("category", "status", "condition", "estate")
    search_fields = ("title", "description", "seller__email")
