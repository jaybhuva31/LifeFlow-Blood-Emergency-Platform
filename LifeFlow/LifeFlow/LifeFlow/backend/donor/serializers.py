from rest_framework import serializers
from .models import Donor
from accounts.models import CustomUser

class CustomUserMiniSerializer(serializers.ModelSerializer):
    """
    Sub-serializer for nested CustomUser profile fields.
    Allows returning and updating first_name, last_name, and phone via the profile endpoint.
    """
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'phone', 'role', 'is_donor', 'is_receiver', 'is_verified')
        read_only_fields = ('id', 'username', 'email', 'role', 'is_donor', 'is_receiver', 'is_verified')


class DonorProfileSerializer(serializers.ModelSerializer):
    """
    Donor Profile Serializer
    Serializes all attributes of the Donor model.
    Handles nested user details and maps them to JSON output.
    """
    user = CustomUserMiniSerializer(read_only=True)
    average_rating = serializers.SerializerMethodField()
    total_reviews = serializers.SerializerMethodField()
    is_eligible = serializers.SerializerMethodField()
    next_eligible_date = serializers.SerializerMethodField()
    days_until_eligible = serializers.SerializerMethodField()
    
    # Read-only fields derived from timestamps
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Donor
        fields = '__all__'
        read_only_fields = ('user',)

    def update(self, instance, validated_data):
        # Retrieve context request to access nested JSON input
        request = self.context.get('request')
        if request:
            # Check for nested user parameters
            user_data = request.data
            user = instance.user
            
            # Extract and update user attributes
            if 'first_name' in user_data:
                user.first_name = user_data.get('first_name')
            if 'last_name' in user_data:
                user.last_name = user_data.get('last_name')
            if 'phone' in user_data:
                phone_val = user_data.get('phone') or ''
                phone_digits = ''.join(c for c in phone_val if c.isdigit())
                if phone_val and len(phone_digits) != 10:
                    raise serializers.ValidationError({"phone": "Phone number must be exactly 10 digits."})
                user.phone = phone_val
            user.save()

        # Update the Donor model fields
        return super().update(instance, validated_data)

    def get_average_rating(self, obj):
        from django.db.models import Avg
        result = obj.user.donor_feedback_received.aggregate(average=Avg('rating'))
        return round(result['average'] or 0, 1)

    def get_total_reviews(self, obj):
        return obj.user.donor_feedback_received.count()

    def get_is_eligible(self, obj):
        return obj.is_eligible_to_donate

    def get_next_eligible_date(self, obj):
        d = obj.next_eligible_date
        return d.isoformat() if d else None

    def get_days_until_eligible(self, obj):
        return obj.days_until_eligible

