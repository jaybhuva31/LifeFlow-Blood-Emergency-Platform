from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Donor
from .serializers import DonorProfileSerializer
from accounts.models import CustomUser

class IsDonorUser(permissions.BasePermission):
    """
    Custom Permission
    Ensures that only users with donor capability can access these endpoints.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_donor


class DonorProfileView(APIView):
    """
    Donor Profile API
    GET: Retrieves the logged-in user's donor profile.
    POST: Creates a donor profile for the logged-in user if it doesn't exist.
    PUT/PATCH: Updates profile parameters including medical reports and coordinates.
    """
    permission_classes = [permissions.IsAuthenticated, IsDonorUser]

    def get(self, request):
        try:
            donor = request.user.donor_profile
            serializer = DonorProfileSerializer(donor, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Donor.DoesNotExist:
            return Response({
                "detail": "Profile not found.",
                "has_profile": False
            }, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        # Prevent duplicate profiles
        if hasattr(request.user, 'donor_profile'):
            return Response({
                "detail": "Profile already exists. Use PUT endpoint to update."
            }, status=status.HTTP_400_BAD_REQUEST)
            
        serializer = DonorProfileSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            donor = serializer.save(user=request.user)
            request.user.is_donor = True
            request.user.role = 'DONOR'
            request.user.save(update_fields=['is_donor', 'role'])
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        try:
            donor = request.user.donor_profile
        except Donor.DoesNotExist:
            return Response({"detail": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)
            
        serializer = DonorProfileSerializer(donor, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ToggleAvailabilityView(APIView):
    """
    Toggle Availability API
    PATCH: Inverts the active availability boolean and status choice for the logged-in donor.
    """
    permission_classes = [permissions.IsAuthenticated, IsDonorUser]

    def patch(self, request):
        try:
            donor = request.user.donor_profile
        except Donor.DoesNotExist:
            return Response({"detail": "Donor profile not found."}, status=status.HTTP_404_NOT_FOUND)

        # If attempting to switch availability ON, check 3-month eligibility
        if not donor.availability and not donor.is_eligible_to_donate:
            days_left = donor.days_until_eligible
            next_date = donor.next_eligible_date
            return Response({
                "detail": f"You cannot set availability to Active yet. Donors must wait 3 months (90 days) between blood donations. Eligible on {next_date} ({days_left} days remaining).",
                "availability": False,
                "status": donor.status
            }, status=status.HTTP_400_BAD_REQUEST)

        # Toggle state
        donor.availability = not donor.availability
        donor.status = 'AVAILABLE' if donor.availability else 'ON_LEAVE'
        donor.save()

        return Response({
            "message": "Availability status updated successfully.",
            "availability": donor.availability,
            "status": donor.status
        }, status=status.HTTP_200_OK)


class DonationHistoryView(APIView):
    """
    Donation History API
    GET: Returns a history of past donations for the logged-in donor.
    Includes mock/empty data as a placeholder for Part 3 models.
    """
    permission_classes = [permissions.IsAuthenticated, IsDonorUser]

    def get(self, request):
        from requests.models import RequestResponse

        donation_responses = RequestResponse.objects.select_related('request', 'feedback').filter(
            donor=request.user,
            status='ACCEPTED'
        ).order_by('-accepted_at')

        history = [
            {
                'id': response.id,
                'request_id': response.request.id,
                'date': response.accepted_at.date().isoformat() if response.accepted_at else '',
                'units': response.request.units,
                'hospital': response.request.hospital_name,
                'patient_name': response.request.patient_name or 'Emergency patient',
                'blood_group': response.request.blood_group,
                'status': response.donation_status,
                'rating': response.feedback.rating if hasattr(response, 'feedback') else None,
                'review_comment': response.feedback.comment if hasattr(response, 'feedback') else '',
                'reviewed_at': response.feedback.created_at if hasattr(response, 'feedback') else None,
            }
            for response in donation_responses
        ]
        return Response(history, status=status.HTTP_200_OK)


class DonorReviewsView(APIView):
    """Return feedback received by the signed-in donor."""
    permission_classes = [permissions.IsAuthenticated, IsDonorUser]

    def get(self, request):
        from requests.models import DonorFeedback
        reviews = DonorFeedback.objects.filter(donor=request.user).select_related('receiver', 'response__request')
        return Response([
            {
                'id': review.id,
                'rating': review.rating,
                'comment': review.comment,
                'receiver_name': f'{review.receiver.first_name} {review.receiver.last_name}'.strip() or review.receiver.username,
                'hospital': review.response.request.hospital_name,
                'created_at': review.created_at,
            }
            for review in reviews
        ], status=status.HTTP_200_OK)


class NearbyDonorsView(APIView):
    """
    Nearby Donors API
    GET: Searches for available donors.
    Filters: Optional 'blood_group' and 'city' query parameters.
    Allows receivers to search compatible donors.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        blood_group = request.query_params.get('blood_group')
        city = request.query_params.get('city')

        from django.db.models import Q
        from django.utils import timezone
        from datetime import timedelta

        cutoff_date = timezone.now().date() - timedelta(days=90)

        # Filter active available donors who are medically eligible (no donation in last 90 days)
        donors = Donor.objects.filter(
            availability=True
        ).filter(
            Q(last_donation_date__isnull=True) | Q(last_donation_date__lte=cutoff_date)
        ).exclude(user=request.user)

        if blood_group:
            donors = donors.filter(blood_group=blood_group)
        if city:
            donors = donors.filter(city__icontains=city)

        serializer = DonorProfileSerializer(donors, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
