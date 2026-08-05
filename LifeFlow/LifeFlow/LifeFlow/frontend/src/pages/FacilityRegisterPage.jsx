import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LocationDetector from '../components/LocationDetector';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import api from '../services/api';
import { 
  IoBusinessOutline, 
  IoMailOutline, 
  IoLockClosedOutline, 
  IoCallOutline, 
  IoLocationOutline, 
  IoTimeOutline,
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline
} from 'react-icons/io5';

const FacilityRegisterPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirm_password: '',
    name: '',
    facility_type: 'HOSPITAL',
    license_number: '',
    city: '',
    address: '',
    helpline_phone: '',
    operating_hours: '24/7 Emergency Trauma Open',
    stock_o_positive: 0,
    stock_o_negative: 0,
    stock_a_positive: 0,
    stock_a_negative: 0,
    stock_b_positive: 0,
    stock_b_negative: 0,
    stock_ab_positive: 0,
    stock_ab_negative: 0,
    latitude: '',
    longitude: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const cleanHelpline = (formData.helpline_phone || '').replace(/\D/g, '');
    if (cleanHelpline.length !== 10) {
      setErrors({ helpline_phone: ['Helpline phone number must be exactly 10 digits.'] });
      setToastType('danger');
      setToastMessage("Validation error: Helpline phone number must be 10 digits.");
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setErrors({ confirm_password: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    try {
      await api.post('receiver/hospitals-blood-banks/register/', formData);
      setSubmitted(true);
    } catch (err) {
      if (err.response?.data) {
        setErrors(err.response.data);
        setToastType('danger');
        setToastMessage("Please check and fill all required fields correctly.");
      } else {
        setToastType('danger');
        setToastMessage("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      {toastMessage && (
        <div className="toast-container-custom">
          <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
        </div>
      )}

      {submitted ? (
        <div className="card border-0 shadow-lg p-5 mx-auto text-center" style={{ maxWidth: 640, borderRadius: 24 }}>
          <div 
            className="mx-auto mb-4 d-flex align-items-center justify-content-center"
            style={{ width: 80, height: 80, borderRadius: '50%', background: '#dcfce7', color: '#15803d' }}
          >
            <IoCheckmarkCircleOutline size={54} />
          </div>
          <h3 className="fw-bold text-dark mb-2">Registration Submitted!</h3>
          <p className="lead text-muted mb-4" style={{ fontSize: '1rem' }}>
            Your <strong>{formData.name}</strong> registration has been submitted successfully and is currently <strong>Pending Admin Review & Approval</strong>.
          </p>

          <div className="p-4 rounded-3 text-start mb-4" style={{ background: '#fffbeb', border: '1px solid #fef3c7' }}>
            <h6 className="fw-bold text-warning-emphasis mb-2 d-flex align-items-center gap-2">
              <IoAlertCircleOutline size={20} /> What Happens Next?
            </h6>
            <ul className="mb-0 small text-secondary ps-3" style={{ lineHeight: 1.7 }}>
              <li>The Admin will inspect your license number (<strong>{formData.license_number}</strong>) and facility details.</li>
              <li>Once verified, your account will be activated.</li>
              <li>You can then log in using your official email <strong>{formData.email}</strong>.</li>
            </ul>
          </div>

          <div className="d-flex justify-content-center gap-3">
            <Link to="/login" className="btn btn-red fw-bold px-4 py-2" style={{ borderRadius: 10 }}>
              Go to Login Screen
            </Link>
            <Link to="/hospitals-blood-banks" className="btn btn-light fw-semibold px-4 py-2" style={{ borderRadius: 10 }}>
              View Public Facilities
            </Link>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-lg overflow-hidden mx-auto" style={{ maxWidth: 840, borderRadius: 24 }}>
          <div className="bg-danger text-white p-4 p-md-5 text-center position-relative" style={{ background: 'linear-gradient(135deg, #b91c1c, #e11d48)' }}>
            <span className="badge bg-white text-danger fw-bold px-3 py-2 rounded-pill mb-3" style={{ fontSize: '0.78rem', textTransform: 'uppercase' }}>
              🏥 Healthcare Facility Portal
            </span>
            <h2 className="display-6 fw-bold mb-2">Register Hospital or Blood Bank</h2>
            <p className="mb-0 text-white-50 small">
              All details are compulsory. Registration requests are verified and activated by the Admin.
            </p>
          </div>

          <div className="p-4 p-md-5">
            <form onSubmit={handleSubmit}>
              {/* Section 1: Account Credentials */}
              <div className="mb-4">
                <h6 className="fw-bold text-danger pb-2 border-bottom mb-3" style={{ letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                  1. Account Login Credentials (Compulsory)
                </h6>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label fw-semibold small">Official Email Address *</label>
                    <div className="input-group">
                      <span className="input-group-text bg-white"><IoMailOutline /></span>
                      <input
                        type="email"
                        name="email"
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        placeholder="contact@hospital.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    {errors.email && <div className="text-danger small mt-1">{errors.email}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Password *</label>
                    <div className="input-group">
                      <span className="input-group-text bg-white"><IoLockClosedOutline /></span>
                      <input
                        type="password"
                        name="password"
                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                        placeholder="At least 6 characters"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Confirm Password *</label>
                    <div className="input-group">
                      <span className="input-group-text bg-white"><IoLockClosedOutline /></span>
                      <input
                        type="password"
                        name="confirm_password"
                        className={`form-control ${errors.confirm_password ? 'is-invalid' : ''}`}
                        placeholder="Repeat password"
                        value={formData.confirm_password}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    {errors.confirm_password && <div className="text-danger small mt-1">{errors.confirm_password}</div>}
                  </div>
                </div>
              </div>

              {/* Section 2: Facility Details */}
              <div className="mb-4">
                <h6 className="fw-bold text-danger pb-2 border-bottom mb-3" style={{ letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                  2. Facility Profile & License Details (Compulsory)
                </h6>
                <div className="row g-3">
                  <div className="col-md-8">
                    <label className="form-label fw-semibold small">Facility Name *</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      placeholder="e.g. Apollo Multi-Specialty Hospital"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold small">Facility Type *</label>
                    <select
                      name="facility_type"
                      className="form-select"
                      value={formData.facility_type}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="HOSPITAL">🏥 Hospital / Clinic</option>
                      <option value="BLOOD_BANK">🩸 Regional Blood Bank</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Government License Number *</label>
                    <input
                      type="text"
                      name="license_number"
                      className="form-control"
                      placeholder="e.g. HOSP-MUM-94812"
                      value={formData.license_number}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Emergency Helpline Phone (10 Digits) *</label>
                    <div className="input-group">
                      <span className="input-group-text bg-white"><IoCallOutline /></span>
                      <input
                        type="tel"
                        name="helpline_phone"
                        className={`form-control ${errors.helpline_phone ? 'is-invalid' : ''}`}
                        placeholder="10-digit Phone Number"
                        value={formData.helpline_phone}
                        maxLength={10}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setFormData(prev => ({ ...prev, helpline_phone: val }));
                          if (errors.helpline_phone) setErrors(prev => ({ ...prev, helpline_phone: null }));
                        }}
                        required
                      />
                    </div>
                    {errors.helpline_phone && <div className="text-danger small mt-1">{typeof errors.helpline_phone === 'string' ? errors.helpline_phone : errors.helpline_phone[0]}</div>}
                  </div>

                  {/* Location Detector Component */}
                  <div className="col-12 my-2">
                    <LocationDetector
                      city={formData.city}
                      address={formData.address}
                      latitude={formData.latitude}
                      longitude={formData.longitude}
                      onLocationDetected={(locData) => {
                        setFormData(prev => ({
                          ...prev,
                          ...(locData.city ? { city: locData.city } : {}),
                          ...(locData.address ? { address: locData.address } : {}),
                          ...(locData.latitude ? { latitude: locData.latitude } : {}),
                          ...(locData.longitude ? { longitude: locData.longitude } : {}),
                        }));
                      }}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold small">City *</label>
                    <input
                      type="text"
                      name="city"
                      className="form-control"
                      placeholder="e.g. Mumbai"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-8">
                    <label className="form-label fw-semibold small">Operating Hours *</label>
                    <input
                      type="text"
                      name="operating_hours"
                      className="form-control"
                      placeholder="e.g. 24/7 Emergency Trauma Open"
                      value={formData.operating_hours}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold small">Full Address *</label>
                    <textarea
                      name="address"
                      rows="2"
                      className="form-control"
                      placeholder="Enter street, landmark, area, pincode..."
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Section 3: Initial Stock Inventory */}
              <div className="mb-4">
                <h6 className="fw-bold text-danger pb-2 border-bottom mb-3" style={{ letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.85rem' }}>
                  3. Initial Blood Stock Inventory (Compulsory)
                </h6>
                <div className="row g-2">
                  {[
                    { label: 'O+ Units', field: 'stock_o_positive' },
                    { label: 'O- Units', field: 'stock_o_negative' },
                    { label: 'A+ Units', field: 'stock_a_positive' },
                    { label: 'A- Units', field: 'stock_a_negative' },
                    { label: 'B+ Units', field: 'stock_b_positive' },
                    { label: 'B- Units', field: 'stock_b_negative' },
                    { label: 'AB+ Units', field: 'stock_ab_positive' },
                    { label: 'AB- Units', field: 'stock_ab_negative' },
                  ].map(st => (
                    <div key={st.field} className="col-3 col-sm-3">
                      <div className="p-2 border rounded-3 bg-light text-center">
                        <label className="form-label mb-1 fw-bold small text-danger">{st.label}</label>
                        <input
                          type="number"
                          min="0"
                          className="form-control form-control-sm text-center fw-bold"
                          value={formData[st.field]}
                          onChange={e => setFormData({ ...formData, [st.field]: parseInt(e.target.value) || 0 })}
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="d-grid mt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-red py-3 fw-bold fs-6"
                  style={{ borderRadius: 14 }}
                >
                  {loading ? 'Submitting Registration...' : 'Submit Registration for Admin Approval →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacilityRegisterPage;
