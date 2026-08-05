from django.urls import path
from .views import (
    CampListView,
    CampDetailsView,
    RegisterCampView,
    CampRegistrationCheckInView,
    CreateCampView,
    DeleteCampView
)

urlpatterns = [
    path('list/', CampListView.as_view(), name='camp_list'),
    path('create/', CreateCampView.as_view(), name='camp_create'),
    path('delete/<int:pk>/', DeleteCampView.as_view(), name='camp_delete'),
    path('details/<int:pk>/', CampDetailsView.as_view(), name='camp_details'),
    path('register/<int:camp_id>/', RegisterCampView.as_view(), name='camp_register'),
    path('check-in/', CampRegistrationCheckInView.as_view(), name='camp_check_in'),
]
