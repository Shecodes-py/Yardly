from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User, WorkerProfile


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ("email", "username", "phone_number", "status", "is_staff", "created_at")
    list_filter = ("status", "is_staff", "is_active")
    search_fields = ("email", "username", "phone_number", "first_name", "last_name")
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Yardly", {"fields": ("phone_number", "profile_picture", "bio", "status", "phone_verified_at")}),
    )


@admin.register(WorkerProfile)
class WorkerProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "average_rating", "completed_jobs_count")
    search_fields = ("user__email", "user__username")
