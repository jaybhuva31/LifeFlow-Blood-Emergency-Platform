from django.db import models
from django.conf import settings
import random

class BloodRequest(models.Model):
    """
    BloodRequest Model
    Tracks emergency requests submitted by receivers/hospitals, including patient name,
    assigned donor, quantity needed, location details, date requirements, and current workflow status.
    """
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('DONOR_ON_THE_WAY', 'Donor On The Way'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    )

    EMERGENCY_LEVELS = (
        ('CRITICAL', 'Critical (Immediate)'),
        ('HIGH', 'High'),
        ('NORMAL', 'Normal'),
    )

    # Unique auto-generated readable Request ID (e.g. REQ-74910)
    request_id = models.CharField(max_length=20, unique=True, editable=False)
    
    # Associated users
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='blood_requests_made'
    )
    assigned_donor = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='blood_donations_assigned'
    )

    # Patient & Request Details
    patient_name = models.CharField(max_length=150)
    blood_group = models.CharField(max_length=5)
    units_required = models.IntegerField(default=1)
    emergency_level = models.CharField(max_length=15, choices=EMERGENCY_LEVELS, default='NORMAL')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Hospital details
    hospital_name = models.CharField(max_length=200)
    hospital_address = models.TextField()
    
    # Timing & Remarks
    required_date = models.DateField()
    remarks = models.TextField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Blood Request"
        verbose_name_plural = "Blood Requests"
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        """Override save to generate a unique REQ-XXXXX identifier on creation."""
        if not self.request_id:
            # Generate unique code
            while True:
                code = f"REQ-{random.randint(10000, 99999)}"
                if not BloodRequest.objects.filter(request_id=code).exists():
                    self.request_id = code
                    break
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.request_id} - {self.blood_group} ({self.status})"


class EmergencyRequest(models.Model):
    EMERGENCY_LEVELS = (
        ('CRITICAL', 'Critical (Immediate)'),
        ('HIGH', 'High'),
        ('NORMAL', 'Normal'),
    )

    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='emergency_requests'
    )
    blood_group = models.CharField(max_length=5)
    patient_name = models.CharField(max_length=150, blank=True)
    hospital_name = models.CharField(max_length=200)
    city = models.CharField(max_length=100)
    location = models.CharField(max_length=255)
    units = models.IntegerField(default=1)
    reason = models.TextField()
    emergency_level = models.CharField(max_length=15, choices=EMERGENCY_LEVELS, default='CRITICAL')
    required_date = models.DateField(null=True, blank=True)
    required_time = models.TimeField(null=True, blank=True)
    remarks = models.TextField(blank=True)
    contact_number = models.CharField(max_length=15)
    status = models.CharField(max_length=20, default='PENDING')  # PENDING, ACCEPTED, etc.
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'emergency_requests'
        ordering = ['-created_at']

    def __str__(self):
        return f"Emergency Request {self.id} - {self.blood_group} at {self.hospital_name}"


class RequestResponse(models.Model):
    DONATION_STATUS_CHOICES = (
        ('SENT', 'Sent'),
        ('ON_THE_WAY', 'On the way'),
        ('ARRIVED', 'Arrived'),
        ('COMPLETE', 'Complete'),
    )
    request = models.ForeignKey(
        EmergencyRequest,
        on_delete=models.CASCADE,
        related_name='responses'
    )
    donor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='responses'
    )
    status = models.CharField(max_length=20, default='PENDING')  # PENDING, ACCEPTED, IGNORED
    donation_status = models.CharField(
        max_length=20,
        choices=DONATION_STATUS_CHOICES,
        default='SENT'
    )
    accepted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'request_responses'

    def __str__(self):
        return f"Response {self.id} by Donor {self.donor.username} - {self.status}"


class DonorFeedback(models.Model):
    """One receiver rating for each completed emergency donation."""
    response = models.OneToOneField(
        RequestResponse,
        on_delete=models.CASCADE,
        related_name='feedback'
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='donor_feedback_given'
    )
    donor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='donor_feedback_received'
    )
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.donor.username}: {self.rating}/5"
