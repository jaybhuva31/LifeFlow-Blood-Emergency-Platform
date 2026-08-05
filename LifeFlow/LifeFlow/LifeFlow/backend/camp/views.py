from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import DonationCamp, CampRegistration
from .serializers import DonationCampSerializer, CampRegistrationSerializer
from requests.views import create_app_notification

class IsAdminUser(permissions.BasePermission):
    """Permission check for Admin users."""
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role == 'ADMIN' or request.user.is_staff or request.user.is_superuser)
        )

class CampListView(APIView):
    """
    Camp List API
    GET: Returns all donation camps.
    Filters: Optional 'status' parameter ('UPCOMING' or 'COMPLETED').
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        status_param = request.query_params.get('status')
        camps = DonationCamp.objects.all()
        
        if status_param:
            camps = camps.filter(status=status_param)
            
        serializer = DonationCampSerializer(camps, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CampDetailsView(APIView):
    """
    Camp Details API
    GET: Returns details of a specific donation camp.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        try:
            camp = DonationCamp.objects.get(pk=pk)
        except DonationCamp.DoesNotExist:
            return Response({"detail": "Camp not found."}, status=status.HTTP_404_NOT_FOUND)
            
        serializer = DonationCampSerializer(camp)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CreateCampView(APIView):
    """
    Create Camp API (Admin only)
    POST: Allows administrators to create/add a new blood donation camp.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def post(self, request):
        serializer = DonationCampSerializer(data=request.data)
        if serializer.is_valid():
            camp = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DeleteCampView(APIView):
    """
    Delete Camp API (Admin only)
    DELETE: Allows administrators to remove a donation camp.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def delete(self, request, pk):
        try:
            camp = DonationCamp.objects.get(pk=pk)
        except DonationCamp.DoesNotExist:
            return Response({"detail": "Camp not found."}, status=status.HTTP_404_NOT_FOUND)

        camp_name = camp.name
        camp.delete()
        return Response({"message": f"Camp '{camp_name}' removed successfully."}, status=status.HTTP_200_OK)


class RegisterCampView(APIView):
    """
    Register Camp API
    POST: Registers the logged-in user to attend a donation camp.
    Admin users cannot register for camps.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, camp_id):
        if request.user.role == 'ADMIN' or request.user.is_superuser:
            return Response({"detail": "Admins cannot register for blood camps. Admins manage and organize camps."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            camp = DonationCamp.objects.get(pk=camp_id)
        except DonationCamp.DoesNotExist:
            return Response({"detail": "Camp not found."}, status=status.HTTP_404_NOT_FOUND)

        if camp.status == 'COMPLETED':
            return Response({"detail": "Cannot register for a completed camp."}, status=status.HTTP_400_BAD_REQUEST)

        # Check for existing registration
        if CampRegistration.objects.filter(camp=camp, user=request.user).exists():
            return Response({"detail": "You are already registered for this camp."}, status=status.HTTP_400_BAD_REQUEST)

        registration = CampRegistration.objects.create(camp=camp, user=request.user)

        create_app_notification(
            user=request.user,
            title="Camp Registration Confirmed",
            message=f"You successfully registered for '{camp.name}' on {camp.date}. Save your QR code for check-in: {camp.qr_code_data}",
            n_type='CAMP'
        )

        serializer = CampRegistrationSerializer(registration, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CampRegistrationCheckInView(APIView):
    """
    Camp Registration Check-In API
    PATCH: Allows admins or camp coordinators to scan and check in users.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        qr_data = request.data.get('qr_code_data')
        username = request.data.get('username')

        if not qr_data or not username:
            return Response({"detail": "Both qr_code_data and username are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            camp = DonationCamp.objects.get(qr_code_data=qr_data)
        except DonationCamp.DoesNotExist:
            return Response({"detail": "Invalid QR code data."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            registration = CampRegistration.objects.get(camp=camp, user__username=username)
        except CampRegistration.DoesNotExist:
            return Response({"detail": "No registration found for this user at this camp."}, status=status.HTTP_404_NOT_FOUND)

        if registration.attended:
            return Response({"detail": "User already checked in."}, status=status.HTTP_400_BAD_REQUEST)

        registration.attended = True
        registration.save()

        create_app_notification(
            user=registration.user,
            title="Thank You for Donating!",
            message=f"Your attendance has been confirmed at '{camp.name}'. Thank you for contributing to saving lives!",
            n_type='CAMP'
        )

        return Response({
            "message": f"Successfully checked in {username} at {camp.name}.",
            "attended": True
        }, status=status.HTTP_200_OK)
