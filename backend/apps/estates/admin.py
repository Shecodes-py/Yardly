from django.contrib import admin
from .models import EmergencyContact, Estate, EstateMembership, MaintenanceTicket


@admin.register(Estate)
class EstateAdmin(admin.ModelAdmin):
    list_display = ("name", "location", "invite_code", "daily_gate_code", "status", "created_at")
    search_fields = ("name", "location", "invite_code", "daily_gate_code")


@admin.register(EstateMembership)
class EstateMembershipAdmin(admin.ModelAdmin):
    list_display = ("user", "estate", "unit_address", "verification_status", "verified_at", "verified_by")
    list_filter = ("verification_status", "estate")
    search_fields = ("user__email", "estate__name", "unit_address")
    actions = ["verify_memberships"]

    @admin.action(description="Verify selected memberships")
    def verify_memberships(self, request, queryset):
        from django.utils import timezone
        from apps.users.models import User

        updated = 0
        for membership in queryset.select_related("user"):
            membership.verification_status = EstateMembership.VerificationStatus.VERIFIED
            membership.verified_at = timezone.now()
            membership.verified_by = request.user
            membership.save()
            membership.user.status = User.Status.VERIFIED
            membership.user.save(update_fields=["status"])
            updated += 1
        self.message_user(request, f"Verified {updated} membership(s).")


@admin.register(EmergencyContact)
class EmergencyContactAdmin(admin.ModelAdmin):
    list_display = ("title", "phone_number", "estate", "is_gate_desk")
    list_filter = ("is_gate_desk", "estate")


@admin.register(MaintenanceTicket)
class MaintenanceTicketAdmin(admin.ModelAdmin):
    list_display = ("title", "issue_type", "resident", "estate", "status", "created_at")
    list_filter = ("issue_type", "status", "estate")
    search_fields = ("title", "description", "resident__email")
