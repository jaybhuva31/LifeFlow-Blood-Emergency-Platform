from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from .models import BloodRequest
from .serializers import BloodRequestSerializer
from donor.models import Donor
from accounts.models import CustomUser
from .compatibility import get_compatible_donors_for_receiver, get_compatible_receivers_for_donor
from .ml_model import predict_blood_demand
from .recommendation_engine import get_smart_donor_recommendations

# Utility function to create a notification records atomically
def create_app_notification(user, title, message, n_type='ALERT'):
    from notification.models import Notification
    try:
        Notification.objects.create(
            user=user,
            title=title,
            message=message,
            notification_type=n_type
        )
    except Exception as e:
        print(f"Error creating notification: {e}")


class BloodRequestCreateView(APIView):
    """
    Create Blood Request API
    POST: Allows receivers to create an emergency blood request.
    Automatically logs notifications to all matching available donors in the patient's city.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = BloodRequestSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            blood_request = serializer.save(receiver=request.user)
            
            # 1. Alert the receiver of successful submission
            create_app_notification(
                user=request.user,
                title="Blood Request Created",
                message=f"Your emergency request {blood_request.request_id} has been posted successfully. We are searching for matching donors.",
                n_type='ALERT'
            )

            # 2. Alert nearby compatible available donors (Matching Engine trigger)
            target_group = blood_request.blood_group
            target_city = blood_request.hospital_address  # Look in hospital address
            compatible_groups = get_compatible_donors_for_receiver(target_group)
            
            # Fetch donors matching compatible group, availability, and city
            donors = Donor.objects.filter(
                blood_group__in=compatible_groups,
                availability=True
            ).exclude(user=request.user)
            # Find donors in the same city
            matching_donors = [d for d in donors if d.city.lower() in blood_request.hospital_address.lower() or d.city.lower() in blood_request.hospital_name.lower()]
            
            for d in matching_donors:
                create_app_notification(
                    user=d.user,
                    title="EMERGENCY: Blood Request Nearby!",
                    message=f"An emergency request ({blood_request.request_id}) for blood group {target_group} was posted at {blood_request.hospital_name}.",
                    n_type='ALERT'
                )

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RequestHistoryListView(APIView):
    """
    Request History List API
    GET: Returns a list of requests.
    - For Receivers: Returns requests they created.
    - For Donors: Returns requests they accepted.
    - If query parameter 'pending=true' is set: Returns all open 'PENDING' requests in the system.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        pending_only = request.query_params.get('pending') == 'true'

        if pending_only:
            # Open requests ready to be claimed
            requests = BloodRequest.objects.filter(status='PENDING').exclude(receiver=request.user)
        else:
            from django.db.models import Q
            requests = BloodRequest.objects.filter(Q(receiver=request.user) | Q(assigned_donor=request.user))

        serializer = BloodRequestSerializer(requests, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class AcceptBloodRequestView(APIView):
    """
    Accept Blood Request API
    PATCH: Allows a donor to accept an active request.
    Binds the request to the donor and changes status to 'ACCEPTED'.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, request_id):
        try:
            blood_request = BloodRequest.objects.get(request_id=request_id)
        except BloodRequest.DoesNotExist:
            return Response({"detail": "Request not found."}, status=status.HTTP_404_NOT_FOUND)

        if blood_request.receiver_id == request.user.id:
            return Response(
                {"detail": "You cannot accept your own blood request."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if blood_request.status != 'PENDING':
            return Response({"detail": "This request is no longer open."}, status=status.HTTP_400_BAD_REQUEST)

        # Check 3-month donation eligibility
        if hasattr(request.user, 'donor_profile'):
            donor = request.user.donor_profile
            if not donor.is_eligible_to_donate:
                days_left = donor.days_until_eligible
                next_date = donor.next_eligible_date
                return Response({
                    "detail": f"You cannot donate blood yet. Donors must wait 3 months (90 days) between blood donations. You will be eligible on {next_date} ({days_left} days remaining)."
                }, status=status.HTTP_400_BAD_REQUEST)

        # Assign donor and set status to ACCEPTED
        blood_request.assigned_donor = request.user
        blood_request.status = 'ACCEPTED'
        blood_request.save()

        # Send notifications
        # 1. Notify Receiver
        create_app_notification(
            user=blood_request.receiver,
            title="Donor Found!",
            message=f"Donor '{request.user.first_name or request.user.username}' has accepted your request {blood_request.request_id}. Contact: {request.user.phone}.",
            n_type='ALERT'
        )
        # 2. Notify Donor
        create_app_notification(
            user=request.user,
            title="Request Claimed",
            message=f"You have accepted request {blood_request.request_id}. Please coordinate with the hospital.",
            n_type='ALERT'
        )

        serializer = BloodRequestSerializer(blood_request, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class RejectBloodRequestView(APIView):
    """
    Reject/Cancel Claim API
    PATCH: Allows a donor to cancel their acceptance, returning the request status to 'PENDING'.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, request_id):
        try:
            blood_request = BloodRequest.objects.get(request_id=request_id)
        except BloodRequest.DoesNotExist:
            return Response({"detail": "Request not found."}, status=status.HTTP_404_NOT_FOUND)

        if blood_request.assigned_donor != request.user:
            return Response({"detail": "You are not assigned to this request."}, status=status.HTTP_403_FORBIDDEN)

        # Release assignment
        blood_request.assigned_donor = None
        blood_request.status = 'PENDING'
        blood_request.save()

        # Notify receiver
        create_app_notification(
            user=blood_request.receiver,
            title="Donor Cancelled",
            message=f"The assigned donor has released request {blood_request.request_id}. The status has been returned to Pending.",
            n_type='ALERT'
        )

        return Response({"message": "Request released successfully. Status returned to Pending."}, status=status.HTTP_200_OK)


class CompleteBloodRequestView(APIView):
    """
    Complete Blood Request API
    PATCH: Marks request as 'COMPLETED'.
    Increments the donor's donation count and logs the date.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, request_id):
        try:
            blood_request = BloodRequest.objects.get(request_id=request_id)
        except BloodRequest.DoesNotExist:
            return Response({"detail": "Request not found."}, status=status.HTTP_404_NOT_FOUND)

        # Either receiver or the assigned donor can mark completed
        if request.user != blood_request.receiver and request.user != blood_request.assigned_donor:
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        if blood_request.status not in ['ACCEPTED', 'DONOR_ON_THE_WAY']:
            return Response({"detail": "Request cannot be completed from its current state."}, status=status.HTTP_400_BAD_REQUEST)

        blood_request.status = 'COMPLETED'
        blood_request.save()

        # Increment Donor statistics
        if blood_request.assigned_donor:
            try:
                donor_prof = blood_request.assigned_donor.donor_profile
                donor_prof.donation_count += 1
                donor_prof.last_donation_date = timezone.now().date()
                donor_prof.save()
            except Donor.DoesNotExist:
                pass  # Skip if donor profile not fully set up in database

            # Notify donor
            create_app_notification(
                user=blood_request.assigned_donor,
                title="Donation Completed!",
                message=f"Thank you! Request {blood_request.request_id} has been marked completed. You saved a life!",
                n_type='REMINDER'
            )

        # Notify receiver
        create_app_notification(
            user=blood_request.receiver,
            title="Blood Request Completed",
            message=f"Your request {blood_request.request_id} has been marked completed successfully.",
            n_type='ALERT'
        )

        serializer = BloodRequestSerializer(blood_request, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class CancelBloodRequestView(APIView):
    """
    Cancel Blood Request API
    PATCH: Allows the receiver to cancel their request.
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, request_id):
        try:
            blood_request = BloodRequest.objects.get(request_id=request_id)
        except BloodRequest.DoesNotExist:
            return Response({"detail": "Request not found."}, status=status.HTTP_404_NOT_FOUND)

        if blood_request.receiver != request.user:
            return Response({"detail": "You do not own this request."}, status=status.HTTP_403_FORBIDDEN)

        blood_request.status = 'CANCELLED'
        blood_request.save()

        # Notify donor if assigned
        if blood_request.assigned_donor:
            create_app_notification(
                user=blood_request.assigned_donor,
                title="Request Cancelled",
                message=f"The patient has cancelled blood request {blood_request.request_id}.",
                n_type='ALERT'
            )

        return Response({"message": "Request cancelled successfully."}, status=status.HTTP_200_OK)


class TrackBloodRequestView(APIView):
    """
    Track Blood Request API
    GET: Returns a single blood request's full workflow status path.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, request_id):
        try:
            blood_request = BloodRequest.objects.get(request_id=request_id)
            serializer = BloodRequestSerializer(blood_request, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except BloodRequest.DoesNotExist:
            return Response({"detail": "Request not found."}, status=status.HTTP_404_NOT_FOUND)


from .models import EmergencyRequest, RequestResponse, DonorFeedback
from .serializers import EmergencyRequestSerializer, RequestResponseSerializer

class EmergencyRequestCreateView(APIView):
    """
    Create Emergency Request API
    POST: Allows receivers to submit a high-priority emergency blood request.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = EmergencyRequestSerializer(data=request.data)
        if serializer.is_valid():
            emergency_request = serializer.save(receiver=request.user)
            
            # Send standard notifications to matching donors to integrate with existing notification app
            try:
                compatible_groups = get_compatible_donors_for_receiver(emergency_request.blood_group)
                donors = Donor.objects.filter(
                    blood_group__in=compatible_groups,
                    city__iexact=emergency_request.city,
                    availability=True
                ).exclude(user=request.user)
                for d in donors:
                    create_app_notification(
                        user=d.user,
                        title="🔴 Emergency Blood Needed",
                        message=f"An emergency blood request for group {emergency_request.blood_group} has been posted at {emergency_request.hospital_name}.",
                        n_type='ALERT'
                    )
            except Exception as e:
                print(f"Error notifying donors: {e}")

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmergencyRequestListView(APIView):
    """
    Emergency Request List API
    GET: Returns pending emergency requests matching donor profile.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        try:
            donor_profile = user.donor_profile
            accepted_request_ids = RequestResponse.objects.filter(
                donor=user,
                status='ACCEPTED'
            ).values_list('request_id', flat=True)
            if donor_profile.availability:
                responded_ids = RequestResponse.objects.filter(donor=user).values_list('request_id', flat=True)
                compatible_receiver_groups = get_compatible_receivers_for_donor(donor_profile.blood_group)
                pending_requests = EmergencyRequest.objects.filter(
                    blood_group__in=compatible_receiver_groups,
                    city__iexact=donor_profile.city,
                    status='PENDING'
                ).exclude(receiver=user).exclude(id__in=responded_ids)
                requests = (pending_requests | EmergencyRequest.objects.filter(
                    id__in=accepted_request_ids
                )).distinct()
            else:
                # A donor who goes off duty must still be able to finish a donation already accepted.
                requests = EmergencyRequest.objects.filter(id__in=accepted_request_ids)
        except Donor.DoesNotExist:
            requests = EmergencyRequest.objects.none()

        serializer = EmergencyRequestSerializer(requests, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class ActiveAlertsView(APIView):
    """
    Active Alerts API
    GET: Returns list of emergency requests matching the donor's blood group, city and status = Available
    which they have not responded to yet.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        try:
            donor_profile = user.donor_profile
            # Match: donor.blood_group == request.blood_group AND donor.city == request.city AND donor.available == True
            if donor_profile.availability:
                responded_ids = RequestResponse.objects.filter(donor=user).values_list('request_id', flat=True)
                compatible_receiver_groups = get_compatible_receivers_for_donor(donor_profile.blood_group)
                requests = EmergencyRequest.objects.filter(
                    blood_group__in=compatible_receiver_groups,
                    city__iexact=donor_profile.city,
                    status='PENDING'
                ).exclude(receiver=user).exclude(id__in=responded_ids)
            else:
                requests = EmergencyRequest.objects.none()
        except Donor.DoesNotExist:
            requests = EmergencyRequest.objects.none()

        serializer = EmergencyRequestSerializer(requests, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class RespondEmergencyRequestView(APIView):
    """
    Respond Emergency Request API
    POST: Allows a donor to accept or ignore an emergency request.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, request_id):
        try:
            emergency_request = EmergencyRequest.objects.get(id=request_id)
        except EmergencyRequest.DoesNotExist:
            return Response({"detail": "Emergency request not found."}, status=status.HTTP_404_NOT_FOUND)

        if emergency_request.receiver_id == request.user.id:
            return Response(
                {"detail": "You cannot accept your own emergency blood request."},
                status=status.HTTP_400_BAD_REQUEST
            )

        action = request.data.get('status')
        if action not in ['ACCEPTED', 'IGNORED']:
            return Response({"detail": "Invalid status. Must be ACCEPTED or IGNORED."}, status=status.HTTP_400_BAD_REQUEST)

        if action == 'ACCEPTED':
            # Check 3-month donation eligibility
            if hasattr(request.user, 'donor_profile'):
                donor = request.user.donor_profile
                if not donor.is_eligible_to_donate:
                    days_left = donor.days_until_eligible
                    next_date = donor.next_eligible_date
                    return Response({
                        "detail": f"You cannot donate blood yet. Donors must wait 3 months (90 days) between blood donations. You will be eligible on {next_date} ({days_left} days remaining)."
                    }, status=status.HTTP_400_BAD_REQUEST)

            if emergency_request.status != 'PENDING':
                return Response({"detail": "This emergency request is no longer pending."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Update request status to Accepted
            emergency_request.status = 'ACCEPTED'
            emergency_request.save()

            # Create response record
            response_obj, created = RequestResponse.objects.update_or_create(
                request=emergency_request,
                donor=request.user,
                defaults={
                    'status': 'ACCEPTED',
                    'donation_status': 'SENT',
                    'accepted_at': timezone.now()
                }
            )
            
            # Notify receiver
            create_app_notification(
                user=emergency_request.receiver,
                title="Emergency Request Accepted",
                message=f"Donor {request.user.first_name or request.user.username} has accepted your emergency request at {emergency_request.hospital_name}.",
                n_type='ALERT'
            )

            serializer = RequestResponseSerializer(response_obj)
            return Response(serializer.data, status=status.HTTP_200_OK)

        elif action == 'IGNORED':
            response_obj, created = RequestResponse.objects.update_or_create(
                request=emergency_request,
                donor=request.user,
                defaults={'status': 'IGNORED'}
            )
            return Response({"detail": "Request ignored successfully."}, status=status.HTTP_200_OK)


class ReceiverDashboardDataView(APIView):
    """
    Receiver Dashboard Data API
    GET: Returns emergency requests made by receiver, list of accepted donors and request statuses.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Get my emergency requests
        my_requests = EmergencyRequest.objects.filter(receiver=request.user)
        
        # Get accepted responses
        accepted_responses = RequestResponse.objects.filter(
            request__receiver=request.user,
            status='ACCEPTED'
        )

        request_serializer = EmergencyRequestSerializer(my_requests, many=True)
        response_serializer = RequestResponseSerializer(accepted_responses, many=True)

        return Response({
            "my_requests": request_serializer.data,
            "accepted_donors": response_serializer.data
        }, status=status.HTTP_200_OK)


class DonorDashboardDataView(APIView):
    """
    Donor Dashboard Data API
    GET: Returns active alerts and accepted requests for the donor.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        try:
            donor_profile = user.donor_profile
            if donor_profile.availability:
                responded_ids = RequestResponse.objects.filter(donor=user).values_list('request_id', flat=True)
                compatible_receiver_groups = get_compatible_receivers_for_donor(donor_profile.blood_group)
                pending_alerts = EmergencyRequest.objects.filter(
                    blood_group__in=compatible_receiver_groups,
                    city__iexact=donor_profile.city,
                    status='PENDING'
                ).exclude(receiver=user).exclude(id__in=responded_ids)
            else:
                pending_alerts = EmergencyRequest.objects.none()
        except Donor.DoesNotExist:
            pending_alerts = EmergencyRequest.objects.none()

        # Get accepted requests
        accepted_responses = RequestResponse.objects.filter(
            donor=user,
            status='ACCEPTED'
        )
        accepted_requests = [resp.request for resp in accepted_responses]

        alert_serializer = EmergencyRequestSerializer(pending_alerts, many=True, context={'request': request})
        accepted_serializer = EmergencyRequestSerializer(
            accepted_requests,
            many=True,
            context={'request': request}
        )

        return Response({
            "emergency_alerts": alert_serializer.data,
            "accepted_requests": accepted_serializer.data
        }, status=status.HTTP_200_OK)


class UpdateEmergencyDonationStatusView(APIView):
    """Advance an accepted donor through the emergency donation lifecycle."""
    permission_classes = [permissions.IsAuthenticated]
    STATUS_ORDER = ('SENT', 'ON_THE_WAY', 'ARRIVED', 'COMPLETE')

    def patch(self, request, request_id):
        try:
            response = RequestResponse.objects.select_related('request', 'donor').get(
                request_id=request_id,
                donor=request.user,
                status='ACCEPTED'
            )
        except RequestResponse.DoesNotExist:
            return Response(
                {'detail': 'You do not have an accepted donation for this request.'},
                status=status.HTTP_403_FORBIDDEN
            )

        new_status = request.data.get('status')
        if new_status not in self.STATUS_ORDER:
            return Response({'detail': 'Invalid donation status.'}, status=status.HTTP_400_BAD_REQUEST)

        current_index = self.STATUS_ORDER.index(response.donation_status)
        requested_index = self.STATUS_ORDER.index(new_status)
        if requested_index != current_index + 1:
            return Response(
                {'detail': 'Donation status must be advanced one step at a time.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        response.donation_status = new_status
        response.save(update_fields=['donation_status'])
        emergency_request = response.request
        emergency_request.status = new_status
        emergency_request.save(update_fields=['status'])

        if new_status == 'COMPLETE':
            donor = response.donor.donor_profile
            donor.donation_count += 1
            donor.last_donation_date = timezone.now().date()
            donor.save(update_fields=['donation_count', 'last_donation_date', 'updated_at'])
            create_app_notification(
                user=emergency_request.receiver,
                title='Donation completed',
                message=f'Your emergency donation at {emergency_request.hospital_name} is complete. You can now rate the donor.',
                n_type='ALERT'
            )

        return Response(RequestResponseSerializer(response).data, status=status.HTTP_200_OK)


class DonorFeedbackView(APIView):
    """Let a receiver rate the donor from one completed emergency response."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        response_id = request.data.get('response_id')
        rating = request.data.get('rating')
        comment = (request.data.get('comment') or '').strip()

        try:
            rating = int(rating)
        except (TypeError, ValueError):
            return Response({'detail': 'Rating must be a whole number from 1 to 5.'}, status=status.HTTP_400_BAD_REQUEST)
        if not 1 <= rating <= 5:
            return Response({'detail': 'Rating must be between 1 and 5.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            response = RequestResponse.objects.select_related('request', 'donor').get(
                id=response_id,
                request__receiver=request.user,
                status='ACCEPTED',
                donation_status='COMPLETE'
            )
        except RequestResponse.DoesNotExist:
            return Response(
                {'detail': 'A completed donation assigned to you is required before feedback can be submitted.'},
                status=status.HTTP_403_FORBIDDEN
            )

        feedback, created = DonorFeedback.objects.update_or_create(
            response=response,
            defaults={
                'receiver': request.user,
                'donor': response.donor,
                'rating': rating,
                'comment': comment
            }
        )
        return Response(
            {
                'id': feedback.id,
                'rating': feedback.rating,
                'comment': feedback.comment,
                'created': created
            },
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )


class PredictBloodDemandView(APIView):
    """
    Predict Blood Demand ML API
    GET: Returns demand forecast predictions from Scikit-Learn RandomForest model.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        blood_group = request.query_params.get('blood_group', '')
        city = request.query_params.get('city', '')
        if not blood_group and hasattr(request.user, 'donor_profile'):
            blood_group = request.user.donor_profile.blood_group
            city = city or request.user.donor_profile.city
            
        prediction = predict_blood_demand(blood_group, city)
        return Response(prediction, status=status.HTTP_200_OK)


class DummyRequestAdapter:
    def __init__(self, id=1, blood_group='O+', patient_name='Emergency Patient', hospital_name='City General Hospital', city='Mumbai', receiver=None):
        self.id = id
        self.blood_group = blood_group
        self.patient_name = patient_name
        self.hospital_name = hospital_name
        self.city = city
        self.receiver = receiver

class SmartDonorRecommendationView(APIView):
    """
    Smart Donor Recommendation API
    POST/GET: Returns top 10 AI recommended donors for an emergency request sorted by recommendation_score.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        return self._handle_recommendations(request)

    def get(self, request):
        return self._handle_recommendations(request)

    def _handle_recommendations(self, request):
        request_id = request.data.get('request_id') or request.query_params.get('request_id')
        emergency_req = None

        if request_id:
            try:
                emergency_req = EmergencyRequest.objects.filter(id=request_id).first()
            except Exception:
                pass
            if not emergency_req:
                emergency_req = EmergencyRequest.objects.filter(request_id=request_id).first()
                
        if not emergency_req:
            # Fallback to latest emergency request created by current user or in system
            emergency_req = EmergencyRequest.objects.filter(receiver=request.user).first() or EmergencyRequest.objects.first()

        if not emergency_req:
            # Check BloodRequest table
            b_req = BloodRequest.objects.filter(receiver=request.user).first() or BloodRequest.objects.first()
            if b_req:
                emergency_req = DummyRequestAdapter(
                    id=b_req.id,
                    blood_group=b_req.blood_group,
                    patient_name=b_req.patient_name,
                    hospital_name=b_req.hospital_name,
                    city=b_req.hospital_address or 'Mumbai',
                    receiver=b_req.receiver
                )

        if not emergency_req:
            # Fallback sample request adapter so recommendation engine always returns scores
            user_group = getattr(getattr(request.user, 'donor_profile', None), 'blood_group', 'O+')
            user_city = getattr(getattr(request.user, 'donor_profile', None), 'city', 'Mumbai')
            emergency_req = DummyRequestAdapter(
                id=1,
                blood_group=user_group,
                patient_name='Emergency Patient',
                hospital_name='City Medical Center',
                city=user_city,
                receiver=request.user
            )
                
        recommendations = get_smart_donor_recommendations(emergency_req, top_n=10)
        return Response({
            'request_id': emergency_req.id,
            'blood_group': emergency_req.blood_group,
            'hospital_name': emergency_req.hospital_name,
            'city': emergency_req.city,
            'recommended_donors': recommendations
        }, status=status.HTTP_200_OK)


class BatchNotifyDonorsView(APIView):
    """
    Batch Notification API
    POST: Notifies the top batch of recommended donors for an emergency request.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        request_id = request.data.get('request_id')
        batch_size = int(request.data.get('batch_size', 5))
        
        try:
            emergency_req = EmergencyRequest.objects.get(id=request_id)
        except EmergencyRequest.DoesNotExist:
            return Response({'detail': 'Emergency request not found.'}, status=status.HTTP_404_NOT_FOUND)

        recommendations = get_smart_donor_recommendations(emergency_req, top_n=batch_size)
        notified_donors = []
        
        for donor_data in recommendations:
            try:
                donor_user = CustomUser.objects.get(id=donor_data['user_id'])
                create_app_notification(
                    user=donor_user,
                    title="🔴 AI Priority Emergency Request Alert",
                    message=f"You are AI Recommended Top Candidate #{donor_data['ranking']} for blood group {emergency_req.blood_group} at {emergency_req.hospital_name}.",
                    n_type='ALERT'
                )
                notified_donors.append(donor_data['name'])
            except CustomUser.DoesNotExist:
                continue

        return Response({
            'message': f"Successfully alerted top {len(notified_donors)} AI recommended donors.",
            'batch_size': batch_size,
            'notified_donors': notified_donors
        }, status=status.HTTP_200_OK)


