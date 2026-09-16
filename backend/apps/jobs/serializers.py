from rest_framework import serializers

from apps.common.permissions import get_verified_estate_id

from .models import Category, Job, JobImage


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "icon", "active"]


class JobImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobImage
        fields = ["id", "image", "uploaded_at"]


class JobListSerializer(serializers.ModelSerializer):
    """Job-card shape for the feed — never includes exact_location (PRD rule 9)."""

    category = CategorySerializer(read_only=True)
    application_count = serializers.IntegerField(source="applications.count", read_only=True)

    class Meta:
        model = Job
        fields = [
            "id", "title", "budget", "preferred_date", "preferred_time",
            "category", "approximate_location", "status", "application_count",
            "created_at",
        ]


class JobDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    images = JobImageSerializer(many=True, read_only=True)
    owner_id = serializers.IntegerField(source="owner.id", read_only=True)
    owner_name = serializers.CharField(source="owner.get_full_name", read_only=True)
    assigned_worker_id = serializers.IntegerField(source="assigned_worker.id", read_only=True)
    exact_location = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = [
            "id", "title", "description", "budget", "preferred_date", "preferred_time",
            "category", "approximate_location", "exact_location", "required_skills",
            "workers_needed", "status", "images", "owner_id", "owner_name",
            "assigned_worker_id", "created_at", "updated_at",
        ]

    def get_exact_location(self, obj):
        # Only revealed to the job owner and the assigned worker, and only
        # once the job has actually been assigned (PRD rule 9 + section 10).
        request = self.context.get("request")
        if not request or obj.status == Job.Status.OPEN:
            return None
        user = request.user
        if user.id in (obj.owner_id, obj.assigned_worker_id):
            return obj.exact_location
        return None


class JobCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = [
            "id", "title", "description", "category", "budget", "preferred_date",
            "preferred_time", "approximate_location", "exact_location",
            "required_skills", "workers_needed",
        ]

    def create(self, validated_data):
        request = self.context["request"]
        estate_id = get_verified_estate_id(request.user)
        return Job.objects.create(owner=request.user, estate_id=estate_id, **validated_data)
