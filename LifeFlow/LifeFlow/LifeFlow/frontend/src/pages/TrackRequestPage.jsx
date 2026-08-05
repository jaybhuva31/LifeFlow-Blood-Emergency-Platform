import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import RequestTimeline from '../components/RequestTimeline';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  IoPulseOutline, 
  IoCallOutline, 
  IoLocationOutline, 
  IoCheckmarkDoneCircleOutline, 
  IoCloseCircleOutline,
  IoHeartOutline
} from 'react-icons/io5';

const TrackRequestPage = () => {
  const { request_id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requestData, setRequestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  const fetchRequest = async () => {
    try {
      const response = await api.get(`requests/track/${request_id}/`);
      setRequestData(response.data);
    } catch (err) {
      setToastType('danger');
      setToastMessage("Failed to retrieve request details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [request_id]);

  // Status Action triggers
  const handleStatusAction = async (actionType) => {
    setSubmitting(true);
    try {
      let response;
      if (actionType === 'ACCEPT') {
        response = await api.patch(`requests/accept/${request_id}/`);
        setToastMessage("Emergency request accepted successfully!");
      } else if (actionType === 'REJECT') {
        response = await api.patch(`requests/reject/${request_id}/`);
        setToastMessage("Acceptance cancelled. Request returned to Pending.");
      } else if (actionType === 'COMPLETE') {
        response = await api.patch(`requests/complete/${request_id}/`);
        setToastMessage("Thank you! Blood request marked as completed.");
      } else if (actionType === 'CANCEL') {
        response = await api.patch(`requests/cancel/${request_id}/`);
        setToastMessage("Emergency request cancelled successfully.");
      }
      setToastType('success');
      fetchRequest(); // reload values
    } catch (err) {
      setToastType('danger');
      setToastMessage(err.response?.data?.detail || "Action failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-4">
      {toastMessage && (
        <div className="toast-container-custom">
          <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
        </div>
      )}

      {loading ? (
        <Loader fullPage={true} message="Loading tracking status..." />
      ) : !requestData ? (
        <div className="text-center py-5">
          <h4>Request Not Found</h4>
          <p className="text-muted">No request matches code: {request_id}</p>
          <Link to="/" className="btn btn-red">Back to Home</Link>
        </div>
      ) : (
        <div className="row g-4">
          {/* Sidebar */}
          <div className="col-lg-3">
            <Sidebar />
          </div>

          {/* Details */}
          <div className="col-lg-9">
            <div className="custom-card p-4 mb-4">
              <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-4 flex-wrap gap-2">
                <div>
                  <h4 className="fw-bold mb-1">Track Request Status</h4>
                  <p className="text-muted small mb-0">ID: {requestData.request_id} • Status: <strong className="text-danger">{requestData.status}</strong></p>
                </div>
                <span className={`badge bg-${requestData.emergency_level === 'CRITICAL' ? 'danger' : requestData.emergency_level === 'HIGH' ? 'warning text-dark' : 'success'} px-3 py-2 rounded-pill fs-7`}>
                  {requestData.emergency_level} Urgency
                </span>
              </div>

              {/* Progress Timeline Stepper */}
              <RequestTimeline currentStatus={requestData.status} />
            </div>

            <div className="row g-4">
              {/* Patient & Clinic Metadata */}
              <div className="col-md-6">
                <div className="custom-card p-4 h-100">
                  <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                    <IoPulseOutline className="text-danger" />
                    Emergency Details
                  </h5>
                  <div className="mb-3">
                    <label className="text-muted small fw-semibold">Patient Name</label>
                    <div className="fw-bold fs-5 text-dark">{requestData.patient_name}</div>
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="text-muted small fw-semibold">Blood Group Needed</label>
                      <div className="fw-bold text-danger fs-5">{requestData.blood_group}</div>
                    </div>
                    <div className="col-6">
                      <label className="text-muted small fw-semibold">Required Units</label>
                      <div className="fw-bold fs-5 text-dark">{requestData.units_required} Unit(s)</div>
                    </div>
                  </div>
                  <div className="mb-2">
                    <label className="text-muted small fw-semibold">Hospital Name</label>
                    <div className="fw-bold text-dark">{requestData.hospital_name}</div>
                  </div>
                  <div className="mb-3">
                    <label className="text-muted small fw-semibold">Hospital Address</label>
                    <p className="small text-secondary mb-0 d-flex gap-1 align-items-start">
                      <IoLocationOutline className="text-danger flex-shrink-0 mt-1" />
                      {requestData.hospital_address}
                    </p>
                  </div>
                  {requestData.remarks && (
                    <div className="p-3 bg-light rounded-3 small text-muted">
                      <strong>Remarks:</strong> {requestData.remarks}
                    </div>
                  )}
                </div>
              </div>

              {/* Contact/Action Details */}
              <div className="col-md-6">
                <div className="custom-card p-4 h-100 d-flex flex-column">
                  <h5 className="fw-bold mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                    <IoHeartOutline className="text-danger" />
                    Assigned Donor Info
                  </h5>

                  {requestData.assigned_donor ? (
                    <div className="mb-4">
                      <div className="d-flex align-items-center gap-3 mb-3">
                        <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center fw-bold fs-5" style={{ width: '50px', height: '50px' }}>
                          {requestData.blood_group}
                        </div>
                        <div>
                          <h6 className="fw-bold mb-1">{requestData.donor_details?.first_name} {requestData.donor_details?.last_name}</h6>
                          <span className="badge-red py-1 px-3">Available Donor</span>
                        </div>
                      </div>
                      <a href={`tel:${requestData.donor_details?.phone}`} className="btn btn-red w-100 py-3 d-flex align-items-center justify-content-center gap-2 fw-semibold">
                        <IoCallOutline size={18} />
                        Contact Donor: {requestData.donor_details?.phone || 'No contact'}
                      </a>
                    </div>
                  ) : (
                    <div className="text-center py-4 my-auto bg-light rounded-3 border border-dashed mb-4">
                      <p className="text-muted small mb-0">No donor has accepted this request yet.</p>
                      <span className="text-danger small fw-semibold">Status: Finding Match...</span>
                    </div>
                  )}

                  {/* Actions Column */}
                  <div className="mt-auto pt-3 border-top">
                    {/* Donor Action Layout */}
                    {user?.role === 'DONOR' && (
                      <div className="d-flex flex-column gap-2">
                        {requestData.status === 'PENDING' && (
                          <button 
                            onClick={() => handleStatusAction('ACCEPT')} 
                            disabled={submitting}
                            className="btn btn-red w-100 py-3 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                          >
                            <IoCheckmarkDoneCircleOutline size={20} />
                            Accept Emergency Donation
                          </button>
                        )}
                        {requestData.status === 'ACCEPTED' && requestData.assigned_donor?.username === user?.username && (
                          <>
                            <button 
                              onClick={() => handleStatusAction('COMPLETE')} 
                              disabled={submitting}
                              className="btn btn-success w-100 py-3 d-flex align-items-center justify-content-center gap-2 fw-semibold text-white"
                            >
                              <IoCheckmarkDoneCircleOutline size={20} />
                              Mark Donation Completed
                            </button>
                            <button 
                              onClick={() => handleStatusAction('REJECT')} 
                              disabled={submitting}
                              className="btn btn-outline-danger w-100 py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                            >
                              <IoCloseCircleOutline size={18} />
                              Cancel Acceptance
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Receiver Action Layout */}
                    {user?.role === 'RECEIVER' && requestData.receiver_details?.username === user?.username && (
                      <div className="d-flex flex-column gap-2">
                        {['PENDING', 'ACCEPTED'].includes(requestData.status) && (
                          <button 
                            onClick={() => handleStatusAction('CANCEL')} 
                            disabled={submitting}
                            className="btn btn-outline-danger w-100 py-3 d-flex align-items-center justify-content-center gap-2 fw-semibold"
                          >
                            <IoCloseCircleOutline size={20} />
                            Cancel Emergency Request
                          </button>
                        )}
                        {requestData.status === 'ACCEPTED' && (
                          <button 
                            onClick={() => handleStatusAction('COMPLETE')} 
                            disabled={submitting}
                            className="btn btn-success w-100 py-3 text-white d-flex align-items-center justify-content-center gap-2 fw-semibold"
                          >
                            <IoCheckmarkDoneCircleOutline size={20} />
                            Confirm Blood Received (Complete)
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default TrackRequestPage;
