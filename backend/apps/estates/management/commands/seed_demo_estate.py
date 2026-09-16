from django.core.management.base import BaseCommand

from apps.estates.models import Estate


class Command(BaseCommand):
    help = "Creates a demo estate with a fixed, easy-to-type invite code for local development."

    def handle(self, *args, **options):
        estate, created = Estate.objects.get_or_create(
            name="Chevron Estate",
            defaults={"location": "Lekki, Lagos", "invite_code": "DEMO2026"},
        )
        if not created and estate.invite_code != "DEMO2026":
            estate.invite_code = "DEMO2026"
            estate.save(update_fields=["invite_code"])

        verb = "Created" if created else "Found"
        self.stdout.write(
            self.style.SUCCESS(f"{verb} estate '{estate.name}' — invite code: {estate.invite_code}")
        )
