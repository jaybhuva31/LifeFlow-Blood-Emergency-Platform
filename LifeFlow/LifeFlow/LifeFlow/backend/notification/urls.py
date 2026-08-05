from django.urls import path
from .views import (
    NotificationListView,
    NotificationMarkReadView,
    NotificationMarkAllReadView,
    NotificationDeleteView
)

urlpatterns = [
    path('list/', NotificationListView.as_view(), name='notification_list'),
    path('read/<int:pk>/', NotificationMarkReadView.as_view(), name='notification_mark_read'),
    path('read-all/', NotificationMarkAllReadView.as_view(), name='notification_mark_all_read'),
    path('delete/<int:pk>/', NotificationDeleteView.as_view(), name='notification_delete'),
]
