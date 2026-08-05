from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import CustomUser
from .serializers import (
    UserRegisterSerializer,
    OtpVerificationSerializer,
    ResendOtpSerializer,
    UserLoginSerializer,
    RoleSelectionSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    UserDetailSerializer
)

# Helper function to generate JWT tokens for user
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    # Add custom claims
    refresh['role'] = user.role
    refresh['roles'] = user.roles
    refresh['username'] = user.username
    
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

# Helper function to send OTP email (Gmail SMTP + HTML Template + Console Fallback)
def send_otp_email(user, otp):
    subject = '🔴 Blood Donor Emergency System - Your OTP Verification Code'
    text_message = f"Hello {user.username},\n\nThank you for registering on the Blood Donor Emergency System.\nYour OTP for verification is: {otp}\n\nThis OTP will expire in 10 minutes.\n\nBest regards,\nThe Blood Donor Emergency Team"
    
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; }}
        .card {{ max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }}
        .header {{ text-align: center; margin-bottom: 24px; }}
        .logo {{ color: #d32f2f; font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }}
        .otp-box {{ background: linear-gradient(135deg, #fff5f5, #ffe3e3); border: 2px dashed #d32f2f; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }}
        .otp-code {{ font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #d32f2f; font-family: monospace; }}
        .footer {{ font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; line-height: 1.5; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="logo">🩸 Blood Donor Emergency System</div>
          <h2 style="color: #1e293b; margin-top: 10px; font-size: 18px;">Email Verification Code</h2>
        </div>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Hello <strong>{user.username}</strong>,<br>
          Thank you for joining the Blood Donor Emergency Platform. Please use the following 6-digit OTP code to verify your Gmail account:
        </p>
        <div class="otp-box">
          <div style="font-size: 11px; font-weight: 700; color: #b71c1c; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 1px;">Your OTP Verification Code</div>
          <div class="otp-code">{otp}</div>
        </div>
        <p style="color: #64748b; font-size: 13px; text-align: center;">
          ⏳ This code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
        </p>
        <div class="footer">
          If you did not request this code, please ignore this email.<br>
          © 2026 Blood Donor Emergency System. Save Lives, Donate Blood.
        </div>
      </div>
    </body>
    </html>
    """
    
    # 1. Always print OTP to terminal for instant developer testing
    print("\n" + "="*60)
    print(f"  [OTP EMAIL GENERATED FOR GMAIL: {user.email}]")
    print(f"  YOUR 6-DIGIT VERIFICATION CODE IS: {otp}")
    print("="*60 + "\n")
    
    # 2. Try to dispatch email via configured SMTP (Gmail)
    try:
        send_mail(
            subject,
            text_message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            html_message=html_message,
            fail_silently=False,
        )
        print(f"[Gmail Dispatch] Successfully sent OTP email to {user.email}")
        return True
    except Exception as e:
        print(f"[Gmail Dispatch Notice] Email sending via SMTP failed ({str(e)}). Using printed console OTP fallback.")
        return False


class UserRegisterView(APIView):
    """API endpoint for signing up a new user."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Generate OTP code
            otp = user.generate_otp()
            # Send OTP email
            send_otp_email(user, otp)
            
            return Response({
                "message": "Registration successful. Please verify the OTP sent to your email.",
                "email": user.email,
                "role": user.role,
                "roles": user.roles
            }, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OtpVerificationView(APIView):
    """API endpoint to verify account registration via OTP."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = OtpVerificationSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            otp_code = serializer.validated_data['otp_code']
            
            user = CustomUser.objects.get(email=email)
            if user.verify_otp_code(otp_code):
                return Response({
                    "message": "Account verified successfully. You can now log in."
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    "otp_code": ["Invalid or expired OTP code."]
                }, status=status.HTTP_400_BAD_REQUEST)
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResendOtpView(APIView):
    """API endpoint to regenerate and resend OTP."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResendOtpSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = CustomUser.objects.get(email=email)
            
            # Generate new OTP
            otp = user.generate_otp()
            # Send OTP
            send_otp_email(user, otp)
            
            return Response({
                "message": "A new OTP has been sent to your email."
            }, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserLoginView(APIView):
    """API endpoint to log in a user and return JWT tokens."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']

            # Ensure facility accounts have role locked to HOSPITAL / BLOOD_BANK
            if hasattr(user, 'facility_profile') and user.facility_profile:
                facility_role = user.facility_profile.facility_type
                if user.role != facility_role or user.is_donor or user.is_receiver:
                    user.role = facility_role
                    user.is_donor = False
                    user.is_receiver = False
                    user.save(update_fields=['role', 'is_donor', 'is_receiver'])

            tokens = get_tokens_for_user(user)
            
            # Add user details to response
            user_serializer = UserDetailSerializer(user)
            
            return Response({
                "message": "Login successful.",
                "tokens": tokens,
                "user": user_serializer.data
            }, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RoleSelectionView(APIView):
    """API endpoint to choose the active role for the authenticated user."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = RoleSelectionSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            request.user.set_active_role(serializer.validated_data['role'])
            user_serializer = UserDetailSerializer(request.user)
            return Response({
                "message": "Role selected successfully.",
                "user": user_serializer.data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ForgotPasswordView(APIView):
    """API endpoint to request password reset OTP."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = CustomUser.objects.get(email=email)
            
            # Generate OTP code
            otp = user.generate_otp()
            # Send OTP email
            send_otp_email(user, otp)
            
            return Response({
                "message": "Password reset OTP has been sent to your email.",
                "email": email
            }, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResetPasswordView(APIView):
    """API endpoint to reset password using the OTP."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            new_password = serializer.validated_data['new_password']
            
            # Set new password
            user.set_password(new_password)
            user.otp_code = None
            user.otp_expiry = None
            user.save()
            
            return Response({
                "message": "Password reset successful. You can now log in with your new password."
            }, status=status.HTTP_200_OK)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserDetailView(APIView):
    """API endpoint to get and update the authenticated user's details."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        new_username = request.data.get('username')
        if new_username:
            new_username = new_username.strip()
            if not new_username:
                return Response({"username": ["Username cannot be blank."]}, status=status.HTTP_400_BAD_REQUEST)
            if CustomUser.objects.filter(username__iexact=new_username).exclude(id=request.user.id).exists():
                return Response({"username": ["Username is already taken by another account."]}, status=status.HTTP_400_BAD_REQUEST)
            request.user.username = new_username

        first_name = request.data.get('first_name')
        if first_name is not None:
            request.user.first_name = first_name.strip()

        last_name = request.data.get('last_name')
        if last_name is not None:
            request.user.last_name = last_name.strip()

        phone = request.data.get('phone')
        if phone is not None and phone.strip():
            phone_val = phone.strip()
            phone_digits = ''.join(c for c in phone_val if c.isdigit())
            if len(phone_digits) != 10:
                return Response({"phone": ["Phone number must be exactly 10 digits."]}, status=status.HTTP_400_BAD_REQUEST)
            request.user.phone = phone_val

        request.user.save()
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class IsAdminUserPermission(permissions.BasePermission):
    """Permission check for Admin / Superuser roles."""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role == 'ADMIN' or request.user.is_staff or request.user.is_superuser)
        )


class AdminUserListView(APIView):
    """
    Admin API to list and search all registered users with detailed profile metadata.
    Query Params: ?search=... & ?role=...
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUserPermission]

    def get(self, request):
        from django.db.models import Q

        users = CustomUser.objects.all().order_by('-date_joined')
        search = request.query_params.get('search', '').strip()
        role = request.query_params.get('role', '').strip().upper()

        if search:
            users = users.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(phone__icontains=search)
            )

        if role and role in ['DONOR', 'RECEIVER', 'ADMIN']:
            users = users.filter(role=role)
        else:
            # Exclude admin and facility accounts (HOSPITAL / BLOOD_BANK) so admin user list only shows individual donors/receivers
            users = users.exclude(role__in=['ADMIN', 'HOSPITAL', 'BLOOD_BANK']).exclude(is_superuser=True).filter(facility_profile__isnull=True)

        from requests.models import BloodRequest, EmergencyRequest

        data = []
        for user in users:
            received_requests_count = (
                BloodRequest.objects.filter(receiver=user).count() +
                EmergencyRequest.objects.filter(receiver=user).count()
            )

            city = ""
            blood_group = ""
            donation_count = 0

            try:
                dp = user.donor_profile
                if dp:
                    donation_count = getattr(dp, 'donation_count', 0)
                    city = getattr(dp, 'city', '') or getattr(dp, 'address', '') or ""
                    blood_group = getattr(dp, 'blood_group', '')
            except Exception:
                dp = None

            try:
                rp = user.receiver_profile
                if rp:
                    if not city:
                        city = getattr(rp, 'city', '') or getattr(rp, 'hospital_address', '') or ""
                    if not blood_group:
                        blood_group = getattr(rp, 'blood_group_needed', '')
            except Exception:
                rp = None

            if not city:
                last_em = EmergencyRequest.objects.filter(receiver=user).first()
                if last_em and last_em.city:
                    city = last_em.city

            assigned_donations = BloodRequest.objects.filter(assigned_donor=user).count()
            if assigned_donations > donation_count:
                donation_count = assigned_donations

            item = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'phone': user.phone,
                'role': user.role,
                'is_donor': user.is_donor,
                'is_receiver': user.is_receiver,
                'is_verified': user.is_verified,
                'is_active': user.is_active,
                'is_staff': user.is_staff,
                'date_joined': user.date_joined,
                'city': city or 'Not Specified',
                'blood_group': blood_group or 'N/A',
                'donation_count': donation_count,
                'received_requests_count': received_requests_count,
                'donor_profile': None,
                'receiver_profile': None,
            }
            if dp:
                item['donor_profile'] = {
                    'blood_group': getattr(dp, 'blood_group', ''),
                    'city': getattr(dp, 'city', ''),
                    'address': getattr(dp, 'address', ''),
                    'availability': getattr(dp, 'availability', True),
                    'status': getattr(dp, 'status', 'AVAILABLE'),
                    'donation_count': donation_count,
                    'last_donation_date': getattr(dp, 'last_donation_date', None),
                    'is_eligible': getattr(dp, 'is_eligible_to_donate', True),
                    'next_eligible_date': dp.next_eligible_date.isoformat() if getattr(dp, 'next_eligible_date', None) else None,
                    'days_until_eligible': getattr(dp, 'days_until_eligible', 0),
                }
            if rp:
                item['receiver_profile'] = {
                    'hospital_name': getattr(rp, 'hospital_name', ''),
                    'patient_name': getattr(rp, 'patient_name', ''),
                    'blood_group_needed': getattr(rp, 'blood_group_needed', ''),
                    'city': getattr(rp, 'city', ''),
                }

            data.append(item)

        return Response(data, status=status.HTTP_200_OK)


class AdminVerifyUserView(APIView):
    """Admin API to manually verify email and activate a user account."""
    permission_classes = [permissions.IsAuthenticated, IsAdminUserPermission]

    def patch(self, request, user_id):
        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        # Toggle or set is_verified & is_active
        verify_status = request.data.get('is_verified', True)
        user.is_verified = verify_status
        user.is_active = verify_status
        user.otp_code = None
        user.otp_expiry = None
        user.save(update_fields=['is_verified', 'is_active', 'otp_code', 'otp_expiry'])

        return Response({
            "message": f"User '{user.username}' email verification updated successfully.",
            "is_verified": user.is_verified,
            "is_active": user.is_active
        }, status=status.HTTP_200_OK)


class AdminDeleteUserView(APIView):
    """Admin API to delete/remove a user account from the platform."""
    permission_classes = [permissions.IsAuthenticated, IsAdminUserPermission]

    def delete(self, request, user_id):
        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if user.id == request.user.id:
            return Response({"detail": "You cannot delete your own admin account."}, status=status.HTTP_400_BAD_REQUEST)

        username = user.username
        user.delete()

        return Response({"message": f"User '{username}' was deleted successfully."}, status=status.HTTP_200_OK)

