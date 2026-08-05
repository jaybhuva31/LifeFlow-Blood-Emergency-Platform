from django.urls import path
from .views import ReportsStatsView, ExportReportView, PublicLandingStatsView

urlpatterns = [
    path('stats/', ReportsStatsView.as_view(), name='report_stats'),
    path('export/', ExportReportView.as_view(), name='report_export'),
    path('landing-stats/', PublicLandingStatsView.as_view(), name='public_landing_stats'),
]
