from django.urls import path

from .views import EstateListView, JoinEstateView

urlpatterns = [
    path("estates/", EstateListView.as_view(), name="estate-list"),
    path("estates/join/", JoinEstateView.as_view(), name="estate-join"),
]
