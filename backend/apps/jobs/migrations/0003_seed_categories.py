from django.db import migrations

CATEGORIES = [
    ("Errands", "errands"),
    ("Cleaning", "cleaning"),
    ("Car Washing", "car-wash"),
    ("Moving & Lifting", "moving"),
    ("Home Assistance", "home"),
    ("Repairs", "repairs"),
    ("Electrical", "electrical"),
    ("Plumbing", "plumbing"),
    ("Gardening", "gardening"),
    ("Tutoring", "tutoring"),
    ("Tech Help", "tech"),
    ("Delivery/Pickup", "delivery"),
    ("Event Assistance", "event"),
    ("Other", "other"),
]


def seed_categories(apps, schema_editor):
    Category = apps.get_model("jobs", "Category")
    for name, icon in CATEGORIES:
        Category.objects.get_or_create(name=name, defaults={"icon": icon})


def unseed_categories(apps, schema_editor):
    Category = apps.get_model("jobs", "Category")
    Category.objects.filter(name__in=[name for name, _ in CATEGORIES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("jobs", "0002_initial"),
    ]

    operations = [
        migrations.RunPython(seed_categories, unseed_categories),
    ]
