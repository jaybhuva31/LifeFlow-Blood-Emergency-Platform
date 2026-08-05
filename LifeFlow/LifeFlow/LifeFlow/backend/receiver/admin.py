from django.contrib import admin
from .models import Receiver

@admin.register(Receiver)
class ReceiverAdmin(admin.ModelAdmin):
    """
    Receiver Admin Config
    Configures filters and fields to easily search hospital and patient request profiles in admin panel.
    """
    list_display = ('user', 'hospital_name', 'patient_name', 'blood_group_needed', 'units_required', 'emergency_level', 'required_date')
    list_filter = ('blood_group_needed', 'emergency_level', 'required_date')
    search_fields = ('user__username', 'hospital_name', 'patient_name')
    ordering = ('-created_at',)
