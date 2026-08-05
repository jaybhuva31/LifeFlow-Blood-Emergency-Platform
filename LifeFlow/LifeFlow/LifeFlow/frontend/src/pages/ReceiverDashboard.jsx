import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StatisticsCard from '../components/StatisticsCard';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import FeedbackModal from '../components/FeedbackModal';
import SmartDonorRecommendationModal from '../components/SmartDonorRecommendationModal';
import FloatingVoiceButton from '../components/voice/FloatingVoiceButton';
import VoiceRecorderModal from '../components/voice/VoiceRecorderModal';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  IoWarningOutline, 
  IoSearchOutline, 
  IoCallOutline, 
  IoWaterOutline, 
  IoLocationOutline,
  IoStarOutline,
  IoCheckmarkCircleOutline,
  IoHeartOutline
} from 'react-icons/io5';

// Blood group compatibility chart
const COMPATIBILITY = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
};

const ALL_GROUPS = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

const BloodCompatibilityCard = ({ bloodGroupNeeded }) => {
  if (!bloodGroupNeeded) return null;
  const compatible = COMPATIBILITY[bloodGroupNeeded] || [];
  return (
    <div className="custom-card p-4 mb-4">
      <h6 className="fw-bold mb-1 d-flex align-items-center gap-2">
        <IoWaterOutline size={18} color="var(--primary-red)" />
        Compatible Donors for <span style={{ color: 'var(--primary-red)' }}>{bloodGroupNeeded}</span>
      </h6>
      <p style={{ color: '#6b7280', fontSize: '0.78rem', marginBottom: 16 }}>
        Blood groups that can safely donate to a {bloodGroupNeeded} patient
      </p>
      <div className="compat-grid">
        {ALL_GROUPS.map(g => (
          <div key={g} className={`compat-cell ${compatible.includes(g) ? 'compat-match' : 'compat-no'}`}>
            {compatible.includes(g) ? '✓ ' : ''}{g}
          </div>
        ))}
      </div>
    </div>
  );
};

const ReceiverDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  
  const [myEmergencyRequests, setMyEmergencyRequests] = useState([]);
  const [acceptedDonors, setAcceptedDonors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [recommendModalOpen, setRecommendModalOpen] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState(null);
  const [submittingEmergency, setSubmittingEmergency] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState({
    patient_name: '', blood_group: 'O+', hospital_name: '', city: '', location: '', units: 1,
    reason: '', emergency_level: 'CRITICAL', required_date: new Date().toISOString().split('T')[0],
    required_time: '12:00', remarks: '', contact_number: user?.phone || ''
  });

  const [searchParams, setSearchParams] = useState({ blood_group: 'O+', city: '' });
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Feedback modal state
  const [feedbackDonor, setFeedbackDonor] = useState(null);

  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  const loadReceiverData = async () => {
    try {
      const emergencyRes = await api.get('requests/emergency/receiver-dashboard-data/');
      setMyEmergencyRequests(emergencyRes.data.my_requests);
      setAcceptedDonors(emergencyRes.data.accepted_donors);
    } catch (err) {
      console.error("Failed to load emergency requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReceiverData(); }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const newReq = params.get('new-request');
    const hospital = params.get('hospital');
    const city = params.get('city');

    if (newReq === '1' || hospital) {
      if (hospital || city) {
        setEmergencyForm(prev => ({
          ...prev,
          hospital_name: hospital || prev.hospital_name,
          city: city || prev.city
        }));
      }
      setShowModal(true);
      navigate('/receiver-dashboard', { replace: true });
    }
  }, [location.search, navigate]);

  const handleEmergencySubmit = async (e) => {
    e.preventDefault();
    setSubmittingEmergency(true);
    try {
      await api.post('requests/emergency/create/', emergencyForm);
      setToastType('success');
      setToastMessage("🔴 Emergency request posted! Nearby matching donors alerted.");
      setShowModal(false);
      loadReceiverData();
    } catch (err) {
      setToastType('danger');
      setToastMessage(err.response?.data?.detail || "Failed to post emergency request.");
    } finally {
      setSubmittingEmergency(false);
    }
  };

  const fetchNearbyDonors = async (bloodGroup, city) => {
    setSearching(true);
    try {
      const params = {};
      if (bloodGroup) params.blood_group = bloodGroup;
      if (city) params.city = city;
      const response = await api.get('donor/nearby/', { params });
      // Filter out self — donor can't donate to themselves
      const filtered = response.data.filter(d => d.user?.id !== user?.id);
      setSearchResults(filtered);
    } catch (err) {
      setToastType('danger');
      setToastMessage("Failed to fetch compatible donors.");
    } finally {
      setSearching(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchNearbyDonors(searchParams.blood_group, searchParams.city);
  };

  // Only show PENDING emergency requests in main dashboard (confirmed ones are hidden)
  const pendingRequests = myEmergencyRequests.filter(r => r.status === 'PENDING');
  const latestRequest = myEmergencyRequests[0];
  // Donors who completed a donation (for feedback)
  const completedDonors = acceptedDonors.filter(d => d.status === 'COMPLETE' || d.donation_status === 'COMPLETE');

  return (
    <div className="container py-4">
      {toastMessage && (
        <div className="toast-container-custom">
          <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
        </div>
      )}

      {feedbackDonor && (
        <FeedbackModal
          donor={feedbackDonor}
          onClose={() => setFeedbackDonor(null)}
          onSuccess={(responseId) => {
            setAcceptedDonors(prev => prev.map(donor => (
              donor.id === responseId ? { ...donor, feedback_submitted: true } : donor
            )));
            setToastType('success');
            setToastMessage('⭐ Feedback submitted!');
          }}
        />
      )}

      {loading ? (
        <Loader fullPage={true} message="Loading receiver panels..." />
      ) : (
        <div className="row g-4">
          {/* Sidebar */}
          <div className="col-lg-3">
            <Sidebar />
            {/* Blood Compatibility card in sidebar */}
            <div className="mt-3">
              <BloodCompatibilityCard bloodGroupNeeded={latestRequest?.blood_group || emergencyForm.blood_group} />
            </div>
          </div>

          {/* Main Content */}
          <div className="col-lg-9">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <div>
                <h3 className="fw-bold mb-1">Welcome, {user.first_name || user.username}!</h3>
                <p className="text-muted small mb-0">Find compatible donors and manage emergency blood requests.</p>
              </div>
              <div className="d-flex gap-2">
                <button
                  onClick={() => {
                    setSelectedReqId(latestRequest?.id || null);
                    setRecommendModalOpen(true);
                  }}
                  className="btn btn-outline-danger fw-bold py-2 px-3 d-flex align-items-center gap-2"
                  style={{ borderRadius: 8 }}
                >
                  🤖 AI Donor Recommender
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="btn btn-red fw-bold py-2 px-4 d-flex align-items-center gap-2"
                >
                  <span style={{ width: 8, height: 8, background: '#fff', borderRadius: '50%', animation: 'pulse-dot 1.5s infinite', display: 'inline-block' }} />
                  Emergency Request
                </button>
              </div>
            </div>

            {/* Latest submitted emergency request */}
            {latestRequest && (
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <div className="custom-card p-4 h-100" style={{ borderLeft: '4px solid var(--primary-red)' }}>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h6 className="fw-bold text-uppercase small mb-0" style={{ color: 'var(--primary-red)', letterSpacing: '0.06em' }}>
                        Latest Emergency Request
                      </h6>
                      {latestRequest.status !== 'PENDING' && (
                        <span className="d-flex align-items-center gap-1" style={{ color: '#15803d', fontSize: '0.78rem', fontWeight: 800 }}>
                          <IoCheckmarkCircleOutline size={18} /> Accepted by donor
                        </span>
                      )}
                    </div>
                    <h4 className="fw-bold mb-1">{latestRequest.patient_name || 'Emergency patient'}</h4>
                    <p className="small text-muted mb-3">Patient Name</p>
                    <div className="row g-2 text-muted small">
                      <div className="col-6"><strong>Required:</strong> {latestRequest.required_date || 'Immediately'}</div>
                      <div className="col-6"><strong>Time:</strong> {latestRequest.required_time || 'As soon as possible'}</div>
                      <div className="col-6"><strong>Units:</strong> {latestRequest.units} unit(s)</div>
                      <div className="col-6">
                        <strong>Urgency:</strong>{' '}
                        <span className={`badge ms-1 ${latestRequest.emergency_level === 'CRITICAL' ? 'bg-danger' : latestRequest.emergency_level === 'HIGH' ? 'bg-warning text-dark' : 'bg-success'}`}>
                          {latestRequest.emergency_level}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="custom-card p-4 h-100">
                    <h6 className="fw-bold text-uppercase small mb-3 text-muted" style={{ letterSpacing: '0.06em' }}>Hospital</h6>
                    <h5 className="fw-bold mb-1">{latestRequest.hospital_name}</h5>
                    <p className="small text-muted mb-3 d-flex align-items-start gap-1">
                      <IoLocationOutline color="var(--primary-red)" className="flex-shrink-0 mt-1" />
                      {latestRequest.location}, {latestRequest.city}
                    </p>
                    {latestRequest.remarks && (
                      <div className="p-3 rounded-3 small text-muted mb-3" style={{ background: '#f8fafc' }}>
                        <strong>Remarks:</strong> {latestRequest.remarks}
                      </div>
                    )}
                    {latestRequest.status !== 'COMPLETE' && latestRequest.status !== 'COMPLETED' && (
                      <button
                        onClick={() => {
                          setSelectedReqId(latestRequest.id);
                          setRecommendModalOpen(true);
                        }}
                        className="btn btn-danger btn-sm w-100 fw-bold d-flex align-items-center justify-content-center gap-2"
                        style={{ borderRadius: 8, padding: '10px 14px' }}
                      >
                        🤖 View AI Donor Recommendations
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Emergency Requests — only show PENDING */}
            {pendingRequests.length > 0 && (
              <div className="custom-card p-4 mb-4">
                <h5 className="fw-bold mb-3" style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>
                  🔴 My Pending Requests
                </h5>
                <div className="d-flex flex-column gap-2">
                  {pendingRequests.map((req) => (
                    <div key={req.id} style={{ background: '#fff7f7', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px' }}>
                      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                          <div className="fw-bold small">{req.hospital_name}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {req.units} unit(s) · {req.blood_group} needed
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedReqId(req.id);
                              setRecommendModalOpen(true);
                            }}
                            className="btn btn-outline-danger btn-sm fw-bold"
                            style={{ borderRadius: 6, fontSize: '0.75rem' }}
                          >
                            🤖 AI Recommendations
                          </button>
                          <span style={{ background: '#fff3cd', color: '#856404', padding: '3px 12px', borderRadius: 50, fontSize: '0.75rem', fontWeight: 700 }}>
                            ⏳ PENDING
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Accepted Donors — with Feedback */}
            {false && acceptedDonors.length > 0 && (
              <div className="custom-card p-4 mb-4">
                <h5 className="fw-bold mb-3" style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>
                  ✅ Donors Who Accepted Your Request
                </h5>
                <div className="d-flex flex-column gap-3">
                  {acceptedDonors.map((donor) => {
                    const acceptedTime = new Date(donor.accepted_at).toLocaleString();
                    const isComplete = donor.status === 'COMPLETE' || donor.donation_status === 'COMPLETE';
                    return (
                      <div key={donor.id} style={{ background: '#f8fafc', borderRadius: 14, padding: '16px', border: '1px solid #e8eaf0' }}>
                        <div className="d-flex justify-content-between align-items-start mb-2 flex-wrap gap-2">
                          <div className="d-flex align-items-center gap-3">
                            <div style={{
                              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                              background: 'linear-gradient(135deg, #e53935, #b71c1c)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 800, color: '#fff', fontSize: '0.8rem'
                            }}>
                              {donor.donor_blood_group}
                            </div>
                            <div>
                              <div className="fw-bold">{donor.donor_name}</div>
                              <div className="text-muted small">📞{' '}
                                <a href={`tel:${donor.donor_phone}`} style={{ color: 'var(--primary-red)', fontWeight: 600, textDecoration: 'none' }}>
                                  {donor.donor_phone}
                                </a>
                                {' · '}{donor.donor_city}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {isComplete && (
                              <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: 50, fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <IoCheckmarkCircleOutline size={12} /> Complete
                              </span>
                            )}
                            {/* Give Feedback button for completed donors */}
                            {isComplete && !donor.feedback_submitted && (
                              <button
                                className="btn btn-sm d-flex align-items-center gap-1"
                                style={{ background: '#fff3cd', color: '#92400e', border: '1px solid #fcd34d', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700 }}
                                onClick={() => setFeedbackDonor(donor)}
                              >
                                <IoStarOutline size={14} />
                                Rate Donor
                              </button>
                            )}
                            {isComplete && donor.feedback_submitted && (
                              <span style={{ color: '#15803d', fontSize: '0.75rem', fontWeight: 700 }}>
                                Rated
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="small text-muted">
                          <IoHeartOutline size={12} className="me-1" />
                          Accepted: {acceptedTime}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Donor Search */}
            <div className="custom-card p-4 mb-4">
              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                <IoSearchOutline color="var(--primary-red)" size={20} />
                Find Compatible Donors
              </h5>

              <form onSubmit={handleSearchSubmit} className="row g-3 mb-4">
                <div className="col-md-4">
                  <label className="form-label">Blood Group Needed</label>
                  <select
                    className="form-select"
                    value={searchParams.blood_group}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, blood_group: e.target.value }))}
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-5">
                  <label className="form-label">Search City</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Mumbai, Pune"
                    value={searchParams.city}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div className="col-md-3 d-flex align-items-end">
                  <button type="submit" disabled={searching} className="btn btn-red w-100 py-2 d-flex align-items-center justify-content-center gap-2">
                    <IoSearchOutline size={17} />
                    {searching ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </form>

              <h6 className="fw-bold text-muted mb-3" style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 10 }}>
                Compatible Available Donors ({searchResults.length})
              </h6>

              {searching ? (
                <Loader message="Scanning database..." />
              ) : searchResults.length > 0 ? (
                <div className="row g-3">
                  {searchResults.map((donor) => (
                    <div className="col-md-6" key={donor.id}>
                      <div className="donor-card">
                        <div className="donor-avatar">{donor.blood_group}</div>
                        <div className="flex-grow-1 overflow-hidden">
                          <div className="fw-bold text-truncate">{donor.user?.first_name} {donor.user?.last_name}</div>
                          <div className="small text-muted d-flex align-items-center gap-1">
                            <IoLocationOutline size={13} color="var(--primary-red)" />
                            {donor.city}
                          </div>
                          <a href={`tel:${donor.phone || donor.user?.phone}`} className="small d-flex align-items-center gap-1 mt-1" style={{ color: 'var(--primary-red)', fontWeight: 600, textDecoration: 'none' }}>
                            <IoCallOutline size={13} />
                            {donor.phone || donor.user?.phone || 'No Phone'}
                          </a>
                        </div>
                        {/* Rating display */}
                        {donor.average_rating > 0 && (
                          <div style={{ textAlign: 'center', flexShrink: 0 }}>
                            <div style={{ color: '#f59e0b', fontWeight: 800, fontSize: '1rem' }}>★</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280' }}>{donor.average_rating?.toFixed(1)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  message="No compatible donors found."
                  subMessage="Try modifying the search filters or extending to other cities."
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Emergency Request Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 1060, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 520, boxShadow: '0 32px 80px rgba(0,0,0,0.35)', overflow: 'hidden', animation: 'slideUp 0.3s ease' }}>
            <div style={{ background: 'linear-gradient(135deg, #c62828, #e53935)', padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h5 style={{ color: '#fff', fontWeight: 800, margin: 0 }}>🔴 Emergency Blood Request</h5>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', margin: '4px 0 0' }}>Matching donors will be alerted instantly</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                ✕
              </button>
            </div>
            <form onSubmit={handleEmergencySubmit}>
              <div style={{ padding: '24px 28px', maxHeight: '65vh', overflowY: 'auto' }}>
                <div className="row g-2 mb-3">
                  <div className="col-7">
                    <label className="form-label">Patient Full Name</label>
                    <input type="text" className="form-control" value={emergencyForm.patient_name}
                      onChange={(e) => setEmergencyForm(prev => ({ ...prev, patient_name: e.target.value }))}
                      placeholder="Patient's name" required />
                  </div>
                  <div className="col-5">
                    <label className="form-label">Blood Group Needed</label>
                    <select className="form-select" value={emergencyForm.blood_group}
                      onChange={(e) => setEmergencyForm(prev => ({ ...prev, blood_group: e.target.value }))} required>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label">Urgency Level</label>
                    <select className="form-select" value={emergencyForm.emergency_level}
                      onChange={(e) => setEmergencyForm(prev => ({ ...prev, emergency_level: e.target.value }))}>
                      <option value="CRITICAL">Critical (Immediate)</option>
                      <option value="HIGH">High urgency</option>
                      <option value="NORMAL">Normal</option>
                    </select>
                  </div>
                  <div className="col-3">
                    <label className="form-label">Required Date</label>
                    <input type="date" className="form-control" value={emergencyForm.required_date}
                      onChange={(e) => setEmergencyForm(prev => ({ ...prev, required_date: e.target.value }))} required />
                  </div>
                  <div className="col-3">
                    <label className="form-label">Time</label>
                    <input type="time" className="form-control" value={emergencyForm.required_time}
                      onChange={(e) => setEmergencyForm(prev => ({ ...prev, required_time: e.target.value }))} required />
                  </div>
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-8">
                    <label className="form-label">Hospital Name</label>
                    <input type="text" className="form-control" value={emergencyForm.hospital_name}
                      onChange={(e) => setEmergencyForm(prev => ({ ...prev, hospital_name: e.target.value }))}
                      placeholder="e.g. Apollo Hospital" required />
                  </div>
                  <div className="col-4">
                    <label className="form-label">Units Needed</label>
                    <input type="number" className="form-control" value={emergencyForm.units}
                      onChange={(e) => setEmergencyForm(prev => ({ ...prev, units: parseInt(e.target.value) || 1 }))}
                      min={1} max={20} required />
                  </div>
                </div>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label">City</label>
                    <input type="text" className="form-control" value={emergencyForm.city}
                      onChange={(e) => setEmergencyForm(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="e.g. Ahmedabad" required />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Contact Number</label>
                    <input type="tel" className="form-control" value={emergencyForm.contact_number}
                      onChange={(e) => setEmergencyForm(prev => ({ ...prev, contact_number: e.target.value }))}
                      placeholder="+91 98765 43210" required />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Location / Address</label>
                  <input type="text" className="form-control" value={emergencyForm.location}
                    onChange={(e) => setEmergencyForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Near Kalupur Station" required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Reason for Request</label>
                  <textarea className="form-control" value={emergencyForm.reason}
                    onChange={(e) => setEmergencyForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="e.g. Open heart surgery, trauma..." rows={3} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Remarks / Medical Notes (optional)</label>
                  <textarea className="form-control" value={emergencyForm.remarks}
                    onChange={(e) => setEmergencyForm(prev => ({ ...prev, remarks: e.target.value }))}
                    placeholder="Operation details, blood component needs, or other critical notes" rows={3} />
                </div>
              </div>
              <div style={{ padding: '16px 28px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-outline-secondary flex-grow-1" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" disabled={submittingEmergency} className="btn btn-red flex-grow-1 fw-bold">
                  {submittingEmergency ? '⏳ Posting...' : '🔴 Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Smart Donor Recommendation Modal */}
      <SmartDonorRecommendationModal
        requestId={selectedReqId}
        isOpen={recommendModalOpen}
        onClose={() => setRecommendModalOpen(false)}
      />

      {/* AI Voice Activated Emergency Request Module */}
      <FloatingVoiceButton onClick={() => setVoiceModalOpen(true)} />
      <VoiceRecorderModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onRequestSubmitted={(res) => {
          setToastType('success');
          setToastMessage(`🚨 Emergency Request submitted via Voice AI for ${res.blood_group}! ${res.notified_donors_count} donors notified.`);
          loadReceiverData();
        }}
      />
    </div>
  );
};

export default ReceiverDashboard;
