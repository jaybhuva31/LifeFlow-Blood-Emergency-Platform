from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Receiver
from .serializers import ReceiverProfileSerializer

class IsReceiverUser(permissions.BasePermission):
    """
    Custom Permission
    Ensures that only users with receiver capability can access these endpoints.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_receiver


class ReceiverProfileView(APIView):
    """
    Receiver Profile API
    GET: Retrieves the logged-in user's receiver profile.
    POST: Creates a receiver profile for the logged-in user.
    PUT: Updates receiver/hospital requirements parameters.
    """
    permission_classes = [permissions.IsAuthenticated, IsReceiverUser]

    def get(self, request):
        try:
            receiver = request.user.receiver_profile
            serializer = ReceiverProfileSerializer(receiver, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Receiver.DoesNotExist:
            return Response({
                "detail": "Receiver profile not found.",
                "has_profile": False
            }, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        # Prevent duplicate profiles
        if hasattr(request.user, 'receiver_profile'):
            return Response({
                "detail": "Profile already exists. Use PUT endpoint to update."
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = ReceiverProfileSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            receiver = serializer.save(user=request.user)
            request.user.is_receiver = True
            request.user.role = 'RECEIVER'
            request.user.save(update_fields=['is_receiver', 'role'])
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        try:
            receiver = request.user.receiver_profile
        except Receiver.DoesNotExist:
            return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ReceiverProfileSerializer(receiver, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


from .models import HospitalBloodBank
from .serializers import HospitalBloodBankSerializer
from django.db.models import Q

def seed_default_facilities():
    if HospitalBloodBank.objects.exists():
        return
    defaults = [
        {
            'name': 'LifeCare Emergency Hospital & Trauma Center',
            'facility_type': 'HOSPITAL',
            'license_number': 'HOSP-MUM-9481',
            'city': 'Mumbai',
            'address': 'Plot 42, Marine Drive, Churchgate, Mumbai 400020',
            'latitude': 18.9322,
            'longitude': 72.8264,
            'helpline_phone': '+91 98200 12345',
            'operating_hours': '24/7 Emergency Trauma Open',
            'stock_a_positive': 15, 'stock_a_negative': 4,
            'stock_b_positive': 18, 'stock_b_negative': 5,
            'stock_o_positive': 25, 'stock_o_negative': 6,
            'stock_ab_positive': 8, 'stock_ab_negative': 3,
        },
        {
            'name': 'Red Cross Regional Blood Bank',
            'facility_type': 'BLOOD_BANK',
            'license_number': 'BB-DEL-1029',
            'city': 'Delhi',
            'address': 'Red Cross Bhawan, 1 Golf Links, New Delhi 110003',
            'latitude': 28.6041,
            'longitude': 77.2289,
            'helpline_phone': '+91 98110 54321',
            'operating_hours': '24/7 Blood Storage & Component Bank',
            'stock_a_positive': 22, 'stock_a_negative': 8,
            'stock_b_positive': 30, 'stock_b_negative': 10,
            'stock_o_positive': 45, 'stock_o_negative': 12,
            'stock_ab_positive': 14, 'stock_ab_negative': 5,
        },
        {
            'name': 'Apollo Multi-Specialty Hospital',
            'facility_type': 'HOSPITAL',
            'license_number': 'HOSP-BLR-5820',
            'city': 'Bangalore',
            'address': '154/11 Bannerghatta Road, Opp IIMB, Bangalore 560076',
            'latitude': 12.8958,
            'longitude': 77.5989,
            'helpline_phone': '+91 98800 67890',
            'operating_hours': '24/7 Critical Care & Blood Unit',
            'stock_a_positive': 12, 'stock_a_negative': 3,
            'stock_b_positive': 14, 'stock_b_negative': 2,
            'stock_o_positive': 20, 'stock_o_negative': 4,
            'stock_ab_positive': 6, 'stock_ab_negative': 1,
        },
        {
            'name': 'Rotary Central Blood Bank & Storage',
            'facility_type': 'BLOOD_BANK',
            'license_number': 'BB-PUN-7731',
            'city': 'Pune',
            'address': 'JM Road, Shivajinagar, Pune 411005',
            'latitude': 18.5204,
            'longitude': 73.8567,
            'helpline_phone': '+91 98900 98765',
            'operating_hours': '8:00 AM - 10:00 PM Daily',
            'stock_a_positive': 19, 'stock_a_negative': 5,
            'stock_b_positive': 24, 'stock_b_negative': 7,
            'stock_o_positive': 32, 'stock_o_negative': 9,
            'stock_ab_positive': 10, 'stock_ab_negative': 4,
        }
    ]
    for item in defaults:
        HospitalBloodBank.objects.create(**item)


class HospitalBloodBankListView(APIView):
    """
    Public/Authenticated API for searching hospitals and blood banks.
    Admins can see both approved and pending facilities.
    Query Params: ?search=... & ?facility_type=... & ?city=... & ?status=...
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        seed_default_facilities()
        
        status_filter = request.query_params.get('status', '').strip().upper()

        if request.user.is_authenticated and (request.user.role == 'ADMIN' or request.user.is_superuser):
            facilities = HospitalBloodBank.objects.all().order_by('-created_at')
            if status_filter == 'PENDING':
                facilities = facilities.filter(is_verified=False)
            elif status_filter == 'APPROVED':
                facilities = facilities.filter(is_verified=True)
        else:
            facilities = HospitalBloodBank.objects.filter(is_verified=True).order_by('-created_at')

        search = request.query_params.get('search', '').strip()
        facility_type = request.query_params.get('facility_type', '').strip().upper()
        city = request.query_params.get('city', '').strip()

        if search:
            facilities = facilities.filter(
                Q(name__icontains=search) |
                Q(city__icontains=search) |
                Q(address__icontains=search)
            )

        if facility_type and facility_type in ['HOSPITAL', 'BLOOD_BANK']:
            facilities = facilities.filter(facility_type=facility_type)

        if city:
            facilities = facilities.filter(city__icontains=city)

        serializer = HospitalBloodBankSerializer(facilities, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


from .serializers import HospitalRegisterSerializer

class HospitalRegisterView(APIView):
    """Public endpoint for Hospitals and Blood Banks to register an account (Pending Admin Approval)."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = HospitalRegisterSerializer(data=request.data)
        if serializer.is_valid():
            facility = serializer.save()

            # Dispatch notification alert to all Admin / Superuser accounts
            try:
                from notification.models import Notification
                from accounts.models import CustomUser

                admin_users = CustomUser.objects.filter(
                    Q(role='ADMIN') | Q(is_superuser=True) | Q(is_staff=True)
                ).distinct()
                
                for admin in admin_users:
                    Notification.objects.create(
                        user=admin,
                        title=f"🏥 New Facility Registration Alert: {facility.name}",
                        message=f"New {facility.get_facility_type_display()} '{facility.name}' in {facility.city} has registered and requires Admin review. License No: {facility.license_number or 'N/A'}.",
                        notification_type='ALERT'
                    )
            except Exception as e:
                pass

            return Response({
                "message": "Registration submitted successfully! Your Hospital/Blood Bank account is under Admin review. You will be able to log in once verified by the Admin.",
                "facility": HospitalBloodBankSerializer(facility).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class HospitalApproveView(APIView):
    """Admin endpoint to approve or toggle verification status for a Hospital or Blood Bank."""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if not (request.user.role == 'ADMIN' or request.user.is_superuser):
            return Response({"detail": "Admin privilege required."}, status=status.HTTP_403_FORBIDDEN)

        try:
            facility = HospitalBloodBank.objects.get(pk=pk)
        except HospitalBloodBank.DoesNotExist:
            return Response({"detail": "Facility not found."}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('is_verified', not facility.is_verified)
        facility.is_verified = new_status
        facility.save(update_fields=['is_verified'])

        if facility.user:
            facility.user.is_verified = new_status
            facility.user.is_active = new_status
            facility.user.save(update_fields=['is_verified', 'is_active'])

        msg = "Facility approved and activated successfully." if new_status else "Facility set to unverified."
        return Response({"message": msg, "is_verified": new_status}, status=status.HTTP_200_OK)


class HospitalDeleteView(APIView):
    """Admin endpoint to reject or delete a Hospital or Blood Bank facility."""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        if not (request.user.role == 'ADMIN' or request.user.is_superuser):
            return Response({"detail": "Admin privilege required."}, status=status.HTTP_403_FORBIDDEN)

        try:
            facility = HospitalBloodBank.objects.get(pk=pk)
        except HospitalBloodBank.DoesNotExist:
            return Response({"detail": "Facility not found."}, status=status.HTTP_404_NOT_FOUND)

        if facility.user:
            facility.user.delete()
        else:
            facility.delete()

        return Response({"message": "Facility removed successfully."}, status=status.HTTP_200_OK)


class FacilityMyProfileView(APIView):
    """GET/PUT facility profile and stock details for authenticated Hospital / Blood Bank user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            facility = request.user.facility_profile
            serializer = HospitalBloodBankSerializer(facility)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except HospitalBloodBank.DoesNotExist:
            return Response({"detail": "Facility profile not found for this user account."}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request):
        try:
            facility = request.user.facility_profile
        except HospitalBloodBank.DoesNotExist:
            return Response({"detail": "Facility profile not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = HospitalBloodBankSerializer(facility, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class FacilityUpdateStockView(APIView):
    """PATCH endpoint to update live blood stock counts for a Hospital or Blood Bank facility."""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        try:
            facility = request.user.facility_profile
        except HospitalBloodBank.DoesNotExist:
            return Response({"detail": "Facility profile not found."}, status=status.HTTP_404_NOT_FOUND)

        stock_fields = [
            'stock_a_positive', 'stock_a_negative',
            'stock_b_positive', 'stock_b_negative',
            'stock_o_positive', 'stock_o_negative',
            'stock_ab_positive', 'stock_ab_negative'
        ]

        updated = False
        for field in stock_fields:
            if field in request.data:
                try:
                    val = max(0, int(request.data[field]))
                    setattr(facility, field, val)
                    updated = True
                except (ValueError, TypeError):
                    pass

        if updated:
            facility.save()

        serializer = HospitalBloodBankSerializer(facility)
        return Response({
            "message": "Blood stock inventory updated successfully!",
            "facility": serializer.data
        }, status=status.HTTP_200_OK)


class FacilityIncomingRequestsView(APIView):
    """GET endpoint listing pending emergency requests and accepted request history for Hospital / Blood Bank facilities."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from requests.models import EmergencyRequest, BloodRequest
        from requests.serializers import EmergencyRequestSerializer, BloodRequestSerializer

        try:
            facility = request.user.facility_profile
        except HospitalBloodBank.DoesNotExist:
            facility = None

        # Filter pending requests for the incoming queue (only PENDING)
        emergency_pending = EmergencyRequest.objects.filter(status='PENDING').order_by('-created_at')
        blood_pending = BloodRequest.objects.filter(status='PENDING').order_by('-created_at')

        # Filter accepted/completed requests for history & Excel export
        emergency_accepted = EmergencyRequest.objects.filter(Q(status='ACCEPTED') | Q(status='COMPLETE') | Q(status='COMPLETED')).order_by('-created_at')
        blood_accepted = BloodRequest.objects.filter(Q(status='ACCEPTED') | Q(status='COMPLETE') | Q(status='COMPLETED')).order_by('-created_at')

        e_serializer = EmergencyRequestSerializer(emergency_pending, many=True, context={'request': request})
        b_serializer = BloodRequestSerializer(blood_pending, many=True, context={'request': request})

        e_accepted_ser = EmergencyRequestSerializer(emergency_accepted, many=True, context={'request': request})
        b_accepted_ser = BloodRequestSerializer(blood_accepted, many=True, context={'request': request})

        return Response({
            "emergency_requests": e_serializer.data,
            "blood_requests": b_serializer.data,
            "accepted_emergency_requests": e_accepted_ser.data,
            "accepted_blood_requests": b_accepted_ser.data
        }, status=status.HTTP_200_OK)


class FacilityAcceptRequestView(APIView):
    """PATCH endpoint to accept a blood request assigned to or targeting this facility with automatic stock deduction."""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        from requests.models import EmergencyRequest, BloodRequest
        from notification.models import Notification

        try:
            facility = request.user.facility_profile
            facility_name = facility.name
            helpline = facility.helpline_phone
        except HospitalBloodBank.DoesNotExist:
            facility = None
            facility_name = request.user.username
            helpline = "N/A"

        BLOOD_GROUP_STOCK_MAP = {
            'O+': 'stock_o_positive',
            'O-': 'stock_o_negative',
            'A+': 'stock_a_positive',
            'A-': 'stock_a_negative',
            'B+': 'stock_b_positive',
            'B-': 'stock_b_negative',
            'AB+': 'stock_ab_positive',
            'AB-': 'stock_ab_negative',
        }

        # Try EmergencyRequest first (safely checking if pk is integer digit)
        e_req = None
        if str(pk).isdigit():
            e_req = EmergencyRequest.objects.filter(pk=int(pk)).first()

        if e_req:
            bg = (e_req.blood_group or 'O+').strip().upper()
            units_req = int(e_req.units or 1)
            stock_field = BLOOD_GROUP_STOCK_MAP.get(bg)

            deducted_msg = ""
            if facility and stock_field:
                current_stock = int(getattr(facility, stock_field, 0) or 0)
                new_stock = max(0, current_stock - units_req)
                setattr(facility, stock_field, new_stock)
                facility.save(update_fields=[stock_field])
                if current_stock > 0:
                    deducted_msg = f"Stock for {bg} reduced from {current_stock} to {new_stock} unit(s)."
                else:
                    deducted_msg = f"Stock for {bg} is currently 0 units."

            e_req.status = 'ACCEPTED'
            e_req.save(update_fields=['status'])

            Notification.objects.create(
                user=e_req.receiver,
                title="🏥 Request Accepted by Hospital / Blood Bank!",
                message=f"Your emergency request for blood group {e_req.blood_group} ({units_req} unit(s)) has been ACCEPTED by {facility_name}. Contact helpline: {helpline}.",
                notification_type='ALERT'
            )
            return Response({
                "message": f"Emergency blood request #{e_req.id} ACCEPTED successfully! {deducted_msg}",
                "request_id": e_req.id,
                "status": "ACCEPTED"
            }, status=status.HTTP_200_OK)

        # Try BloodRequest
        b_req = BloodRequest.objects.filter(pk=pk).first() if str(pk).isdigit() else None
        if not b_req:
            b_req = BloodRequest.objects.filter(request_id=str(pk)).first()

        if b_req:
            bg = (b_req.blood_group or 'O+').strip().upper()
            units_req = int(b_req.units_required or 1)
            stock_field = BLOOD_GROUP_STOCK_MAP.get(bg)

            deducted_msg = ""
            if facility and stock_field:
                current_stock = int(getattr(facility, stock_field, 0) or 0)
                new_stock = max(0, current_stock - units_req)
                setattr(facility, stock_field, new_stock)
                facility.save(update_fields=[stock_field])
                if current_stock > 0:
                    deducted_msg = f"Stock for {bg} reduced from {current_stock} to {new_stock} unit(s)."
                else:
                    deducted_msg = f"Stock for {bg} is currently 0 units."

            b_req.status = 'ACCEPTED'
            b_req.assigned_donor = request.user
            b_req.save(update_fields=['status', 'assigned_donor'])

            Notification.objects.create(
                user=b_req.receiver,
                title="🏥 Request Accepted by Hospital / Blood Bank!",
                message=f"Your blood request {b_req.request_id} has been ACCEPTED by {facility_name}. Contact helpline: {helpline}.",
                notification_type='ALERT'
            )
            return Response({
                "message": f"Blood request {b_req.request_id} ACCEPTED successfully! {deducted_msg}",
                "request_id": b_req.request_id,
                "status": "ACCEPTED"
            }, status=status.HTTP_200_OK)

        return Response({"detail": "Request not found."}, status=status.HTTP_404_NOT_FOUND)


