from django.core.management.base import BaseCommand

from apps.businesses.models import BusinessCategory
from apps.community.models import FeedItem
from apps.estates.models import EmergencyContact, Estate, EstateMembership
from apps.users.models import User, WorkerProfile


class Command(BaseCommand):
    help = "Creates Miracle Zone demo estate with 3 distinct demo accounts (Admin, Security, Resident)."

    def handle(self, *args, **options):
        estate = Estate.objects.filter(invite_code="DEMO2026").first()
        if estate:
            estate.name = "Miracle Zone"
            estate.daily_gate_code = "GATE-7749"
            estate.rules_document = "1. Speed limit within Miracle Zone is 20km/h.\n2. All visitor passes must be generated in Yardly app.\n3. Noise curfew starts at 10:00 PM."
            estate.save()
        else:
            estate = Estate.objects.create(
                name="Miracle Zone",
                location="Lekki, Lagos",
                invite_code="DEMO2026",
                daily_gate_code="GATE-7749",
                rules_document="1. Speed limit within Miracle Zone is 20km/h.\n2. All visitor passes must be generated in Yardly app.\n3. Noise curfew starts at 10:00 PM.",
            )

        # Seed Demo Accounts
        accounts = [
            ("admin@miracle.zone", "Miracle", "Admin", User.Role.ESTATE_ADMIN, "08011112222", "Block 1, Admin Office"),
            ("security@miracle.zone", "Gate", "Officer", User.Role.GATE_SECURITY, "08022223333", "Main Gate House"),
            ("resident@miracle.zone", "Chidi", "Okafor", User.Role.RESIDENT, "08033334444", "House 14, Zone B"),
        ]

        for email, first_name, last_name, role, phone, unit in accounts:
            user, u_created = User.objects.get_or_create(
                email=email,
                defaults={
                    "username": email,
                    "first_name": first_name,
                    "last_name": last_name,
                    "phone_number": phone,
                    "role": role,
                    "status": User.Status.VERIFIED,
                },
            )
            if u_created:
                user.set_password("password123")
                user.save()
                WorkerProfile.objects.create(user=user)
            else:
                user.role = role
                user.status = User.Status.VERIFIED
                user.save(update_fields=["role", "status"])

            membership, _ = EstateMembership.objects.get_or_create(
                user=user, estate=estate,
                defaults={
                    "unit_address": unit,
                    "verification_status": EstateMembership.VerificationStatus.VERIFIED,
                }
            )
            if membership.verification_status != EstateMembership.VerificationStatus.VERIFIED:
                membership.verification_status = EstateMembership.VerificationStatus.VERIFIED
                membership.save(update_fields=["verification_status"])

        # Seed Business Categories
        categories = [
            ("Electrical & Plumbing", "zap"),
            ("Food & Catering", "utensils"),
            ("Beauty & Salon", "scissors"),
            ("Laundry & Dry Cleaning", "shirt"),
            ("Home Cleaning", "sparkles"),
            ("Tutor & Lessons", "book-open"),
            ("Car Wash & Auto", "car"),
            ("Tech & Phone Repair", "smartphone"),
            ("General Services", "briefcase"),
        ]
        for name, icon in categories:
            BusinessCategory.objects.get_or_create(name=name, defaults={"icon": icon, "active": True})

        # Seed Emergency Contacts
        contacts = [
            ("Miracle Zone Gate Security Desk", "08012345678", "Main gate clearance & emergency response", True),
            ("Lekki Fire Service", "08099887766", "Nearest fire station response", False),
            ("Police Divisional HQ", "08033221100", "Local division police station", False),
            ("Miracle Zone Clinic & Ambulance", "08055443322", "24/7 medical emergency dispatch", False),
        ]
        for title, phone, desc, is_gate in contacts:
            EmergencyContact.objects.get_or_create(
                estate=estate, title=title,
                defaults={"phone_number": phone, "description": desc, "is_gate_desk": is_gate}
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Seeded demo estate '{estate.name}' (Code: {estate.invite_code}, Gate Code: {estate.daily_gate_code})\n"
                f"Accounts ready (Password: password123):\n"
                f" - Admin: admin@miracle.zone\n"
                f" - Security: security@miracle.zone\n"
                f" - Resident: resident@miracle.zone"
            )
        )
