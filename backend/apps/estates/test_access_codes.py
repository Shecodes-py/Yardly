from django.core import mail
from django.test import override_settings
from rest_framework.test import APITestCase
from apps.estates.models import Estate, EstateMembership
from apps.users.models import User


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class AccessAndAnnouncementTests(APITestCase):
    def setUp(self):
        self.estate = Estate.objects.create(name="Test Estate", location="Lagos", invite_code="TEST2026")
        self.other = Estate.objects.create(name="Other Estate", location="Lagos", invite_code="OTHER2026")
        self.admin = self.account("admin", "ESTATE_ADMIN", self.estate, "00000000011")
        self.resident = self.account("resident", "RESIDENT", self.estate, "00000000012")
        self.outsider = self.account("outsider", "RESIDENT", self.other, "00000000013")
        self.client.force_authenticate(self.admin)

    def account(self, name, role, estate, phone):
        user = User.objects.create_user(username=name, email=f"{name}@example.com", password="Strong!Pass789",
                                        phone_number=phone, role=role, status="VERIFIED")
        EstateMembership.objects.create(user=user, estate=estate, verification_status="VERIFIED")
        return user

    def test_rotation_returns_new_daily_code_preserves_invite_and_reload(self):
        old_gate = self.estate.daily_gate_code
        response = self.client.post("/api/estates/admin/gate-code/rotate/", {"invite_code": "IGNOREME"})
        self.assertEqual(response.status_code, 200)
        self.estate.refresh_from_db()
        self.assertNotEqual(self.estate.daily_gate_code, old_gate)
        self.assertEqual(self.estate.invite_code, "TEST2026")
        self.assertEqual(response.data["daily_gate_code"], self.estate.daily_gate_code)
        self.assertEqual(self.client.get("/api/estates/gate-code/").data["invite_code"], "TEST2026")

    def test_invite_update_normalizes_code_and_preserves_daily_code(self):
        gate = self.estate.daily_gate_code
        response = self.client.post("/api/estates/admin/invite-code/", {"invite_code": " fresh2026 "})
        self.assertEqual(response.status_code, 200)
        self.estate.refresh_from_db()
        self.assertEqual(self.estate.invite_code, "FRESH2026")
        self.assertEqual(self.estate.daily_gate_code, gate)

    def test_duplicate_invalid_and_blank_invites_are_rejected(self):
        for code in ["OTHER2026", "", "bad space", "x" * 21]:
            self.assertEqual(self.client.post("/api/estates/admin/invite-code/", {"invite_code": code}).status_code, 400)
        self.estate.refresh_from_db()
        self.assertEqual(self.estate.invite_code, "TEST2026")

    def test_resident_cannot_rotate_or_change_invite(self):
        self.client.force_authenticate(self.resident)
        self.assertEqual(self.client.post("/api/estates/admin/gate-code/rotate/").status_code, 403)
        self.assertEqual(self.client.post("/api/estates/admin/invite-code/", {"invite_code": "NEWCODE"}).status_code, 403)
        self.assertNotIn("invite_code", self.client.get("/api/estates/gate-code/").data)

    def test_admin_announcement_emails_only_verified_residents_in_same_estate(self):
        response = self.client.post("/api/community/feed/", {"category": "ANNOUNCEMENT", "title": "Waste collection",
            "content": "Collection tomorrow morning.", "send_email": True}, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["email_delivery"], {"sent": 1, "failed": 0})
        self.assertEqual(mail.outbox[0].to, [self.resident.email])

    def test_resident_cannot_send_estate_email_and_admin_can_publish_without_email(self):
        payload = {"category": "ANNOUNCEMENT", "title": "Notice", "content": "Update", "send_email": True}
        self.client.force_authenticate(self.resident)
        self.assertEqual(self.client.post("/api/community/feed/", payload, format="json").status_code, 403)
        self.client.force_authenticate(self.admin)
        payload["send_email"] = False
        self.assertEqual(self.client.post("/api/community/feed/", payload, format="json").status_code, 201)
        self.assertEqual(len(mail.outbox), 0)
