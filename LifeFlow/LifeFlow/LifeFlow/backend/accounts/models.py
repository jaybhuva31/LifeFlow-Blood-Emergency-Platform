from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
import random
from datetime import timedelta

# Custom Manager for User Model
class CustomUserManager(BaseUserManager):
    """
    Custom user model manager where email is the unique identifier
    for authentication instead of usernames.
    """
    def create_user(self, email, username, password=None, role='RECEIVER', **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        if not username:
            raise ValueError('The Username field must be set')
        
        email = self.normalize_email(email)
        is_donor = extra_fields.pop('is_donor', role != 'ADMIN')
        is_receiver = extra_fields.pop('is_receiver', role != 'ADMIN')

        if role == 'ADMIN':
            is_donor = False
            is_receiver = False

        user = self.model(
            email=email,
            username=username,
            role=role,
            is_donor=is_donor,
            is_receiver=is_receiver,
            **extra_fields
        )
        user.set_password(password)
        
        # Superuser and Admin roles are automatically verified and active
        if role == 'ADMIN' or extra_fields.get('is_superuser', False):
            user.is_verified = True
            user.is_active = True
        else:
            user.is_verified = False
            # We set is_active to False initially; user becomes active after verifying OTP
            user.is_active = False
            
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, username, password, **extra_fields)

# Custom User Model
class CustomUser(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('DONOR', 'Donor'),
        ('RECEIVER', 'Receiver'),
        ('HOSPITAL', 'Hospital'),
        ('BLOOD_BANK', 'Blood Bank'),
    )

    USER_TYPE_CHOICES = (
        ('INDIVIDUAL', 'Individual'),
        ('HOSPITAL', 'Hospital'),
        ('BLOOD_BANK', 'Blood Bank'),
    )

    email = models.EmailField(unique=True, max_length=255)
    username = models.CharField(unique=True, max_length=150)
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=15, unique=True, null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='RECEIVER')
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='INDIVIDUAL')
    is_donor = models.BooleanField(default=True)
    is_receiver = models.BooleanField(default=True)
    
    # OTP specific fields
    otp_code = models.CharField(max_length=6, null=True, blank=True)
    otp_expiry = models.DateTimeField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    
    # User status fields
    is_active = models.BooleanField(default=False)  # User is inactive until email OTP is verified
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.email} ({self.role})"

    @property
    def roles(self):
        if self.role in ['HOSPITAL', 'BLOOD_BANK']:
            return [self.role]
        roles = []
        if self.is_donor:
            roles.append('DONOR')
        if self.is_receiver:
            roles.append('RECEIVER')
        if self.role == 'ADMIN':
            roles.append('ADMIN')
        return roles

    def can_use_role(self, role):
        if self.role in ['HOSPITAL', 'BLOOD_BANK']:
            return role == self.role
        if role == 'ADMIN':
            return self.is_staff or self.is_superuser or self.role == 'ADMIN'
        if role == 'DONOR':
            return self.is_donor
        if role == 'RECEIVER':
            return self.is_receiver
        return False

    def set_active_role(self, role):
        if not self.can_use_role(role):
            raise ValueError('User does not have access to this role.')
        self.role = role
        self.save(update_fields=['role'])

    def generate_otp(self):
        """Generates a 6 digit OTP and sets expiry to 10 minutes from now."""
        otp = str(random.randint(100000, 999999))
        self.otp_code = otp
        self.otp_expiry = timezone.now() + timedelta(minutes=10)
        self.save()
        return otp

    def verify_otp_code(self, code):
        """Checks if the OTP code is valid and not expired."""
        if (self.otp_code == code and 
                self.otp_expiry and 
                self.otp_expiry > timezone.now()):
            self.is_verified = True
            self.is_active = True
            self.otp_code = None
            self.otp_expiry = None
            self.save()
            return True
        return False
