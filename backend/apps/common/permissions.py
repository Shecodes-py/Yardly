from rest_framework.permissions import BasePermission

from apps.users.models import User


class IsVerifiedResident(BasePermission):
    """Only VERIFIED users can transact (post jobs, apply, review, etc.) — PRD rule 3."""

    message = "Only verified residents can perform this action."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.status == User.Status.VERIFIED
        )


def get_verified_estate_id(user):
    """A user's estate, only once their membership there is verified — used to
    scope job visibility (PRD rule 1)."""
    membership = (
        user.estate_memberships.filter(verification_status="VERIFIED").first()
    )
    return membership.estate_id if membership else None
