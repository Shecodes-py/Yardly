from rest_framework import generics, permissions
from rest_framework.response import Response

from .models import Estate
from .serializers import EstateSerializer, JoinEstateSerializer


class EstateListView(generics.ListAPIView):
    """Lists active estates (for admin/estate-selection UI only; the invite
    code, not browsing, is the actual onboarding gate)."""

    queryset = Estate.objects.filter(status=Estate.Status.ACTIVE)
    serializer_class = EstateSerializer
    permission_classes = [permissions.IsAuthenticated]


class JoinEstateView(generics.GenericAPIView):
    serializer_class = JoinEstateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        membership = serializer.save()
        return Response(
            {
                "estate": EstateSerializer(membership.estate).data,
                "verification_status": membership.verification_status,
            },
            status=201,
        )
