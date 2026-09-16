from django.contrib import admin

from .models import JobApplication


@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ("job", "worker", "status", "proposed_price", "created_at")
    list_filter = ("status",)
    search_fields = ("job__title", "worker__email")
