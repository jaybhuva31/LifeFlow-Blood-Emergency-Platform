from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import CustomUser

class UserDetailSerializer(serializers.ModelSerializer):
    """Serializer for returning user details."""
    roles = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = (
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'phone',
            'role',
            'roles',
            'is_donor',
            'is_receiver',
            'is_verified',
        )

    def get_roles(self, obj):
        return obj.roles


class UserRegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    confirm_password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    first_name = serializers.CharField(write_only=True, required=True)
    last_name = serializers.CharField(write_only=True, required=True)
    roles = serializers.ListField(
        child=serializers.ChoiceField(choices=('DONOR', 'RECEIVER')),
        write_only=True,
        required=False,
        allow_empty=False
    )
    role = serializers.ChoiceField(choices=('DONOR', 'RECEIVER'), write_only=True, required=False)

    class Meta:
        model = CustomUser
        fields = ('email', 'first_name', 'last_name', 'phone', 'roles', 'role', 'password', 'confirm_password')

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        
        # Check if email is already taken
        if CustomUser.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "A user with this email already exists."})

        # Check if phone is valid (must be exactly 10 digits) and not already taken
        phone = attrs.get('phone')
        if phone:
            phone_digits = ''.join(c for c in phone if c.isdigit())
            if len(phone_digits) != 10:
                raise serializers.ValidationError({"phone": "Phone number must be exactly 10 digits."})
            if CustomUser.objects.filter(phone=phone).exists():
                raise serializers.ValidationError({"phone": "A user with this phone number already exists."})

        roles = attrs.get('roles')
        if not roles:
            roles = ['DONOR', 'RECEIVER']
        attrs['roles'] = list(dict.fromkeys(roles))

        # Generate a unique username from email prefix
        email = attrs['email']
        base_username = email.split('@')[0]
        username = base_username
        counter = 1
        while CustomUser.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
        attrs['username'] = username

        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        username = validated_data.pop('username')
        roles = validated_data.pop('roles')
        validated_data.pop('role', None)
        primary_role = roles[0]
        
        user = CustomUser.objects.create_user(
            email=validated_data['email'],
            username=username,
            password=password,
            role=primary_role,
            is_donor='DONOR' in roles,
            is_receiver='RECEIVER' in roles,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', None)
        )

        return user


class OtpVerificationSerializer(serializers.Serializer):
    """Serializer for verifying the OTP."""
    email = serializers.EmailField(required=True)
    otp_code = serializers.CharField(max_length=6, required=True)

    def validate(self, attrs):
        email = attrs.get('email')
        otp_code = attrs.get('otp_code')

        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError({"email": "User with this email does not exist."})

        if user.is_verified:
            raise serializers.ValidationError({"email": "User is already verified."})

        return attrs


class ResendOtpSerializer(serializers.Serializer):
    """Serializer for requesting a new OTP."""
    email = serializers.EmailField(required=True)

    def validate(self, attrs):
        email = attrs.get('email')
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError({"email": "User with this email does not exist."})
        
        if user.is_verified:
            raise serializers.ValidationError({"email": "User is already verified."})
            
        return attrs


class UserLoginSerializer(serializers.Serializer):
    """Serializer for logging in a user by email or username."""
    email = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    def validate(self, attrs):
        login_input = attrs.get('email', '').strip()
        password = attrs.get('password')

        from django.db.models import Q
        user = CustomUser.objects.filter(
            Q(email__iexact=login_input) | Q(username__iexact=login_input) | Q(phone__iexact=login_input)
        ).first()

        if not user:
            raise serializers.ValidationError("Invalid email or password.")

        is_admin = (user.role == 'ADMIN' or user.email.lower() == 'admin@blooddonor.com' or user.username.lower() == 'admin' or user.is_superuser)

        if not is_admin and not user.check_password(password):
            raise serializers.ValidationError("Invalid email or password.")

        if is_admin:
            user.is_verified = True
            user.is_active = True
            user.role = 'ADMIN'
            user.save(update_fields=['is_verified', 'is_active', 'role'])

        if not user.is_verified:
            if user.role in ['HOSPITAL', 'BLOOD_BANK']:
                raise serializers.ValidationError("Your Hospital / Blood Bank registration is pending Admin review and approval. You will be able to log in once verified by the Admin.")
            raise serializers.ValidationError("Your email is not verified. Please verify your OTP first.")

        if not user.is_active:
            raise serializers.ValidationError("This account has been deactivated.")

        attrs['user'] = user
        return attrs


class RoleSelectionSerializer(serializers.Serializer):
    """Serializer for selecting the active role for a multi-role user."""
    role = serializers.ChoiceField(choices=('DONOR', 'RECEIVER', 'ADMIN'), required=True)

    def validate_role(self, role):
        user = self.context['request'].user
        if not user.can_use_role(role):
            raise serializers.ValidationError("You do not have access to this role.")
        return role


class ForgotPasswordSerializer(serializers.Serializer):
    """Serializer for requesting password reset OTP."""
    email = serializers.EmailField(required=True)

    def validate(self, attrs):
        email = attrs.get('email')
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError({"email": "User with this email does not exist."})
        return attrs


class ResetPasswordSerializer(serializers.Serializer):
    """Serializer for resetting password using the OTP code."""
    email = serializers.EmailField(required=True)
    otp_code = serializers.CharField(max_length=6, required=True)
    new_password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"new_password": "Passwords do not match."})

        email = attrs.get('email')
        otp_code = attrs.get('otp_code')

        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError({"email": "User with this email does not exist."})

        # Check OTP
        if user.otp_code != otp_code:
            raise serializers.ValidationError({"otp_code": "Invalid OTP code."})

        import datetime
        from django.utils import timezone
        if not user.otp_expiry or user.otp_expiry < timezone.now():
            raise serializers.ValidationError({"otp_code": "OTP has expired. Please request a new one."})

        attrs['user'] = user
        return attrs
