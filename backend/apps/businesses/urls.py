from django.urls import path
from .views import (
    BusinessCategoryListView,
    BusinessDetailView,
    BusinessInquiryCreateView,
    BusinessProfileListCreateView,
    BusinessReviewListCreateView,
)

urlpatterns = [
    path("business-categories/", BusinessCategoryListView.as_view(), name="business-category-list"),
    path("businesses/", BusinessProfileListCreateView.as_view(), name="business-list-create"),
    path("businesses/<int:pk>/", BusinessDetailView.as_view(), name="business-detail"),
    path("businesses/<int:business_id>/reviews/", BusinessReviewListCreateView.as_view(), name="business-review-list-create"),
    path("businesses/<int:business_id>/inquiries/", BusinessInquiryCreateView.as_view(), name="business-inquiry-create"),
]
