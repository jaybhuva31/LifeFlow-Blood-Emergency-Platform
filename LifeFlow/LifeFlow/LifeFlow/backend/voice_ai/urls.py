from django.urls import path
from .views import (
    VoiceTranscribeView,
    VoiceSubmitRequestView,
    VoiceHistoryView,
    VoiceAnalyticsView,
    AdminVoiceLogsView
)

urlpatterns = [
    path('transcribe/', VoiceTranscribeView.as_view(), name='voice_transcribe'),
    path('request/', VoiceSubmitRequestView.as_view(), name='voice_submit_request'),
    path('history/', VoiceHistoryView.as_view(), name='voice_history'),
    path('analytics/', VoiceAnalyticsView.as_view(), name='voice_analytics'),
    path('admin/logs/', AdminVoiceLogsView.as_view(), name='admin_voice_logs'),
]
