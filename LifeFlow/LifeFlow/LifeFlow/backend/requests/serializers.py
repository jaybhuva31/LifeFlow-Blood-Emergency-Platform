from rest_framework import serializers
from .models import BloodRequest, EmergencyRequest, RequestResponse
from donor.serializers import CustomUserMiniSerializer

class BloodRequestSerializer(serializers.ModelSerializer):
    """
    BloodRequest Serializer
    Serializes all request parameters.
    Embeds sub-serializers for detailed profiles of the patient/receiver and the helper/donor.
    """
    receiver_details = CustomUserMiniSerializer(source='receiver', read_only=True)
    donor_details = CustomUserMiniSerializer(source='assigned_donor', read_only=True)
    
    # Read-only fields
    request_id = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = BloodRequest
        fields = '__all__'
        read_only_fields = ('receiver', 'assigned_donor', 'request_id')


class RequestResponseSerializer(serializers.ModelSerializer):
    donor_name = serializers.SerializerMethodField()
    donor_phone = serializers.SerializerMethodField()
    donor_blood_group = serializers.SerializerMethodField()
    donor_city = serializers.SerializerMethodField()
    feedback_submitted = serializers.SerializerMethodField()

    class Meta:
        model = RequestResponse
        fields = (
            'id', 'request', 'donor', 'donor_name', 'donor_phone', 'donor_blood_group',
            'donor_city', 'status', 'donation_status', 'accepted_at', 'feedback_submitted'
        )

    def get_donor_name(self, obj):
        return f"{obj.donor.first_name} {obj.donor.last_name}".strip() or obj.donor.username

    def get_donor_phone(self, obj):
        try:
            return obj.donor.donor_profile.phone or obj.donor.phone
        except Exception:
            return obj.donor.phone

    def get_donor_blood_group(self, obj):
        try:
            return obj.donor.donor_profile.blood_group
        except Exception:
            return ""

    def get_donor_city(self, obj):
        try:
            return obj.donor.donor_profile.city
        except Exception:
            return ""

    def get_feedback_submitted(self, obj):
        return hasattr(obj, 'feedback')


class EmergencyRequestSerializer(serializers.ModelSerializer):
    receiver_name = serializers.SerializerMethodField()
    responses = RequestResponseSerializer(many=True, read_only=True)
    donation_status = serializers.SerializerMethodField()
    responded = serializers.SerializerMethodField()

    class Meta:
        model = EmergencyRequest
        fields = '__all__'
        read_only_fields = ('receiver', 'status', 'created_at')

    def get_receiver_name(self, obj):
        return f"{obj.receiver.first_name} {obj.receiver.last_name}".strip() or obj.receiver.username

    def _current_user_response(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        return obj.responses.filter(donor=request.user, status='ACCEPTED').first()

    def get_donation_status(self, obj):
        response = self._current_user_response(obj)
        return response.donation_status if response else None

    def get_responded(self, obj):
        return self._current_user_response(obj) is not None
