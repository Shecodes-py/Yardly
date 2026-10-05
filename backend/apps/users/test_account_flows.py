from unittest.mock import patch
import re
from datetime import timedelta
from django.utils import timezone

from django.core import mail
from django.core.cache import cache
from django.test import override_settings
from rest_framework.test import APITestCase

from apps.estates.models import Estate, EstateMembership
from apps.users.models import User, PasswordResetCode


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class AccountFlowTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.estate = Estate.objects.create(name="Test Estate", location="Lagos", invite_code="TEST2026")
        self.user = User.objects.create_user(username="resident", email="resident@example.com",
            phone_number="00000000001", password="Original!Pass974", first_name="Resident", status="VERIFIED")
        EstateMembership.objects.create(user=self.user, estate=self.estate, verification_status="VERIFIED")

    def reset_payload(self):
        self.client.post('/api/auth/password-reset/', {'email': self.user.email})
        code = re.search(r'code is (\d{6})', mail.outbox[-1].body).group(1)
        return {'email': self.user.email, 'code': code, 'password': 'New!SecurePass974'}

    def test_reset_request_has_same_response_for_known_and_unknown_accounts(self):
        known = self.client.post("/api/auth/password-reset/", {"email": self.user.email})
        unknown = self.client.post("/api/auth/password-reset/", {"email": "unknown@example.com"})
        self.assertEqual(known.status_code, 200)
        self.assertEqual(known.data, unknown.data)
        self.assertEqual(len(mail.outbox), 1)
        self.assertRegex(mail.outbox[0].body, r'code is \d{6}')
        self.assertEqual(mail.outbox[0].alternatives[0].mimetype, 'text/html')
        self.assertNotIn("token", known.data)

    def test_password_reset_changes_password_and_rejects_replay_and_old_jwt(self):
        login = self.client.post("/api/auth/login/", {"email": self.user.email, "password": "Original!Pass974"})
        payload = self.reset_payload()
        self.assertEqual(self.client.post("/api/auth/password-reset/confirm/", payload).status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(payload["password"]))
        self.assertEqual(self.client.post("/api/auth/password-reset/confirm/", payload).status_code, 400)
        self.client.credentials(HTTP_AUTHORIZATION="Bearer " + login.data["access"])
        self.assertEqual(self.client.get("/api/me/").status_code, 401)

    def test_invalid_expired_and_weak_password_resets_are_rejected(self):
        payload = self.reset_payload()
        PasswordResetCode.objects.filter(user=self.user).update(expires_at=timezone.now() - timedelta(seconds=1))
        self.assertEqual(self.client.post("/api/auth/password-reset/confirm/", payload).status_code, 400)
        payload["code"] = "invalid"
        self.assertEqual(self.client.post("/api/auth/password-reset/confirm/", payload).status_code, 400)
        payload = self.reset_payload()
        payload["password"] = "123"
        response = self.client.post("/api/auth/password-reset/confirm/", payload)
        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.data)

    def test_registration_sends_welcome_email(self):
        response = self.client.post("/api/auth/register/", {
            "first_name": "New", "last_name": "Neighbour", "email": "new@example.com",
            "phone_number": "00000000002", "password": "Strong!Neighbour965",
            "invite_code": self.estate.invite_code, "role": "RESIDENT"}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn("Welcome", mail.outbox[0].subject)
        self.assertEqual(mail.outbox[0].to, ["new@example.com"])

    def test_wrong_attempts_lock_code_and_resend_invalidates_previous_code(self):
        payload = self.reset_payload()
        old_code = payload['code']
        wrong = dict(payload, code='000000' if old_code != '000000' else '111111')
        for _ in range(5):
            self.assertEqual(self.client.post('/api/auth/password-reset/confirm/', wrong).status_code, 400)
        self.assertEqual(self.client.post('/api/auth/password-reset/confirm/', payload).status_code, 400)
        with patch('apps.users.password_reset.secrets.randbelow', return_value=222222 if old_code != '222222' else 333333):
            fresh = self.reset_payload()
        self.assertEqual(self.client.post('/api/auth/password-reset/confirm/', payload).status_code, 400)
        self.assertEqual(self.client.post('/api/auth/password-reset/confirm/', fresh).status_code, 200)

    @patch("apps.common.email.EmailMultiAlternatives.send", side_effect=RuntimeError("SMTP unavailable"))
    def test_mail_failure_is_logged_without_breaking_password_reset_request(self, send):
        with self.assertLogs("yardly.email", level="ERROR") as logs:
            response = self.client.post("/api/auth/password-reset/", {"email": self.user.email})
        self.assertEqual(response.status_code, 200)
        self.assertIn("outcome=failed", logs.output[0])

    def test_request_logs_contain_correlation_id_without_password_or_email(self):
        with self.assertLogs("yardly", level="INFO") as logs:
            response = self.client.post("/api/auth/login/", {"email": self.user.email, "password": "PrivateIncorrectValue"})
        self.assertIn("X-Request-ID", response)
        self.assertNotIn("PrivateIncorrectValue", str(logs.output))
        self.assertNotIn(self.user.email, str(logs.output))

    def test_profile_cannot_change_account_role(self):
        self.client.force_authenticate(self.user)
        self.client.patch("/api/me/", {"role": "ESTATE_ADMIN"})
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, "RESIDENT")
