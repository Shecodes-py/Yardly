from django.contrib import admin
from .models import DeliveryPass, SecurityAlert, VisitorPass


@admin.register(VisitorPass)
class VisitorPassAdmin(admin.ModelAdmin):
    list_display = ("pass_code", "visitor_name", "resident", "estate", "expected_date", "status", "checked_in_at")
    list_filter = ("status", "estate", "expected_date")
    search_fields = ("pass_code", "visitor_name", "resident__email")


@admin.register(DeliveryPass)
class DeliveryPassAdmin(admin.ModelAdmin):
    list_display = ("pass_code", "company_name", "rider_name", "resident", "estate", "status", "arrived_at")
    list_filter = ("status", "company_name", "estate")
    search_fields = ("pass_code", "company_name", "rider_name")


@admin.register(SecurityAlert)
class SecurityAlertAdmin(admin.ModelAdmin):
    list_display = ("alert_type", "reporter", "estate", "status", "created_at")
    list_filter = ("alert_type", "status", "estate")
    search_fields = ("reporter__email", "description")
