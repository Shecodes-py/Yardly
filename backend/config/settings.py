"""
Django settings for the Yardly backend.
"""

from datetime import timedelta
from pathlib import Path

from decouple import Csv, config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config(
    "SECRET_KEY",
    default="django-insecure-dev-key-change-me",
)

DEBUG = config("DEBUG", default=True, cast=bool)

ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost,127.0.0.1", cast=Csv())


# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Third party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_filters",
    "drf_spectacular",

    # Yardly apps
    "apps.common",
    "apps.users",
    "apps.estates",
    "apps.jobs",
    "apps.applications",
    "apps.reviews",
    "apps.notifications",
    "apps.reports",
    "apps.gate",
    "apps.community",
    "apps.businesses",
]


MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "apps.common.observability.RequestLoggingMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# Database
# Defaults to local SQLite for zero-config development.
# Set DATABASE_URL (e.g. postgres://user:pass@host:5432/dbname) for Postgres.

import dj_database_url  # noqa: E402

DATABASES = {
    "default": dj_database_url.parse(
        config('DATABASE_URL', default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}"),
        conn_max_age=600,
        conn_health_checks=True,
    )
}


AUTH_USER_MODEL = "users.User"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# Internationalization

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Lagos"
USE_I18N = True
USE_TZ = True


# Static & media files

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
    'staticfiles': {'BACKEND': 'whitenoise.storage.CompressedManifestStaticFilesStorage'},
}

if config('RENDER', default=False, cast=bool):
    render_host = config('RENDER_EXTERNAL_HOSTNAME', default='')
    if render_host and render_host not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(render_host)
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# Django REST Framework

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "EXCEPTION_HANDLER": "apps.common.observability.exception_handler",
    "DEFAULT_THROTTLE_RATES": {"password_reset": "5/hour", "password_reset_confirm": "20/hour", "client_errors": "60/minute"},
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
    ),

    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'Your Project API',
    'DESCRIPTION': 'Your project description',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=2),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=14),
    "ROTATE_REFRESH_TOKENS": True,
}


# CORS - the React PWA runs on a different origin during development.

CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    default="http://localhost:5173,http://127.0.0.1:5173",
    cast=Csv(),
)
CORS_ALLOW_CREDENTIALS = True

# Transactional email: files locally, SMTP when configured for deployment.
FRONTEND_URL = config("FRONTEND_URL", default="http://localhost:5173").rstrip("/")
RESEND_API_KEY = config("RESEND_API_KEY", default="")
EMAIL_BACKEND = config("EMAIL_BACKEND", default="apps.common.resend_backend.EmailBackend" if RESEND_API_KEY or not DEBUG else "django.core.mail.backends.filebased.EmailBackend")
EMAIL_FILE_PATH = BASE_DIR / "emails"
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default="Yardly <noreply@yardly.local>")
EMAIL_HOST = config("EMAIL_HOST", default="localhost")
EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=True, cast=bool)
EMAIL_TIMEOUT = 10
PASSWORD_RESET_TIMEOUT = 3600
SIMPLE_JWT["CHECK_REVOKE_TOKEN"] = True
CORS_EXPOSE_HEADERS = ["X-Request-ID"]

LOG_DIR = BASE_DIR / "logs"
LOG_TO_FILE = config('LOG_TO_FILE', default=DEBUG, cast=bool)
LOG_LEVEL = config('LOG_LEVEL', default='INFO')
if LOG_TO_FILE:
    LOG_DIR.mkdir(exist_ok=True)
LOGGING = {
    "version": 1, "disable_existing_loggers": False,
    "formatters": {"json": {"()": "apps.common.observability.JsonFormatter"}},
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "json"},
    },
    "loggers": {
        "yardly": {"handlers": ["console"], "level": LOG_LEVEL, "propagate": False},
        "django.request": {"handlers": ["console"], "level": "ERROR", "propagate": False},
        "apps": {"handlers": ["console"], "level": LOG_LEVEL, "propagate": False},
    },
}
if LOG_TO_FILE:
    LOGGING['handlers']['file'] = {
        'class': 'logging.handlers.RotatingFileHandler', 'filename': str(LOG_DIR / 'yardly.log'),
        'maxBytes': 5 * 1024 * 1024, 'backupCount': 5, 'encoding': 'utf-8', 'formatter': 'json'}
    for logger in LOGGING['loggers'].values():
        logger['handlers'].append('file')
