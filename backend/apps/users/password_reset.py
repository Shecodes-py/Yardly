import secrets
from datetime import timedelta
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import permissions, serializers
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.common.email import send_user_email
from .models import User, PasswordResetCode


class ResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.RegexField(r'^\d{6}$')
    password = serializers.CharField(write_only=True, max_length=128)


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset"

    def post(self, request):
        serializer = ResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.filter(email__iexact=serializer.validated_data["email"], is_active=True).first()
        if user and user.has_usable_password():
            code = f'{secrets.randbelow(1000000):06d}'
            with transaction.atomic():
                User.objects.select_for_update().get(pk=user.pk)
                PasswordResetCode.objects.update_or_create(user=user, defaults={
                    'code_hash': make_password(code), 'expires_at': timezone.now() + timedelta(minutes=10), 'attempts': 0})
            send_user_email(user, "Reset your Yardly password",
                f"Hi {user.first_name},\n\nYour Yardly password reset code is {code}.\n\n"
                "It expires in 10 minutes and can be used once. Never share this code. "
                "If you did not request this, ignore this email.\n\nThe Yardly team", "password_reset", {
                    'eyebrow': 'ACCOUNT SECURITY', 'title': 'Let’s get you back in.',
                    'description': 'Enter this verification code on the Yardly password reset screen.', 'code': code,
                    'content': 'This code expires in 10 minutes and can be used once. Never share it with anyone.',
                    'footer': 'Didn’t request a password reset? Ignore this email. Your password stays unchanged.'})
        return Response({"detail": "If an account exists for that email, a reset code will be sent."})


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "password_reset_confirm"

    def post(self, request):
        serializer = ResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        invalid = False
        with transaction.atomic():
            user = User.objects.select_for_update().filter(email__iexact=data['email'], is_active=True).first()
            reset = PasswordResetCode.objects.select_for_update().filter(user=user).first() if user else None
            if not reset or reset.expires_at <= timezone.now() or reset.attempts >= 5:
                invalid = True
            elif not check_password(data['code'], reset.code_hash):
                reset.attempts += 1
                reset.save(update_fields=['attempts'])
                invalid = True
            else:
                try:
                    validate_password(data["password"], user=user)
                except DjangoValidationError as exc:
                    raise ValidationError({"password": exc.messages})
                user.set_password(data["password"])
                user.save(update_fields=["password"])
                reset.delete()
        if invalid:
            raise ValidationError({'detail': 'This code is invalid or has expired. Request a new one.'})
        return Response({"detail": "Your password has been reset. Sign in with your new password."})
