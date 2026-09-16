from django.contrib import admin

from .models import Category, Job, JobImage


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "icon", "active")
    list_filter = ("active",)


class JobImageInline(admin.TabularInline):
    model = JobImage
    extra = 0


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ("title", "estate", "category", "owner", "status", "budget", "preferred_date")
    list_filter = ("status", "estate", "category")
    search_fields = ("title", "description", "owner__email")
    inlines = [JobImageInline]
