import json
import logging
import time
import uuid

from django.http import JsonResponse


class JsonFormatter(logging.Formatter):
    def format(self, record):
        data = {"time": self.formatTime(record), "level": record.levelname,
                "logger": record.name, "message": record.getMessage()}
        if record.exc_info:
            data["traceback"] = self.formatException(record.exc_info)
        return json.dumps(data)


class RequestLoggingMiddleware:
    """Log route names and IDs, never request bodies, query strings or credentials."""
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.request_id = uuid.uuid4().hex
        started = time.monotonic()
        response = self.get_response(request)
        match = getattr(request, "resolver_match", None)
        app = match.func.__module__.split(".")[1] if match and match.func.__module__.startswith("apps.") else "http"
        logger = logging.getLogger(f"yardly.{app}")
        status = response.status_code
        logger.log(logging.ERROR if status >= 500 else logging.WARNING if status >= 400 else logging.INFO,
                   "request_id=%s method=%s route=%s status=%s user_id=%s duration_ms=%.1f",
                   request.request_id, request.method, match.url_name if match else "unmatched",
                   status, getattr(request.user, "pk", None) if hasattr(request, "user") else None,
                   (time.monotonic() - started) * 1000)
        response["X-Request-ID"] = request.request_id
        return response

    def process_exception(self, request, exception):
        logging.getLogger("yardly.errors").exception("request_id=%s unhandled_exception=%s",
                                                    request.request_id, type(exception).__name__)
        return JsonResponse({"detail": "Something went wrong. Please try again.",
                             "request_id": request.request_id}, status=500)


def exception_handler(exc, context):
    from rest_framework.views import exception_handler as default_exception_handler
    response = default_exception_handler(exc, context)
    request = context.get("request")
    view = context.get("view")
    module = view.__class__.__module__ if view else "unknown"
    logging.getLogger(f"yardly.{module}").warning(
        "request_id=%s view=%s exception=%s status=%s fields=%s",
        getattr(request, "request_id", "unknown"), view.__class__.__name__ if view else "unknown",
        type(exc).__name__, response.status_code if response else 500,
        list(response.data) if response and isinstance(response.data, dict) else [])
    return response
