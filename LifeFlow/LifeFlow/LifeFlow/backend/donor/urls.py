from django.urls import path
from .views import (
    DonorProfileView,
    ToggleAvailabilityView,
    DonationHistoryView,
    DonorReviewsView,
    NearbyDonorsView
)

urlpatterns = [
    path('profile/', DonorProfileView.as_view(), name='donor_profile'),
    path('profile/availability/', ToggleAvailabilityView.as_view(), name='donor_toggle_availability'),
    path('history/', DonationHistoryView.as_view(), name='donor_history'),
    path('reviews/', DonorReviewsView.as_view(), name='donor_reviews'),
    path('nearby/', NearbyDonorsView.as_view(), name='donor_nearby_search'),
]
