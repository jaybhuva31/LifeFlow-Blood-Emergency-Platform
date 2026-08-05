import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import DonationStatusStepper from '../components/DonationStatusStepper';
import api from '../services/api';
import { 
  IoWater, 
  IoLocationOutline, 
  IoCallOutline, 
  IoTimeOutline, 
  IoCheckmarkCircleOutline, 
  IoCloseCircleOutline,
  IoHeartCircleOutline
} from 'react-icons/io5';

const STATUS_BADGE = {
  SENT: { label: 'Sent', bg: '#dbeafe', color: '#1d4ed8' },
  ON_THE_WAY: { label: 'On the Way 🚗', bg: '#fef9c3', color: '#854d0e' },
  ARRIVED: { label: 'Arrived 📍', bg: '#dcfce7', color: '#166534' },
  COMPLETE: { label: 'Complete ✅', bg: '#d1fae5', color: '#065f46' },
  ACCEPTED: { label: 'Accepted', bg: '#dcfce7', color: '#15803d' },
  PENDING: { label: 'Pending', bg: '#fef3c7', color: '#92400e' },
  IGNORED: { label: 'Ignored', bg: '#f1f5f9', color: '#6b7280' },
};

const URGENCY_STYLE = {
  CRITICAL: { label: 'Critical', bg: '#fee2e2', color: '#b91c1c' },
  HIGH: { label: 'High', bg: '#fef3c7', color: '#92400e' },
  NORMAL: { label: 'Low', bg: '#dcfce7', color: '#166534' },
};

const EmergencyRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  const fetchEmergencyRequests = async () => {
    try {
      const response = await api.get('requests/emergency/list/');
      setRequests(response.data);
    } catch (err) {
      setToastType('danger');
      setToastMessage("Failed to load emergency requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEmergencyRequests(); }, []);

  const handleRespond = async (requestId, action) => {
    try {
      await api.post(`requests/emergency/respond/${requestId}/`, { status: action });
      setToastType(action === 'ACCEPTED' ? 'success' : 'warning');
      setToastMessage(action === 'ACCEPTED'
        ? "✅ Request accepted! Coordinate with the hospital."
        : "Request ignored.");
      // Update locally
      if (action === 'ACCEPTED') {
        setRequests(prev => prev.map(r => r.id === requestId ? { ...r, responded: true, donation_status: 'SENT' } : r));
      } else {
        setRequests(prev => prev.filter(r => r.id !== requestId));
      }
    } catch (err) {
      setToastType('danger');
      setToastMessage(err.response?.data?.detail || "Failed to update request response.");
    }
  };

  const handleUpdateStatus = async (reqId, newStatus) => {
    setStatusLoading(prev => ({ ...prev, [reqId]: true }));
    try {
      await api.patch(`requests/emergency/update-status/${reqId}/`, { status: newStatus });
      setRequests(prev => prev.map(r => r.id === reqId ? { ...r, donation_status: newStatus } : r));
      setToastType('success');
      setToastMessage(newStatus === 'COMPLETE'
        ? '🎉 Donation marked complete! Thank you for saving a life.'
        : `Status updated: ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      setToastType('danger');
      setToastMessage(err.response?.data?.detail || "Failed to update status.");
    } finally {
      setStatusLoading(prev => ({ ...prev, [reqId]: false }));
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
        <Loader fullPage={true} message="Fetching emergency requests..." />
      ) : (
        <div className="row g-4">
          <div className="col-lg-3">
            <Sidebar />
          </div>

          <div className="col-lg-9">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderBottom: '1px solid #f0f0f0', paddingBottom: 16, marginBottom: 24 }}>
              <div style={{ color: 'var(--primary-red)' }}>
                <IoHeartCircleOutline size={44} className="animate-pulse" />
              </div>
              <div>
                <h4 className="fw-bold mb-0">Emergency Requests</h4>
                <p className="text-muted small mb-0">High priority requests matching your blood group and city</p>
              </div>
              <div style={{ marginLeft: 'auto', background: 'var(--soft-red)', color: 'var(--primary-red)', padding: '6px 16px', borderRadius: 50, fontWeight: 700, fontSize: '0.85rem' }}>
                {requests.length} Active
              </div>
            </div>

            {requests.length > 0 ? (
              <div className="row g-3">
                {requests.map((item) => {
                  const timeFormatted = new Date(item.created_at).toLocaleString();
                  const isAccepted = item.responded;
                  const currentStatus = item.donation_status || (isAccepted ? 'SENT' : null);
                  const badge = STATUS_BADGE[item.status] || STATUS_BADGE['PENDING'];
                  const urgency = URGENCY_STYLE[item.emergency_level] || URGENCY_STYLE.NORMAL;

                  return (
                    <div className="col-md-6" key={item.id}>
                      <div className="emergency-card p-4 h-100 d-flex flex-column justify-content-between" role="button" tabIndex={0}
                        onClick={() => setSelectedRequest(item)}
                        onKeyDown={(event) => { if (event.key === 'Enter') setSelectedRequest(item); }}>
                        <div>
                          {/* Card Header */}
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <span style={{
                              background: '#fff0f0', color: 'var(--primary-red)',
                              padding: '4px 12px', borderRadius: 50, fontSize: '0.75rem', fontWeight: 700
                            }}>
                              🔴 Emergency
                            </span>
                            <div className="d-flex align-items-center gap-2">
                              <span style={{ background: urgency.bg, color: urgency.color, padding: '4px 10px', borderRadius: 50, fontSize: '0.72rem', fontWeight: 800 }}>
                                {urgency.label}
                              </span>
                              <div className="blood-group-badge">{item.blood_group}</div>
                            </div>
                          </div>

                          <h5 className="fw-bold mb-1">{item.receiver_name}</h5>
                          <p className="small text-muted mb-3">Receiver</p>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.82rem', color: '#6b7280' }}>
                            <div><strong>Hospital:</strong> {item.hospital_name}</div>
                            <div><strong>Units:</strong> {item.units} Unit(s)</div>
                            <div className="d-flex align-items-start gap-1">
                              <IoLocationOutline size={14} color="var(--primary-red)" style={{ flexShrink: 0, marginTop: 2 }} />
                              <span><strong>Location:</strong> {item.location}, {item.city}</span>
                            </div>
                            <div className="d-flex align-items-center gap-1">
                              <IoCallOutline size={14} color="var(--primary-red)" />
                              <a href={`tel:${item.contact_number}`} style={{ color: 'var(--primary-red)', fontWeight: 700, textDecoration: 'none' }}>
                                {item.contact_number}
                              </a>
                            </div>
                            <div className="d-flex align-items-center gap-1">
                              <IoTimeOutline size={14} />
                              <span>{timeFormatted}</span>
                            </div>
                            {item.reason && (
                              <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 12px', marginTop: 4 }}>
                                <strong>Reason:</strong> {item.reason}
                              </div>
                            )}
                          </div>

                          {/* Donation Status Stepper (if accepted) */}
                          {isAccepted && currentStatus && (
                            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Donation Progress
                              </div>
                              <DonationStatusStepper
                                currentStatus={currentStatus}
                                onUpdateStatus={(newStatus) => handleUpdateStatus(item.id, newStatus)}
                                loading={statusLoading[item.id] || false}
                              />
                            </div>
                          )}
                        </div>

                        {/* Action Buttons — only if not yet responded */}
                        {!isAccepted && (
                          <div className="d-flex gap-2 pt-3" style={{ borderTop: '1px solid #f0f0f0', marginTop: 16 }}>
                            <button
                              onClick={(event) => { event.stopPropagation(); handleRespond(item.id, 'ACCEPTED'); }}
                              className="btn btn-red btn-sm py-2 px-3 fw-bold d-flex align-items-center justify-content-center gap-1 flex-grow-1"
                            >
                              <IoCheckmarkCircleOutline size={17} />
                              Accept
                            </button>
                            <button
                              onClick={(event) => { event.stopPropagation(); handleRespond(item.id, 'IGNORED'); }}
                              className="btn btn-outline-secondary btn-sm py-2 px-3 d-flex align-items-center gap-1"
                            >
                              <IoCloseCircleOutline size={17} />
                              Ignore
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                message="No matching emergency requests."
                subMessage="When receivers post emergency blood requests matching your blood group and city, they'll appear here in real-time."
              />
            )}
          </div>
        </div>
      )}
      {selectedRequest && (
        <div className="feedback-overlay" onClick={() => setSelectedRequest(null)}>
          <div className="feedback-card" onClick={(event) => event.stopPropagation()} style={{ maxWidth: 560, textAlign: 'left' }}>
            <button className="auth-close-btn" onClick={() => setSelectedRequest(null)} aria-label="Close request details">×</button>
            <span style={{ background: (URGENCY_STYLE[selectedRequest.emergency_level] || URGENCY_STYLE.NORMAL).bg, color: (URGENCY_STYLE[selectedRequest.emergency_level] || URGENCY_STYLE.NORMAL).color, padding: '5px 12px', borderRadius: 50, fontWeight: 800 }}>
              {(URGENCY_STYLE[selectedRequest.emergency_level] || URGENCY_STYLE.NORMAL).label} priority
            </span>
            <h4 className="fw-bold mt-3 mb-1">{selectedRequest.patient_name || selectedRequest.receiver_name}</h4>
            <p className="text-muted">Emergency request details</p>
            <div className="row g-3 small">
              <div className="col-6"><strong>Blood group:</strong> {selectedRequest.blood_group}</div>
              <div className="col-6"><strong>Units:</strong> {selectedRequest.units}</div>
              <div className="col-6"><strong>Required:</strong> {selectedRequest.required_date || 'Immediately'}</div>
              <div className="col-6"><strong>Time:</strong> {selectedRequest.required_time || 'As soon as possible'}</div>
              <div className="col-12"><strong>Hospital:</strong> {selectedRequest.hospital_name}</div>
              <div className="col-12"><strong>Location:</strong> {selectedRequest.location}, {selectedRequest.city}</div>
              <div className="col-12"><strong>Reason:</strong> {selectedRequest.reason}</div>
              {selectedRequest.remarks && <div className="col-12"><strong>Medical notes:</strong> {selectedRequest.remarks}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyRequestsPage;
