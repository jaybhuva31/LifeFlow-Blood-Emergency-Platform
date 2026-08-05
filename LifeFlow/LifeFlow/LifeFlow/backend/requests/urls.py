from django.urls import path
from .views import (
    BloodRequestCreateView,
    RequestHistoryListView,
    AcceptBloodRequestView,
    RejectBloodRequestView,
    CompleteBloodRequestView,
    CancelBloodRequestView,
    TrackBloodRequestView,
    EmergencyRequestCreateView,
    EmergencyRequestListView,
    ActiveAlertsView,
    RespondEmergencyRequestView,
    ReceiverDashboardDataView,
    DonorDashboardDataView,
    UpdateEmergencyDonationStatusView,
    DonorFeedbackView,
    PredictBloodDemandView,
    SmartDonorRecommendationView,
    BatchNotifyDonorsView
)

urlpatterns = [
    path('create/', BloodRequestCreateView.as_view(), name='request_create'),
    path('list/', RequestHistoryListView.as_view(), name='request_list'),
    path('accept/<str:request_id>/', AcceptBloodRequestView.as_view(), name='request_accept'),
    path('reject/<str:request_id>/', RejectBloodRequestView.as_view(), name='request_reject'),
    path('complete/<str:request_id>/', CompleteBloodRequestView.as_view(), name='request_complete'),
    path('cancel/<str:request_id>/', CancelBloodRequestView.as_view(), name='request_cancel'),
    path('track/<str:request_id>/', TrackBloodRequestView.as_view(), name='request_track'),
    path('recommend-donors/', SmartDonorRecommendationView.as_view(), name='smart_donor_recommendations'),
    
    # Emergency Requests URL routes
    path('emergency/create/', EmergencyRequestCreateView.as_view(), name='emergency_create'),
    path('emergency/list/', EmergencyRequestListView.as_view(), name='emergency_list'),
    path('emergency/active-alerts/', ActiveAlertsView.as_view(), name='emergency_active_alerts'),
    path('emergency/respond/<int:request_id>/', RespondEmergencyRequestView.as_view(), name='emergency_respond'),
    path('emergency/receiver-dashboard-data/', ReceiverDashboardDataView.as_view(), name='emergency_receiver_dashboard_data'),
    path('emergency/donor-dashboard-data/', DonorDashboardDataView.as_view(), name='emergency_donor_dashboard_data'),
    path('emergency/update-status/<int:request_id>/', UpdateEmergencyDonationStatusView.as_view(), name='emergency_update_status'),
    path('emergency/feedback/', DonorFeedbackView.as_view(), name='emergency_donor_feedback'),
    path('emergency/predict-demand/', PredictBloodDemandView.as_view(), name='emergency_predict_demand'),
    path('emergency/recommend-donors/', SmartDonorRecommendationView.as_view(), name='emergency_recommend_donors'),
    path('emergency/batch-notify/', BatchNotifyDonorsView.as_view(), name='emergency_batch_notify'),
]
