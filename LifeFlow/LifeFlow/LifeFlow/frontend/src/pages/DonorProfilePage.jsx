import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import DonationStatusStepper from '../components/DonationStatusStepper';
import LocationDetector from '../components/LocationDetector';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  IoSaveOutline, 
  IoLocationOutline, 
  IoDocumentAttachOutline, 
  IoImageOutline, 
  IoPersonCircleOutline,
  IoTrophyOutline,
  IoStarOutline,
  IoHeartOutline,
  IoDownloadOutline
} from 'react-icons/io5';

// Streak badge helper (same as dashboard)
const getStreakBadge = (count) => {
  if (count >= 10) return { label: '🥇 Gold Donor', cls: 'streak-gold', emoji: '🥇' };
  if (count >= 5) return { label: '🥈 Silver Donor', cls: 'streak-silver', emoji: '🥈' };
  if (count >= 1) return { label: '🥉 Bronze Donor', cls: 'streak-bronze', emoji: '🥉' };
  return { label: '🌱 New Donor', cls: 'streak-new', emoji: '🌱' };
};

// Star display
const StarDisplay = ({ rating }) => (
  <div style={{ display: 'flex', gap: 2 }}>
    {[1, 2, 3, 4, 5].map(s => (
      <span key={s} style={{ color: s <= Math.round(rating) ? '#f59e0b' : '#e2e8f0', fontSize: '1rem' }}>★</span>
    ))}
  </div>
);

const DonorProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    blood_group: 'O+',
    weight: '',
    age: '',
    gender: 'MALE',
    address: '',
    city: '',
    latitude: '',
    longitude: '',
    medical_disease: '',
    last_donation_date: '',
  });

  const [profilePic, setProfilePic] = useState(null);
  const [bloodReport, setBloodReport] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Profile stats
  const [donationCount, setDonationCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [donations, setDonations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [statusLoading, setStatusLoading] = useState({});

  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('donor/profile/');
        const data = response.data;
        setFormData({
          first_name: data.user?.first_name || '',
          last_name: data.user?.last_name || '',
          phone: data.phone || data.user?.phone || '',
          blood_group: data.blood_group,
          weight: data.weight,
          age: data.age,
          gender: data.gender,
          address: data.address,
          city: data.city,
          latitude: data.latitude || '',
          longitude: data.longitude || '',
          medical_disease: data.medical_disease || '',
          last_donation_date: data.last_donation_date || '',
        });
        setDonationCount(data.donation_count || 0);
        setAverageRating(data.average_rating || 0);
        setTotalReviews(data.total_reviews || 0);
        setHasProfile(true);
        try {
          const donationResponse = await api.get('donor/history/');
          setDonations(donationResponse.data);
          const reviewResponse = await api.get('donor/reviews/');
          setReviews(reviewResponse.data);
        } catch {
          setDonations([]);
          setReviews([]);
        }
      } catch (err) {
        if (err.response?.status === 404) setHasProfile(false);
        else { setToastType('danger'); setToastMessage("Failed to fetch donor profile."); }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setToastType('warning');
      setToastMessage("Geolocation is not supported by your browser.");
      return;
    }
    setToastType('info');
    setToastMessage("Fetching GPS coordinates...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }));
        setToastType('success');
        setToastMessage("Coordinates captured successfully!");
      },
      () => { setToastType('danger'); setToastMessage("Location permission denied."); }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const cleanPhone = (formData.phone || '').replace(/\D/g, '');
    if (formData.phone && cleanPhone.length !== 10) {
      setErrors({ phone: ['Phone number must be exactly 10 digits.'] });
      setToastType('danger');
      setToastMessage("Validation error: Contact phone must be 10 digits.");
      return;
    }
    setSubmitting(true);

    const dataToSend = new FormData();
    dataToSend.append('blood_group', formData.blood_group);
    dataToSend.append('weight', formData.weight);
    dataToSend.append('age', formData.age);
    dataToSend.append('gender', formData.gender);
    dataToSend.append('address', formData.address);
    dataToSend.append('city', formData.city);
    if (formData.latitude) dataToSend.append('latitude', formData.latitude);
    if (formData.longitude) dataToSend.append('longitude', formData.longitude);
    if (formData.phone) dataToSend.append('phone', formData.phone);
    if (formData.medical_disease) dataToSend.append('medical_disease', formData.medical_disease);
    dataToSend.append('first_name', formData.first_name);
    dataToSend.append('last_name', formData.last_name);
    if (profilePic) dataToSend.append('profile_picture', profilePic);
    if (bloodReport) dataToSend.append('blood_report', bloodReport);

    try {
      if (hasProfile) {
        await api.put('donor/profile/', dataToSend, { headers: { 'Content-Type': 'multipart/form-data' } });
        setToastMessage("Donor profile updated successfully!");
      } else {
        await api.post('donor/profile/', dataToSend, { headers: { 'Content-Type': 'multipart/form-data' } });
        setToastMessage("Donor profile created successfully!");
        setHasProfile(true);
      }
      setToastType('success');
      const savedUser = JSON.parse(localStorage.getItem('authUser') || '{}');
      savedUser.first_name = formData.first_name;
      savedUser.last_name = formData.last_name;
      savedUser.phone = formData.phone;
      localStorage.setItem('authUser', JSON.stringify(savedUser));
      setTimeout(() => navigate('/donor-dashboard'), 1500);
    } catch (err) {
      if (err.response?.data) {
        setErrors(err.response.data);
        setToastType('danger');
        setToastMessage("Validation error: Review highlighted fields.");
      } else {
        setToastType('danger');
        setToastMessage("An error occurred while saving.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const streak = getStreakBadge(donationCount);

  // Download latest donation history as CSV
  const downloadHistoryCSV = () => {
    if (!donations.length) return;
    // Only take the latest donation (most recent)
    const latest = donations.slice(0, 1);
    // Merge matching review for that donation
    const getReview = (donation) => {
      const rev = reviews.find(
        r => r.hospital === donation.hospital ||
             (r.receiver_name && donation.patient_name && r.receiver_name.toLowerCase() === donation.patient_name.toLowerCase())
      );
      if (!rev) return { rating: '', comment: '' };
      return { rating: '★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating), comment: rev.comment || '' };
    };

    const headers = ['Date', 'Patient Name', 'Hospital', 'Units Donated', 'Review (Stars)', 'Feedback Comment'];
    const rows = latest.map(d => {
      const rev = getReview(d);
      return [
        `"${d.date || 'N/A'}"`,
        `"${d.patient_name || 'N/A'}"`,
        `"${d.hospital || 'N/A'}"`,
        `"${d.units || 0} unit(s)"`,
        `"${rev.rating || 'Not Rated'}"`,
        `"${rev.comment || 'No feedback given'}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `donation_history_${formData.first_name}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDonationStatus = async (requestId, newStatus) => {
    setStatusLoading(prev => ({ ...prev, [requestId]: true }));
    try {
      await api.patch(`requests/emergency/update-status/${requestId}/`, { status: newStatus });
      setDonations(prev => prev.map(donation => (
        donation.request_id === requestId ? { ...donation, status: newStatus } : donation
      )));
      setToastType('success');
      setToastMessage(newStatus === 'COMPLETE' ? 'Donation completed successfully.' : 'Donation status updated.');
    } catch (err) {
      setToastType('danger');
      setToastMessage(err.response?.data?.detail || 'Unable to update donation status.');
    } finally {
      setStatusLoading(prev => ({ ...prev, [requestId]: false }));
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
        <Loader fullPage={true} message="Loading donor profile..." />
      ) : (
        <div className="row g-4">
          <div className="col-lg-3">
            <Sidebar />
          </div>

          <div className="col-lg-9">
            {/* Profile Stats Header */}
            {hasProfile && (
              <div className="custom-card p-4 mb-4" style={{ background: 'linear-gradient(135deg, #0f1117, #1a1d27)' }}>
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <div className="d-flex align-items-center gap-4">
                    {/* Avatar */}
                    <div style={{
                      width: 72, height: 72, borderRadius: 20,
                      background: 'linear-gradient(135deg, #e53935, #b71c1c)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.8rem', fontWeight: 900, color: '#fff',
                      boxShadow: '0 8px 24px rgba(229,57,53,0.4)'
                    }}>
                      {formData.blood_group}
                    </div>
                    <div>
                      <h4 style={{ color: '#fff', fontWeight: 800, margin: 0 }}>
                        {formData.first_name} {formData.last_name}
                      </h4>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', margin: '4px 0 8px' }}>
                        {formData.city} · Donor
                      </p>
                      <span className={`streak-badge ${streak.cls}`}>{streak.label}</span>
                    </div>
                  </div>
                  {/* Stats */}
                  <div style={{ display: 'flex', gap: 28 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{donationCount}</div>
                      <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600, textTransform: 'uppercase', marginTop: 4 }}>Donations</div>
                    </div>
                    {averageRating > 0 && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>{averageRating.toFixed(1)}</span>
                          <span style={{ fontSize: '1.2rem', color: '#f59e0b' }}>★</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', fontWeight: 600, textTransform: 'uppercase', marginTop: 4 }}>
                          {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Full donation record belongs on the donor profile, not the dashboard. */}
            {hasProfile && (
              <div className="custom-card p-4 mb-4">
                <div className="d-flex align-items-center justify-content-between gap-3 border-bottom pb-3 mb-3 flex-wrap">
                  <div className="d-flex align-items-center gap-3">
                    <IoHeartOutline size={26} color="var(--primary-red)" />
                    <div>
                      <h5 className="fw-bold mb-0">Your Donations</h5>
                      <p className="text-muted small mb-0">Latest completed emergency donation (most recent)</p>
                    </div>
                  </div>
                  {donations.length > 0 && (
                    <button
                      onClick={downloadHistoryCSV}
                      className="btn btn-outline-danger btn-sm fw-bold d-flex align-items-center gap-2 px-3 py-2"
                      style={{ borderRadius: 8 }}
                      title="Download latest donation history as CSV"
                    >
                      <IoDownloadOutline size={16} />
                      Download CSV
                    </button>
                  )}
                </div>
                {donations.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Date</th>
                          <th>Patient</th>
                          <th>Hospital</th>
                          <th>Blood Group</th>
                          <th>Units</th>
                          <th className="text-center">Donation Status</th>
                          <th className="text-center">Review & Feedback</th>
                        </tr>
                      </thead>
                      <tbody>
                        {donations.slice(0, 1).map((donation) => {
                          const relatedReview = reviews.find(
                            r => r.hospital === donation.hospital ||
                                 (r.receiver_name && donation.patient_name &&
                                  r.receiver_name.toLowerCase() === donation.patient_name.toLowerCase())
                          );
                          return (
                          <tr key={donation.id}>
                            <td className="fw-semibold">{donation.date || '—'}</td>
                            <td>{donation.patient_name}</td>
                            <td className="text-muted">{donation.hospital}</td>
                            <td><span className="blood-group-badge">{donation.blood_group}</span></td>
                            <td>{donation.units} unit(s)</td>
                            <td style={{ minWidth: 230 }}>
                              <DonationStatusStepper
                                currentStatus={donation.status || 'SENT'}
                                onUpdateStatus={(newStatus) => handleDonationStatus(donation.request_id, newStatus)}
                                loading={statusLoading[donation.request_id] || false}
                              />
                            </td>
                            <td className="text-center" style={{ minWidth: 140 }}>
                              {relatedReview ? (
                                <div>
                                  <div style={{ color: '#f59e0b', fontWeight: 800, fontSize: '0.9rem' }}>
                                    {'★'.repeat(relatedReview.rating)}{'☆'.repeat(5 - relatedReview.rating)}
                                  </div>
                                  <div className="text-muted small mt-1" style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {relatedReview.comment || 'No comment'}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted small">Not rated yet</span>
                              )}
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted small mb-0">Your completed emergency donations will appear here.</p>
                )}
              </div>
            )}

            {hasProfile && (
              <div className="custom-card p-4 mb-4">
                <div className="d-flex align-items-center gap-3 border-bottom pb-3 mb-3">
                  <IoStarOutline size={26} color="#f59e0b" />
                  <div><h5 className="fw-bold mb-0">Your Reviews</h5><p className="text-muted small mb-0">Feedback received from blood receivers</p></div>
                </div>
                {reviews.length ? reviews.map((review) => (
                  <div key={review.id} className="border rounded-3 p-3 mb-3">
                    <div className="d-flex justify-content-between gap-2"><strong>{review.receiver_name}</strong><span style={{ color: '#f59e0b', fontWeight: 800 }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span></div>
                    <div className="text-muted small mb-2">{review.hospital} · {new Date(review.created_at).toLocaleDateString()}</div>
                    <p className="mb-0 small">{review.comment || 'No written comment provided.'}</p>
                  </div>
                )) : <p className="text-muted small mb-0">Your receiver reviews will appear here after completed donations are rated.</p>}
              </div>
            )}

            {/* Profile Form */}
            <div className="custom-card p-4">
              <div className="d-flex align-items-center gap-3 mb-4" style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 16 }}>
                <div style={{ color: 'var(--primary-red)' }}>
                  <IoPersonCircleOutline size={38} />
                </div>
                <div>
                  <h4 className="fw-bold mb-0">My Donor Profile</h4>
                  <p className="text-muted small mb-0">Update your biological details and availability</p>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Section 1 */}
                <div style={{ marginBottom: 28 }}>
                  <h6 style={{ fontWeight: 700, color: 'var(--primary-red)', borderBottom: '2px solid #fff0f0', paddingBottom: 8, marginBottom: 16, fontSize: '0.85rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    1. Personal Contact Details
                  </h6>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label">First Name</label>
                      <input type="text" name="first_name" className="form-control" value={formData.first_name} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Last Name</label>
                      <input type="text" name="last_name" className="form-control" value={formData.last_name} onChange={handleInputChange} required />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Contact Phone (10 Digits)</label>
                      <input 
                        type="tel" 
                        name="phone" 
                        className={`form-control ${errors.phone ? 'is-invalid' : ''}`} 
                        value={formData.phone} 
                        maxLength={10}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setFormData(prev => ({ ...prev, phone: val }));
                          if (errors.phone) setErrors(prev => ({ ...prev, phone: null }));
                        }} 
                        placeholder="10-digit Phone Number"
                        required 
                      />
                      {errors.phone && <div className="invalid-feedback">{typeof errors.phone === 'string' ? errors.phone : errors.phone[0]}</div>}
                    </div>
                  </div>
                </div>

                {/* Section 2 */}
                <div style={{ marginBottom: 28 }}>
                  <h6 style={{ fontWeight: 700, color: 'var(--primary-red)', borderBottom: '2px solid #fff0f0', paddingBottom: 8, marginBottom: 16, fontSize: '0.85rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    2. Biological & Medical Indicators
                  </h6>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label">Blood Group</label>
                      <select name="blood_group" className="form-select" value={formData.blood_group} onChange={handleInputChange}>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Weight (kg)</label>
                      <input type="number" name="weight" className={`form-control ${errors.weight ? 'is-invalid' : ''}`} value={formData.weight} onChange={handleInputChange} min={45} required />
                      {errors.weight && <div className="invalid-feedback">{errors.weight[0]}</div>}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Age</label>
                      <input type="number" name="age" className={`form-control ${errors.age ? 'is-invalid' : ''}`} value={formData.age} onChange={handleInputChange} min={18} max={65} required />
                      {errors.age && <div className="invalid-feedback">{errors.age[0]}</div>}
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Gender</label>
                      <select name="gender" className="form-select" value={formData.gender} onChange={handleInputChange}>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Last Donation Date</label>
                      <input type="date" name="last_donation_date" className="form-control" value={formData.last_donation_date || ''} onChange={handleInputChange} />
                      <div className="form-text text-muted" style={{ fontSize: '0.72rem' }}>Must wait 3 months (90 days) between blood donations.</div>
                    </div>
                    <div className="col-md-8">
                      <label className="form-label">Medical History / Diseases</label>
                      <input type="text" name="medical_disease" className="form-control" value={formData.medical_disease} onChange={handleInputChange} placeholder="e.g. Diabetes, Hypertension, None" />
                    </div>
                  </div>
                </div>

                {/* Section 3 */}
                <div style={{ marginBottom: 28 }}>
                  <h6 style={{ fontWeight: 700, color: 'var(--primary-red)', borderBottom: '2px solid #fff0f0', paddingBottom: 8, marginBottom: 16, fontSize: '0.85rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    3. Location & Coordinates
                  </h6>

                  <LocationDetector
                    city={formData.city}
                    address={formData.address}
                    latitude={formData.latitude}
                    longitude={formData.longitude}
                    onLocationDetected={(detectedData) => {
                      setFormData(prev => ({
                        ...prev,
                        ...(detectedData.city ? { city: detectedData.city } : {}),
                        ...(detectedData.address ? { address: detectedData.address } : {}),
                        ...(detectedData.latitude ? { latitude: detectedData.latitude } : {}),
                        ...(detectedData.longitude ? { longitude: detectedData.longitude } : {}),
                      }));
                    }}
                  />

                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label">City</label>
                      <input type="text" name="city" className="form-control" value={formData.city} onChange={handleInputChange} placeholder="e.g. Mumbai" required />
                    </div>
                    <div className="col-md-8">
                      <label className="form-label">Home Address</label>
                      <input type="text" name="address" className="form-control" value={formData.address} onChange={handleInputChange} placeholder="Street name, landmark..." required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Latitude</label>
                      <input type="number" step="any" name="latitude" className="form-control" value={formData.latitude} onChange={handleInputChange} placeholder="18.9750" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Longitude</label>
                      <input type="number" step="any" name="longitude" className="form-control" value={formData.longitude} onChange={handleInputChange} placeholder="72.8258" />
                    </div>
                  </div>
                </div>

                {/* Section 4 */}
                <div style={{ marginBottom: 36 }}>
                  <h6 style={{ fontWeight: 700, color: 'var(--primary-red)', borderBottom: '2px solid #fff0f0', paddingBottom: 8, marginBottom: 16, fontSize: '0.85rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    4. Profile Picture & Blood Report
                  </h6>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label d-flex align-items-center gap-1">
                        <IoImageOutline size={15} /> Profile Picture (JPG/PNG)
                      </label>
                      <input type="file" className="form-control" accept="image/*" onChange={(e) => setProfilePic(e.target.files[0])} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label d-flex align-items-center gap-1">
                        <IoDocumentAttachOutline size={15} /> Blood Pathology Report (PDF)
                      </label>
                      <input type="file" className="form-control" accept=".pdf" onChange={(e) => setBloodReport(e.target.files[0])} />
                    </div>
                  </div>
                </div>

                {/* Donation Count Display */}
                {hasProfile && (
                  <div style={{ background: 'linear-gradient(135deg, #fff0f0, #fce4ec)', borderRadius: 14, padding: '18px 22px', marginBottom: 28, border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary-red)', lineHeight: 1 }}>{donationCount}</div>
                      <div style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>
                        Total Donations
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>
                        {streak.label}
                      </div>
                      {/* Progress to next level */}
                      {donationCount < 10 && (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.75rem', color: '#6b7280' }}>
                            <span>{donationCount < 5 ? 'Progress to Silver (5)' : 'Progress to Gold (10)'}</span>
                            <span>{donationCount < 5 ? `${donationCount}/5` : `${donationCount}/10`}</span>
                          </div>
                          <div style={{ height: 8, background: '#fecaca', borderRadius: 100, overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${donationCount < 5 ? (donationCount / 5) * 100 : (donationCount / 10) * 100}%`,
                              background: 'linear-gradient(90deg, #e53935, #ff6b6b)',
                              borderRadius: 100,
                              transition: 'width 0.5s ease'
                            }} />
                          </div>
                        </div>
                      )}
                      {averageRating > 0 && (
                        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <StarDisplay rating={averageRating} />
                          <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 600 }}>
                            {averageRating.toFixed(1)} avg from {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-red px-5 py-3 d-flex align-items-center justify-content-center gap-2 m-auto"
                >
                  <IoSaveOutline size={18} />
                  {submitting ? 'Saving...' : 'Save Donor Profile'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorProfilePage;
