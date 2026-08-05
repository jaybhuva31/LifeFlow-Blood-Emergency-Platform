from django.db import models
from django.conf import settings

class Notification(models.Model):
    """
    Notification Model
    Logs alerts and messages dispatched to users regarding request updates, reminders, and camp news.
    """
    NOTIFICATION_TYPES = (
        ('ALERT', 'Emergency Alert'),
        ('REMINDER', 'Donation Reminder'),
        ('CAMP', 'Camp Update'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='notifications'
    )
    title = models.CharField(max_length=150)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='ALERT')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.username} - {self.title} (Read: {self.is_read})"
