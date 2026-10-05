import logging
from rest_framework import permissions, serializers
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView


class ClientErrorSerializer(serializers.Serializer):
    area = serializers.RegexField(r"^[a-zA-Z0-9_-]{1,60}$")
    kind = serializers.ChoiceField(choices=["api", "render", "runtime", "promise"])
    name = serializers.RegexField(r"^[a-zA-Z0-9_-]{1,80}$")
    request_id = serializers.RegexField(r"^[a-f0-9]{0,32}$", allow_blank=True)
    status = serializers.IntegerField(min_value=0, max_value=599)


class ClientErrorView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "client_errors"

    def post(self, request):
        serializer = ClientErrorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        logging.getLogger("yardly.frontend").error("client_error user_id=%s details=%s", request.user.pk, serializer.validated_data)
        return Response(status=204)
