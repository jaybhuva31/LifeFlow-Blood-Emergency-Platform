from django.contrib import admin
from .models import Donor

@admin.register(Donor)
class DonorAdmin(admin.ModelAdmin):
    """
    Donor Admin Config
    Sets list displays and filters to make searching donor profiles easy in Django admin panel.
    """
    list_display = ('user', 'blood_group', 'city', 'availability', 'status', 'donation_count', 'last_donation_date')
    list_filter = ('blood_group', 'city', 'availability', 'status')
    search_fields = ('user__username', 'user__email', 'city', 'phone')
    ordering = ('-created_at',)
