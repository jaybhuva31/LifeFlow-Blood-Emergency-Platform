from django.db import models
from django.conf import settings

class Receiver(models.Model):
    """
    Receiver Model
    Stores detailed profile information for registered receivers/hospitals.
    Tracks default blood request criteria, including hospital context, patient details, and urgency levels.
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

    EMERGENCY_LEVELS = (
        ('CRITICAL', 'Critical (Immediate)'),
        ('HIGH', 'High'),
        ('NORMAL', 'Normal'),
    )

    # 1-to-1 link to user credentials
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='receiver_profile')
    
    # Institution details
    hospital_name = models.CharField(max_length=200)
    hospital_address = models.TextField()
    
    # Patient details
    patient_name = models.CharField(max_length=150)
    
    # Blood Request criteria
    blood_group_needed = models.CharField(max_length=5, choices=BLOOD_GROUPS)
    units_required = models.IntegerField(default=1)
    emergency_level = models.CharField(max_length=15, choices=EMERGENCY_LEVELS, default='NORMAL')
    
    # Timing details
    required_date = models.DateField()
    required_time = models.TimeField()
    
    # Additional context
    remarks = models.TextField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Receiver Profile"
        verbose_name_plural = "Receiver Profiles"

    def __str__(self):
        return f"{self.patient_name} - {self.blood_group_needed} needed at {self.hospital_name}"


class HospitalBloodBank(models.Model):
    FACILITY_TYPES = (
        ('HOSPITAL', 'Hospital / Clinic'),
        ('BLOOD_BANK', 'Blood Bank'),
    )

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='facility_profile', null=True, blank=True)
    name = models.CharField(max_length=200)
    facility_type = models.CharField(max_length=20, choices=FACILITY_TYPES, default='HOSPITAL')
    license_number = models.CharField(max_length=50, blank=True, null=True)
    city = models.CharField(max_length=100)
    address = models.TextField()
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    helpline_phone = models.CharField(max_length=15)
    operating_hours = models.CharField(max_length=100, default='24/7 Emergency Open')
    is_verified = models.BooleanField(default=False)

    # Blood stock inventory (units available)
    stock_a_positive = models.IntegerField(default=0)
    stock_a_negative = models.IntegerField(default=0)
    stock_b_positive = models.IntegerField(default=0)
    stock_b_negative = models.IntegerField(default=0)
    stock_o_positive = models.IntegerField(default=0)
    stock_o_negative = models.IntegerField(default=0)
    stock_ab_positive = models.IntegerField(default=0)
    stock_ab_negative = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Hospital & Blood Bank Facility"
        verbose_name_plural = "Hospitals & Blood Banks Facilities"

    def __str__(self):
        return f"{self.name} ({self.get_facility_type_display()}) - {self.city}"

    @property
    def total_stock(self):
        return (
            self.stock_a_positive + self.stock_a_negative +
            self.stock_b_positive + self.stock_b_negative +
            self.stock_o_positive + self.stock_o_negative +
            self.stock_ab_positive + self.stock_ab_negative
        )

