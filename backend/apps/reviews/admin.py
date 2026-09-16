from django.contrib import admin

from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("job", "reviewer", "reviewee", "rating", "created_at")
    list_filter = ("rating",)
    search_fields = ("job__title", "reviewer__email", "reviewee__email")
