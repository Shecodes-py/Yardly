import json
import logging
import uuid
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.core.mail.backends.base import BaseEmailBackend


class EmailBackend(BaseEmailBackend):
    """Send transactional messages using Resend; keys remain server-side."""
    def send_messages(self, email_messages):
        if not settings.RESEND_API_KEY:
            raise ImproperlyConfigured("RESEND_API_KEY is required for Resend email delivery.")
        sent = 0
        for message in email_messages:
            if not message.recipients():
                continue
            payload = {"from": message.from_email, "to": message.to,
                       "subject": message.subject, "text": message.body}
            if message.cc:
                payload["cc"] = message.cc
            if message.bcc:
                payload["bcc"] = message.bcc
            if message.reply_to:
                payload["reply_to"] = message.reply_to
            for alternative in getattr(message, "alternatives", []):
                if alternative.mimetype == "text/html":
                    payload["html"] = alternative.content
            request = Request("https://api.resend.com/emails", data=json.dumps(payload).encode("utf-8"),
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}",
                         "Content-Type": "application/json", "User-Agent": "Yardly/1.0",
                         "Idempotency-Key": message.extra_headers.get("Idempotency-Key", str(uuid.uuid4()))}, method="POST")
            try:
                with urlopen(request, timeout=settings.EMAIL_TIMEOUT) as response:
                    result = json.loads(response.read())
                if not result.get("id"):
                    raise RuntimeError("Resend did not return a message ID.")
                logging.getLogger("yardly.email").info("resend_accepted message_id=%s", result["id"])
                sent += 1
            except HTTPError as exc:
                logging.getLogger("yardly.email").error("resend_rejected status=%s", exc.code)
                if not self.fail_silently:
                    raise RuntimeError(f"Resend rejected email (HTTP {exc.code}).") from None
            except Exception:
                if not self.fail_silently:
                    raise
                logging.getLogger("yardly.email").exception("resend_delivery_failed")
        return sent
