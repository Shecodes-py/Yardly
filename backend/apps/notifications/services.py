from .models import Notification


def notify(user, type, title, body="", related_job=None):
    return Notification.objects.create(
        user=user, type=type, title=title, body=body, related_job=related_job
    )
