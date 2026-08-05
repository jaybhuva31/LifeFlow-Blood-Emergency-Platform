from django.db import models
from django.conf import settings

class VoiceRequestLog(models.Model):
    """
    Model for recording voice activated emergency requests, transcripts,
    detected languages, AI entity extractions, and confidence scores.
    """
    PRIORITY_CHOICES = (
        ('CRITICAL', '🔴 Critical'),
        ('HIGH', '🟠 High'),
        ('NORMAL', '🟢 Normal'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='voice_logs', null=True, blank=True)
    transcript = models.TextField()
    detected_language = models.CharField(max_length=20, default='en-US')
    
    extracted_blood_group = models.CharField(max_length=10, blank=True, null=True)
    extracted_city = models.CharField(max_length=100, blank=True, null=True)
    extracted_hospital = models.CharField(max_length=200, blank=True, null=True)
    extracted_landmark = models.CharField(max_length=200, blank=True, null=True)
    extracted_relation = models.CharField(max_length=50, blank=True, null=True)
    extracted_priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='HIGH')
    extracted_required_time = models.CharField(max_length=100, blank=True, null=True)
    extracted_reason = models.CharField(max_length=200, blank=True, null=True)

    confidence_score = models.FloatField(default=0.90) # Overall confidence
    field_confidences = models.JSONField(default=dict) # Field-specific confidences { "blood_group": 98, ... }

    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    
    is_submitted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Voice Request Log"
        verbose_name_plural = "Voice Request Logs"
        ordering = ['-created_at']

    def __str__(self):
        return f"Voice Log ({self.detected_language}) - {self.extracted_blood_group or 'Unknown'} at {self.extracted_hospital or self.extracted_city or 'Unknown'}"
