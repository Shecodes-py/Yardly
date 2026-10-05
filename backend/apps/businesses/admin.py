from django.contrib import admin
from .models import BusinessCategory, BusinessInquiry, BusinessProfile, BusinessReview


@admin.register(BusinessCategory)
class BusinessCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "icon", "active")
    list_filter = ("active",)
    search_fields = ("name",)


@admin.register(BusinessProfile)
class BusinessProfileAdmin(admin.ModelAdmin):
    list_display = ("name", "category", "owner", "estate", "phone_number", "is_promoted", "average_rating")
    list_filter = ("is_promoted", "category", "estate")
    search_fields = ("name", "description", "phone_number")
    actions = ["make_promoted", "remove_promoted"]

    @admin.action(description="Mark selected businesses as Promoted Ads")
    def make_promoted(self, request, queryset):
        queryset.update(is_promoted=True)

    @admin.action(description="Remove Promoted Ad status from selected businesses")
    def remove_promoted(self, request, queryset):
        queryset.update(is_promoted=False)


@admin.register(BusinessReview)
class BusinessReviewAdmin(admin.ModelAdmin):
    list_display = ("business", "reviewer", "rating", "created_at")
    list_filter = ("rating",)


@admin.register(BusinessInquiry)
class BusinessInquiryAdmin(admin.ModelAdmin):
    list_display = ("business", "sender", "created_at")
