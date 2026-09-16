from django.contrib import admin

from .models import Block, Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("reporter", "reported_user", "reason", "status", "created_at")
    list_filter = ("reason", "status")
    search_fields = ("reporter__email", "reported_user__email")


@admin.register(Block)
class BlockAdmin(admin.ModelAdmin):
    list_display = ("user", "blocked_user", "created_at")
    search_fields = ("user__email", "blocked_user__email")
