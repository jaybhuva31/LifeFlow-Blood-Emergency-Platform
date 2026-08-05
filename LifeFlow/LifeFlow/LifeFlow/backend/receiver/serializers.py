from rest_framework import serializers
from .models import Receiver, HospitalBloodBank
from accounts.models import CustomUser
from donor.serializers import CustomUserMiniSerializer

class ReceiverProfileSerializer(serializers.ModelSerializer):
    """
    Receiver Profile Serializer
    Serializes hospital context, target patient requirements, and timing details.
    Includes custom update triggers for nested first_name and last_name elements.
    """
    user = CustomUserMiniSerializer(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Receiver
        fields = '__all__'
        read_only_fields = ('user',)

    def update(self, instance, validated_data):
        # Retrieve context request to access input details
        request = self.context.get('request')
        if request:
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

        # Update Receiver fields
        return super().update(instance, validated_data)


class HospitalBloodBankSerializer(serializers.ModelSerializer):
    facility_type_display = serializers.CharField(source='get_facility_type_display', read_only=True)
    total_stock = serializers.IntegerField(read_only=True)

    class Meta:
        model = HospitalBloodBank
        fields = '__all__'


class HospitalRegisterSerializer(serializers.Serializer):
    """
    Serializer for registering a new Hospital or Blood Bank facility.
    All fields are strictly compulsory.
    """
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, required=True)
    
    name = serializers.CharField(max_length=200, required=True)
    facility_type = serializers.ChoiceField(choices=('HOSPITAL', 'BLOOD_BANK'), required=True)
    license_number = serializers.CharField(max_length=50, required=True)
    city = serializers.CharField(max_length=100, required=True)
    address = serializers.CharField(required=True)
    helpline_phone = serializers.CharField(max_length=15, required=True)
    operating_hours = serializers.CharField(max_length=100, required=True)

    stock_a_positive = serializers.IntegerField(default=0)
    stock_a_negative = serializers.IntegerField(default=0)
    stock_b_positive = serializers.IntegerField(default=0)
    stock_b_negative = serializers.IntegerField(default=0)
    stock_o_positive = serializers.IntegerField(default=0)
    stock_o_negative = serializers.IntegerField(default=0)
    stock_ab_positive = serializers.IntegerField(default=0)
    stock_ab_negative = serializers.IntegerField(default=0)

    def validate_email(self, value):
        email = value.strip().lower()
        if CustomUser.objects.filter(email=email).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return email

    def validate(self, attrs):
        if attrs.get('password') != attrs.get('confirm_password'):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        
        helpline_phone = attrs.get('helpline_phone', '')
        helpline_digits = ''.join(c for c in helpline_phone if c.isdigit())
        if len(helpline_digits) != 10:
            raise serializers.ValidationError({"helpline_phone": "Helpline phone number must be exactly 10 digits."})

        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        email = validated_data.pop('email')
        password = validated_data.pop('password')
        facility_type = validated_data.get('facility_type')

        username = email.split('@')[0] + '_' + str(CustomUser.objects.count() + 1)
        user = CustomUser.objects.create_user(
            email=email,
            username=username,
            password=password,
            role=facility_type,
            user_type=facility_type,
            phone=validated_data.get('helpline_phone'),
            is_verified=False,
            is_active=False
        )

        facility = HospitalBloodBank.objects.create(
            user=user,
            is_verified=False,
            **validated_data
        )

        return facility


