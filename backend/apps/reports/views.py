from rest_framework import generics, permissions
from rest_framework.exceptions import ValidationError

from .models import Block
from .serializers import BlockSerializer, ReportSerializer


class ReportCreateView(generics.CreateAPIView):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(reporter=self.request.user)


class BlockListCreateView(generics.ListCreateAPIView):
    serializer_class = BlockSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Block.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        blocked_user = serializer.validated_data["blocked_user"]
        if blocked_user == self.request.user:
            raise ValidationError("You cannot block yourself.")
        serializer.save(user=self.request.user)
