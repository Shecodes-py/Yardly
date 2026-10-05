from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.users.models import User
from .views import ProcessLevyPaymentView


class UnavailablePaymentTests(SimpleTestCase):
    def test_unverified_payment_requests_cannot_generate_receipts(self):
        factory = APIRequestFactory()
        for method in ["SIMULATED_TEST", "PAYSTACK", "BANK_TRANSFER"]:
            with self.subTest(method=method):
                request = factory.post("/api/estates/levies/1/pay/", {
                    "payment_method": method,
                    "paystack_ref": "unverified-client-reference",
                }, format="json")
                force_authenticate(request, user=User(email="resident@example.com"))
                response = ProcessLevyPaymentView.as_view()(request, levy_id=1)
                self.assertEqual(response.status_code, 503)
                self.assertIn("not available", response.data["detail"])
