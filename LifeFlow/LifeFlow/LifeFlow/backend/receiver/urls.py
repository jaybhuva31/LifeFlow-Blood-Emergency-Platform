from django.urls import path
from .views import (
    ReceiverProfileView,
    HospitalBloodBankListView,
    HospitalRegisterView,
    HospitalApproveView,
    HospitalDeleteView,
    FacilityMyProfileView,
    FacilityUpdateStockView,
    FacilityIncomingRequestsView,
    FacilityAcceptRequestView
)

urlpatterns = [
    path('profile/', ReceiverProfileView.as_view(), name='receiver_profile'),
    path('hospitals-blood-banks/', HospitalBloodBankListView.as_view(), name='hospital_blood_bank_list'),
    path('hospitals-blood-banks/register/', HospitalRegisterView.as_view(), name='hospital_register'),
    path('hospitals-blood-banks/<int:pk>/approve/', HospitalApproveView.as_view(), name='hospital_approve'),
    path('hospitals-blood-banks/<int:pk>/delete/', HospitalDeleteView.as_view(), name='hospital_delete'),
    
    # Facility Dashboard Endpoints
    path('facility/my-facility/', FacilityMyProfileView.as_view(), name='facility_my_profile'),
    path('facility/update-stock/', FacilityUpdateStockView.as_view(), name='facility_update_stock'),
    path('facility/incoming-requests/', FacilityIncomingRequestsView.as_view(), name='facility_incoming_requests'),
    path('facility/requests/<int:pk>/accept/', FacilityAcceptRequestView.as_view(), name='facility_accept_request'),
]


