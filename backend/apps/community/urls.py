from django.urls import path
from .views import ClassifiedListCreateView, FeedListCreateView

urlpatterns = [
    path("community/feed/", FeedListCreateView.as_view(), name="community-feed-list-create"),
    path("community/classifieds/", ClassifiedListCreateView.as_view(), name="community-classifieds-list-create"),
]
