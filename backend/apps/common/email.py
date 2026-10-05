import logging

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

logger = logging.getLogger("yardly.email")


def send_user_email(user, subject, body, kind, context=None):
    try:
        message = EmailMultiAlternatives(subject, body, settings.DEFAULT_FROM_EMAIL, [user.email])
        if context is not None:
            message.attach_alternative(render_to_string('common/email.html', context), 'text/html')
        sent = message.send()
        logger.info("email kind=%s user_id=%s outcome=%s backend=%s", kind, user.pk,
                    "sent" if sent else "not_sent", settings.EMAIL_BACKEND)
        return bool(sent)
    except Exception:
        logger.exception("email kind=%s user_id=%s outcome=failed", kind, user.pk)
        return False


def welcome_email(user):
    membership = user.estate_memberships.select_related("estate").first()
    estate = membership.estate.name if membership else "your neighbourhood"
    onboarding = ("Complete your household details and wait for your estate team to approve your membership. "
                  "Once approved, you can invite visitors, register deliveries, find local help and connect with neighbours."
                  if user.role == "RESIDENT" else "Your estate administrator will review your account before you can access estate operations.")
    return send_user_email(user, "Welcome to Yardly", f"Hi {user.first_name},\n\n"
        f"Welcome to Yardly and {estate}.\n\n"
        f"{onboarding}\n\n"
        f"Get started: {settings.FRONTEND_URL}/dashboard\n\nYour neighbourhood, a little closer.\nThe Yardly team", "welcome", {
            'eyebrow': 'WELCOME TO YOUR NEIGHBOURHOOD', 'title': f'Welcome home, {user.first_name}.',
            'description': f'You’re joining {estate}. Your neighbourhood, a little closer.',
            'content': onboarding, 'button_label': 'Get started', 'button_url': f'{settings.FRONTEND_URL}/dashboard',
            'footer': 'Visitors, deliveries and community life — all in one place.'})


def announcement_emails(item):
    from apps.users.models import User
    residents = User.objects.filter(is_active=True, role=User.Role.RESIDENT, status=User.Status.VERIFIED,
        estate_memberships__estate_id=item.estate_id, estate_memberships__verification_status="VERIFIED").distinct()
    sent = failed = 0
    for user in residents.iterator():
        ok = send_user_email(user, f"{item.estate.name}: {item.title}",
            f"Hi {user.first_name},\n\nAn update from {item.estate.name} management:\n\n"
            f"{item.title}\n\n{item.content}\n\nView your community: {settings.FRONTEND_URL}/community\n\nYardly", "announcement")
        sent += int(ok)
        failed += int(not ok)
    return {"sent": sent, "failed": failed}
