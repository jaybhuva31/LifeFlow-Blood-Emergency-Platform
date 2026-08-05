from django.contrib import admin
from .models import BloodRequest

@admin.register(BloodRequest)
class BloodRequestAdmin(admin.ModelAdmin):
    """
    BloodRequest Admin Configuration
    Sets fields and filters to manage user requests inside the Django admin interface.
    """
    list_display = ('request_id', 'receiver', 'patient_name', 'blood_group', 'units_required', 'emergency_level', 'status', 'created_at')
    list_filter = ('blood_group', 'emergency_level', 'status')
    search_fields = ('request_id', 'patient_name', 'hospital_name', 'receiver__username')
    ordering = ('-created_at',)
