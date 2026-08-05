from django.db import models
from django.conf import settings

class DonationCamp(models.Model):
    """
    DonationCamp Model
    Tracks information about upcoming and completed blood donation camps.
    Contains fields for location, date, organization organizers, and check-in parameters.
    """
    STATUS_CHOICES = (
        ('UPCOMING', 'Upcoming'),
        ('COMPLETED', 'Completed'),
    )

    name = models.CharField(max_length=200)
    location = models.CharField(max_length=255)
    date = models.DateField()
    time = models.TimeField()
    organizer = models.CharField(max_length=150)
    status = models.DynamicField = models.CharField(max_length=15, choices=STATUS_CHOICES, default='UPCOMING')
    
    # Store plain string data to represent unique QR code check-in value
    qr_code_data = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Donation Camp"
        verbose_name_plural = "Donation Camps"
        ordering = ['-date']

    def save(self, *args, **kwargs):
        """Override save to generate distinct QR code registration parameters on creation."""
        super().save(*args, **kwargs)
        if not self.qr_code_data:
            # Set QR identifier format: CAMP-<id>-<organizer>
            self.qr_code_data = f"CAMP-{self.id}-{self.organizer.replace(' ', '_')}"
            super().save(update_fields=['qr_code_data'])

    def __str__(self):
        return f"{self.name} ({self.date})"


class CampRegistration(models.Model):
    """
    CampRegistration Model
    Tracks users (mostly donors) who register to attend a specific blood donation camp.
    Tracks check-in attendance state.
    """
    camp = models.ForeignKey(DonationCamp, on_delete=models.CASCADE, related_name='registrations')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='camp_registrations')
    registered_at = models.DateTimeField(auto_now_add=True)
    attended = models.BooleanField(default=False, help_text="Checked in at camp location")

    class Meta:
        verbose_name = "Camp Registration"
        verbose_name_plural = "Camp Registrations"
        unique_together = ('camp', 'user')

    def __str__(self):
        return f"{self.user.username} registered for {self.camp.name}"
