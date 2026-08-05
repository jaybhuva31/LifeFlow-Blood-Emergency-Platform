from django.contrib import admin
from .models import DonationCamp, CampRegistration

@admin.register(DonationCamp)
class DonationCampAdmin(admin.ModelAdmin):
    """
    DonationCamp Admin Configuration
    Exposes date search options and check-in QR details in admin panel.
    """
    list_display = ('name', 'location', 'date', 'time', 'organizer', 'status')
    list_filter = ('status', 'date')
    search_fields = ('name', 'location', 'organizer')
    ordering = ('-date',)


@admin.register(CampRegistration)
class CampRegistrationAdmin(admin.ModelAdmin):
    """
    CampRegistration Admin Configuration
    Sets filters to monitor attendance status for registers.
    """
    list_display = ('camp', 'user', 'registered_at', 'attended')
    list_filter = ('attended', 'registered_at')
    search_fields = ('camp__name', 'user__username', 'user__email')
