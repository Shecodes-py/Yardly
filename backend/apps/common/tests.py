import json
from unittest.mock import MagicMock, patch
from django.core.mail import EmailMessage
from django.test import SimpleTestCase, override_settings
from apps.common.resend_backend import EmailBackend


@override_settings(RESEND_API_KEY="test-key", EMAIL_TIMEOUT=10)
class ResendBackendTests(SimpleTestCase):
    @patch("apps.common.resend_backend.urlopen")
    def test_sends_authenticated_message_and_reports_acceptance(self, transport):
        response = MagicMock()
        response.read.return_value = b'{"id":"message-123"}'
        transport.return_value.__enter__.return_value = response
        result = EmailBackend().send_messages([EmailMessage("Welcome", "Hello", "Yardly <sender@example.com>", ["resident@example.com"])])
        self.assertEqual(result, 1)
        request = transport.call_args.args[0]
        self.assertEqual(request.full_url, "https://api.resend.com/emails")
        self.assertEqual(request.get_header("Authorization"), "Bearer test-key")
        self.assertEqual(json.loads(request.data)["to"], ["resident@example.com"])

    @override_settings(RESEND_API_KEY="")
    def test_missing_key_fails_without_network_request(self):
        from django.core.exceptions import ImproperlyConfigured
        with self.assertRaises(ImproperlyConfigured):
            EmailBackend().send_messages([EmailMessage("Test", "Body", to=["user@example.com"])])

    @patch("apps.common.resend_backend.urlopen")
    def test_provider_rejection_does_not_expose_key_or_email_body(self, transport):
        from urllib.error import HTTPError
        transport.side_effect = HTTPError("https://api.resend.com/emails", 401, "Unauthorized", {}, None)
        with self.assertRaisesRegex(RuntimeError, "HTTP 401"):
            EmailBackend().send_messages([EmailMessage("Test", "Private body", to=["user@example.com"])])
