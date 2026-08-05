import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import StatisticsCard from '../components/StatisticsCard';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import MLPredictionPanel from '../components/MLPredictionPanel';
import DonationStatusStepper from '../components/DonationStatusStepper';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  IoWater, 
  IoCalendarOutline, 
  IoCheckboxOutline, 
  IoWarningOutline, 
  IoArrowForwardOutline,
  IoHeartOutline,
  IoTimeOutline,
  IoCheckmarkCircleOutline
} from 'react-icons/io5';

// Streak badge helper
const getStreakBadge = (count) => {
  if (count >= 10) return { label: '🥇 Gold Donor', cls: 'streak-gold' };
  if (count >= 5) return { label: '🥈 Silver Donor', cls: 'streak-silver' };
  if (count >= 1) return { label: '🥉 Bronze Donor', cls: 'streak-bronze' };
  return { label: '🌱 New Donor', cls: 'streak-new' };
};

// Eligibility widget — 90 days between donations
const EligibilityWidget = ({ lastDonationDate }) => {
  if (!lastDonationDate || lastDonationDate === 'Never') {
    return (
      <div className="eligibility-widget eligibility-available">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IoCheckmarkCircleOutline size={24} color="#16a34a" />
          <div>
            <div style={{ fontWeight: 700, color: '#15803d', fontSize: '0.9rem' }}>Eligible to Donate</div>
            <div style={{ color: '#166534', fontSize: '0.78rem' }}>You have never donated — you can donate now!</div>
          </div>
        </div>
      </div>
    );
  }
  const last = new Date(lastDonationDate);
  const nextEligible = new Date(last.getTime() + 90 * 24 * 60 * 60 * 1000);
  const today = new Date();
  const daysLeft = Math.max(0, Math.ceil((nextEligible - today) / (1000 * 60 * 60 * 24)));

  if (daysLeft === 0) {
    return (
      <div className="eligibility-widget eligibility-available">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <IoCheckmarkCircleOutline size={24} color="#16a34a" />
          <div>
            <div style={{ fontWeight: 700, color: '#15803d', fontSize: '0.9rem' }}>✅ Eligible to Donate!</div>
            <div style={{ color: '#166534', fontSize: '0.78rem' }}>90-day recovery period is complete. You can donate again.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="eligibility-widget eligibility-waiting">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <IoTimeOutline size={24} color="#d97706" />
        <div>
          <div style={{ fontWeight: 700, color: '#b45309', fontSize: '0.9rem' }}>⏳ {daysLeft} days until eligible</div>
          <div style={{ color: '#92400e', fontSize: '0.78rem' }}>
            Next eligible: {nextEligible.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  );
};

const STATUS_ORDER = ['SENT', 'ON_THE_WAY', 'ARRIVED', 'COMPLETE'];

const DonorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [acceptedReqs, setAcceptedReqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState({});

  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  const loadDashboardData = async () => {
    try {
      const profileRes = await api.get('donor/profile/');
      setProfile(profileRes.data);
      setHasProfile(true);
    } catch (err) {
      if (err.response?.status === 404) setHasProfile(false);
      else { setToastType('danger'); setToastMessage("Failed to load donor profile."); }
    }
    try {
      const emergencyRes = await api.get('requests/emergency/donor-dashboard-data/');
      setAlerts(emergencyRes.data.emergency_alerts);
      setAcceptedReqs(emergencyRes.data.accepted_requests);
    } catch (err) {
      console.error("Failed to load emergency data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboardData(); }, []);

  const handleRespondEmergency = async (requestId, action) => {
    try {
      await api.post(`requests/emergency/respond/${requestId}/`, { status: action });
      setToastType(action === 'ACCEPTED' ? 'success' : 'warning');
      setToastMessage(action === 'ACCEPTED'
        ? "✅ Emergency request accepted! Coordinate with the hospital."
        : "Request ignored.");
      loadDashboardData();
    } catch (err) {
      setToastType('danger');
      setToastMessage(err.response?.data?.detail || "Failed to respond.");
    }
  };

  const handleAvailabilityToggle = async () => {
    if (!hasProfile) {
      setToastType('warning');
      setToastMessage("Please create your profile first.");
      return;
    }
    setToggleLoading(true);
    try {
      const response = await api.patch('donor/profile/availability/');
      setProfile(prev => ({ ...prev, availability: response.data.availability, status: response.data.status }));
      setToastType('success');
      setToastMessage(`Status → ${response.data.status}`);
      loadDashboardData();
    } catch (err) {
      setToastType('danger');
      setToastMessage("Failed to toggle availability.");
    } finally {
      setToggleLoading(false);
    }
  };

  // Update donation status (Sent → On the Way → Arrived → Complete)
  const handleUpdateStatus = async (reqId, newStatus) => {
    setStatusLoading(prev => ({ ...prev, [reqId]: true }));
    try {
      await api.patch(`requests/emergency/update-status/${reqId}/`, { status: newStatus });
      // Optimistically update
      setAcceptedReqs(prev => prev.map(r => r.id === reqId ? { ...r, donation_status: newStatus } : r));
      // If complete, increment donation count optimistically
      if (newStatus === 'COMPLETE') {
        setProfile(prev => prev ? { ...prev, donation_count: (prev.donation_count || 0) + 1 } : prev);
        setToastType('success');
        setToastMessage("🎉 Donation marked complete! Count updated.");
        loadDashboardData();
      } else {
        setToastType('success');
        setToastMessage(`Status updated to: ${newStatus.replace('_', ' ')}`);
      }
    } catch (err) {
      setToastType('danger');
      setToastMessage(err.response?.data?.detail || "Failed to update status.");
    } finally {
      setStatusLoading(prev => ({ ...prev, [reqId]: false }));
    }
  };

  const streak = profile ? getStreakBadge(profile.donation_count || 0) : null;

  return (
    <div className="container py-4">
      {toastMessage && (
        <div className="toast-container-custom">
          <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
        </div>
      )}

      {loading ? (
        <Loader fullPage={true} message="Loading dashboard..." />
      ) : (
        <div className="row g-4">
          {/* Sidebar */}
          <div className="col-lg-3">
            <Sidebar />
            {/* Eligibility Widget */}
            {hasProfile && (
              <div className="mt-3">
                <EligibilityWidget lastDonationDate={profile?.last_donation_date} />
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="col-lg-9">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h3 className="fw-bold mb-0">Hello, {user.first_name || user.username}!</h3>
                  {streak && <span className={`streak-badge ${streak.cls}`}>{streak.label}</span>}
                </div>
                <p className="text-muted small mb-0 mt-1">Welcome to your donor control panel.</p>
              </div>
              <div className="d-flex align-items-center gap-3">
                <span className="small fw-semibold text-muted">Available</span>
                <div className="form-check form-switch fs-4 mb-0">
                  <input
                    className="form-check-input check-danger"
                    type="checkbox"
                    id="availabilitySwitch"
                    checked={profile ? profile.availability : false}
                    onChange={handleAvailabilityToggle}
                    disabled={toggleLoading || !hasProfile}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>

            {/* Profile Setup Warning */}
            {!hasProfile && (
              <div className="alert alert-warning border-0 p-4 mb-4 rounded-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-warning bg-opacity-25 text-warning rounded-circle p-2">
                    <IoWarningOutline size={26} />
                  </div>
                  <div>
                    <h5 className="alert-heading fw-bold mb-1">Setup Your Donor Profile</h5>
                    <p className="mb-0 small text-dark">Register your biological details to start receiving emergency requests.</p>
                  </div>
                </div>
                <Link to="/profile" className="btn btn-warning fw-semibold px-4 py-2 text-dark d-flex align-items-center gap-2">
                  Complete Profile <IoArrowForwardOutline />
                </Link>
              </div>
            )}

            {/* Stats Row */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <StatisticsCard
                  title="Blood Group"
                  value={profile?.blood_group || 'N/A'}
                  icon={<IoWater size={24} />}
                  description={hasProfile ? "Your biological blood type" : "Complete profile to set"}
                />
              </div>
              <div className="col-md-4">
                <div className="stat-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-red)' }}>
                      <IoHeartOutline size={22} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Donations</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-red)', lineHeight: 1 }}>
                        {profile?.donation_count ?? 0}
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#6b7280', margin: 0 }}>Lifetime life-saves</p>
                </div>
              </div>
              <div className="col-md-4">
                <StatisticsCard
                  title="Last Donated"
                  value={profile?.last_donation_date || 'Never'}
                  icon={<IoCalendarOutline size={24} />}
                  description="90-day recovery interval"
                />
              </div>
            </div>

            {/* ML Prediction Panel */}
            {hasProfile && profile && (
              <MLPredictionPanel
                donorBloodGroup={profile.blood_group}
                donorCity={profile.city}
              />
            )}

            {/* Emergency Alerts */}
            {hasProfile && (
              <div className="custom-card p-4 mb-4" style={{ borderLeft: '4px solid var(--primary-red)' }}>
                <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--primary-red)' }}>
                  <span style={{ width: 10, height: 10, position: 'relative', display: 'inline-block' }}>
                    <span className="position-absolute w-100 h-100 bg-danger rounded-circle animate-ping" />
                    <span className="position-absolute w-100 h-100 bg-danger rounded-circle" />
                  </span>
                  Emergency Alerts ({alerts.length})
                </h5>
                {alerts.length > 0 ? (
                  <div className="row g-3">
                    {alerts.map((alert) => (
                      <div className="col-md-6" key={alert.id}>
                        <div className="emergency-card p-3" role="button" tabIndex={0}
                          onClick={() => navigate('/emergency-requests')}
                          onKeyDown={(event) => { if (event.key === 'Enter') navigate('/emergency-requests'); }}>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <div className="fw-bold text-dark small">{alert.receiver_name}</div>
                              <div className="text-muted" style={{ fontSize: '0.75rem' }}>{alert.hospital_name}</div>
                            </div>
                            <div className="blood-group-badge" style={{ width: 40, height: 40, fontSize: '0.75rem' }}>
                              {alert.blood_group}
                            </div>
                          </div>
                          <p className="small text-muted mb-2">📍 {alert.location}, {alert.city}</p>
                          <div className="d-flex gap-2">
                            <button onClick={(event) => { event.stopPropagation(); handleRespondEmergency(alert.id, 'ACCEPTED'); }} className="btn btn-red btn-sm flex-grow-1 fw-bold" style={{ fontSize: '0.8rem' }}>
                              ✅ Accept
                            </button>
                            <button onClick={(event) => { event.stopPropagation(); handleRespondEmergency(alert.id, 'IGNORED'); }} className="btn btn-outline-secondary btn-sm" style={{ fontSize: '0.8rem' }}>
                              Ignore
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted small mb-0">No active emergency alerts matching your profile in your city.</p>
                )}
              </div>
            )}

            {/* Accepted Requests — with Status Stepper */}
            {false && acceptedReqs.length > 0 && (
              <div className="custom-card p-4 mb-4">
                <h5 className="fw-bold mb-4 d-flex align-items-center gap-2">
                  <IoCheckboxOutline className="text-success" size={22} />
                  My Accepted Donations — Status Tracker
                </h5>
                <div className="d-flex flex-column gap-4">
                  {acceptedReqs.map((req) => {
                    const currentStatus = req.donation_status || 'SENT';
                    return (
                      <div key={req.id} style={{ background: '#f8fafc', borderRadius: 14, padding: '18px 20px', border: '1px solid #e8eaf0' }}>
                        <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                          <div>
                            <div className="fw-bold text-dark">{req.hospital_name}</div>
                            <div className="text-muted small">📍 {req.location}, {req.city} · {req.units} unit(s)</div>
                            <div className="small mt-1">
                              📞 <a href={`tel:${req.contact_number}`} style={{ color: 'var(--primary-red)', fontWeight: 600, textDecoration: 'none' }}>
                                {req.contact_number}
                              </a>
                            </div>
                          </div>
                          <div className="blood-group-badge">{req.blood_group || profile?.blood_group}</div>
                        </div>
                        <DonationStatusStepper
                          currentStatus={currentStatus}
                          onUpdateStatus={(newStatus) => handleUpdateStatus(req.id, newStatus)}
                          loading={statusLoading[req.id] || false}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default DonorDashboard;
