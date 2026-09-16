from django.contrib import admin

from .models import Estate, EstateMembership


@admin.register(Estate)
class EstateAdmin(admin.ModelAdmin):
    list_display = ("name", "location", "invite_code", "status", "created_at")
    search_fields = ("name", "location", "invite_code")


@admin.register(EstateMembership)
class EstateMembershipAdmin(admin.ModelAdmin):
    list_display = ("user", "estate", "verification_status", "verified_at", "verified_by")
    list_filter = ("verification_status", "estate")
    search_fields = ("user__email", "estate__name")
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
