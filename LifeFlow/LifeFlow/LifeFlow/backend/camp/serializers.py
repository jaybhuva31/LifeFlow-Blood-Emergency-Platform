from rest_framework import serializers
from .models import DonationCamp, CampRegistration
from donor.serializers import CustomUserMiniSerializer

class DonationCampSerializer(serializers.ModelSerializer):
    """
    DonationCamp Serializer
    Serializes location parameters, schedule date/time, status values, and check-in QR constants.
    """
    class Meta:
        model = DonationCamp
        fields = '__all__'
        read_only_fields = ('id', 'qr_code_data')


class CampRegistrationSerializer(serializers.ModelSerializer):
    """
    CampRegistration Serializer
    Serializes registrations with nested references to the DonationCamp and CustomUser details.
    """
    camp_details = DonationCampSerializer(source='camp', read_only=True)
    user_details = CustomUserMiniSerializer(source='user', read_only=True)

    class Meta:
        model = CampRegistration
        fields = '__all__'
        read_only_fields = ('id', 'user', 'registered_at')
