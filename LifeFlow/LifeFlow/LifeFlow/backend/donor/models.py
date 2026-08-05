from django.db import models
from django.conf import settings

class Donor(models.Model):
    """
    Donor Model
    Stores detailed profile information for registered blood donors.
    Links to the CustomUser auth model via a OneToOne relationship.
    """
    BLOOD_GROUPS = (
        ('A+', 'A+'),
        ('A-', 'A-'),
        ('B+', 'B+'),
        ('B-', 'B-'),
        ('AB+', 'AB+'),
        ('AB-', 'AB-'),
        ('O+', 'O+'),
        ('O-', 'O-'),
    )

    GENDERS = (
        ('MALE', 'Male'),
        ('FEMALE', 'Female'),
        ('OTHER', 'Other'),
    )

    STATUS_CHOICES = (
        ('AVAILABLE', 'Available'),
        ('ON_LEAVE', 'On Leave'),
        ('BUSY', 'Busy'),
    )

    # 1-to-1 link to user credentials
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='donor_profile')
    
    # Biological details
    blood_group = models.CharField(max_length=5, choices=BLOOD_GROUPS)
    weight = models.FloatField(help_text="Weight in kilograms")
    age = models.IntegerField()
    gender = models.CharField(max_length=10, choices=GENDERS)
    
    # Location/Contact details
    address = models.TextField()
    city = models.CharField(max_length=100)
    latitude = models.FloatField(null=True, blank=True, help_text="Latitude for distance calculations")
    longitude = models.FloatField(null=True, blank=True, help_text="Longitude for distance calculations")
    phone = models.CharField(max_length=15, null=True, blank=True, help_text="Fallback contact number")
    
    # Medical records
    medical_disease = models.TextField(null=True, blank=True, help_text="Any past or chronic medical illnesses")
    profile_picture = models.FileField(upload_to='profiles/', null=True, blank=True)
    blood_report = models.FileField(upload_to='reports/', null=True, blank=True, help_text="Recent pathology test files")
    
    # Donation statistics & ML Metrics
    last_donation_date = models.DateField(null=True, blank=True)
    donation_count = models.IntegerField(default=0)
    cancellation_count = models.IntegerField(default=0, help_text="Total cancelled responses")
    average_response_time = models.FloatField(default=15.0, help_text="Average response time in minutes")
    trust_score = models.FloatField(default=85.0, help_text="AI Donor Trust Score (0-100)")
    verification_status = models.BooleanField(default=True, help_text="Is the donor account identity verified?")
    
    # Availability toggles
    availability = models.BooleanField(default=True, help_text="Is the donor ready to donate now?")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Donor Profile"
        verbose_name_plural = "Donor Profiles"

    def __str__(self):
        return f"{self.user.username} - {self.blood_group}"

    @property
    def is_eligible_to_donate(self):
        """Donors must wait 90 days (3 months) between blood donations."""
        if not self.last_donation_date:
            return True
        from django.utils import timezone
        from datetime import timedelta
        today = timezone.now().date()
        next_date = self.last_donation_date + timedelta(days=90)
        return today >= next_date

    @property
    def next_eligible_date(self):
        """Returns the date when the donor can donate again."""
        if not self.last_donation_date:
            from django.utils import timezone
            return timezone.now().date()
        from datetime import timedelta
        return self.last_donation_date + timedelta(days=90)

    @property
    def days_until_eligible(self):
        """Returns number of remaining days until donor is eligible to donate."""
        if not self.last_donation_date:
            return 0
        from django.utils import timezone
        today = timezone.now().date()
        next_date = self.next_eligible_date
        remaining = (next_date - today).days
        return max(0, remaining)

