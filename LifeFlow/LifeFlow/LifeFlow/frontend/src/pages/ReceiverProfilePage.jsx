import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { IoSaveOutline, IoPersonCircleOutline, IoPulseOutline } from 'react-icons/io5';

const ReceiverProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Profile Form States
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    hospital_name: '',
    hospital_address: '',
    patient_name: '',
    blood_group_needed: 'O+',
    units_required: 1,
    emergency_level: 'NORMAL',
    required_date: '',
    required_time: '',
    remarks: '',
  });

  // Profile metadata
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Feedback states
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  // Load existing profile details
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('receiver/profile/');
        const data = response.data;
        setFormData({
          first_name: data.user?.first_name || '',
          last_name: data.user?.last_name || '',
          phone: data.user?.phone || '',
          hospital_name: data.hospital_name,
          hospital_address: data.hospital_address,
          patient_name: data.patient_name,
          blood_group_needed: data.blood_group_needed,
          units_required: data.units_required,
          emergency_level: data.emergency_level,
          required_date: data.required_date,
          required_time: data.required_time.substring(0, 5), // trim seconds (HH:MM:SS -> HH:MM)
          remarks: data.remarks || '',
        });
        setHasProfile(true);
      } catch (err) {
        if (err.response && err.response.status === 404) {
          setHasProfile(false);
          // Set date to today by default
          const today = new Date().toISOString().split('T')[0];
          setFormData(prev => ({ ...prev, required_date: today, required_time: '12:00' }));
        } else {
          setToastType('danger');
          setToastMessage("Failed to fetch receiver profile details.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  // Handle Input Changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
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

    try {
      if (hasProfile) {
        // Update Profile
        await api.put('receiver/profile/', formData);
        setToastMessage("Receiver request profile updated successfully!");
      } else {
        // Create Profile
        await api.post('receiver/profile/', formData);
        setToastMessage("Receiver request profile created successfully!");
        setHasProfile(true);
      }
      setToastType('success');

      // Update local storage authUser first_name/last_name/phone so it stays in sync
      const savedUser = JSON.parse(localStorage.getItem('authUser') || '{}');
      savedUser.first_name = formData.first_name;
      savedUser.last_name = formData.last_name;
      savedUser.phone = formData.phone;
      localStorage.setItem('authUser', JSON.stringify(savedUser));

      setTimeout(() => {
        navigate('/receiver-dashboard');
      }, 1500);
    } catch (err) {
      if (err.response && err.response.data) {
        setErrors(err.response.data);
        setToastType('danger');
        setToastMessage("Validation error: Please review highlighted fields.");
      } else {
        setToastType('danger');
        setToastMessage("An error occurred while saving the profile.");
      }
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
        <Loader fullPage={true} message="Loading receiver profile details..." />
      ) : (
        <div className="row g-4">
          {/* Sidebar Navigation */}
          <div className="col-lg-3">
            <Sidebar />
          </div>

          {/* Profile Form Content */}
          <div className="col-lg-9">
            <div className="custom-card p-4">
              <div className="d-flex align-items-center gap-3 border-bottom pb-3 mb-4">
                <div className="text-danger">
                  <IoPulseOutline size={40} />
                </div>
                <div>
                  <h4 className="fw-bold mb-0">My Request Profile</h4>
                  <p className="text-secondary small mb-0">Set hospital parameters and emergency patient requirements</p>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Section 1: User Account Details */}
                <h6 className="fw-bold text-danger border-bottom pb-1 mb-3">1. Personal Contact Details</h6>
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-muted">First Name</label>
                    <input 
                      type="text" 
                      name="first_name" 
                      className="form-control"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-muted">Last Name</label>
                    <input 
                      type="text" 
                      name="last_name" 
                      className="form-control"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-muted">Contact Phone (10 Digits)</label>
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

                {/* Section 2: Hospital Info */}
                <h6 className="fw-bold text-danger border-bottom pb-1 mb-3">2. Hospital / Medical Institution Details</h6>
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-muted">Hospital / Clinic Name</label>
                    <input 
                      type="text" 
                      name="hospital_name" 
                      className={`form-control ${errors.hospital_name ? 'is-invalid' : ''}`}
                      value={formData.hospital_name}
                      onChange={handleInputChange}
                      placeholder="e.g. City General Hospital"
                      required
                    />
                    {errors.hospital_name && <div className="invalid-feedback">{errors.hospital_name[0]}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold text-muted">Hospital Address</label>
                    <input 
                      type="text" 
                      name="hospital_address" 
                      className={`form-control ${errors.hospital_address ? 'is-invalid' : ''}`}
                      value={formData.hospital_address}
                      onChange={handleInputChange}
                      placeholder="Street name, City, Landmark"
                      required
                    />
                    {errors.hospital_address && <div className="invalid-feedback">{errors.hospital_address[0]}</div>}
                  </div>
                </div>

                {/* Section 3: Patient Criteria */}
                <h6 className="fw-bold text-danger border-bottom pb-1 mb-3">3. Patient Info & Emergency Requirements</h6>
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-muted">Patient Full Name</label>
                    <input 
                      type="text" 
                      name="patient_name" 
                      className={`form-control ${errors.patient_name ? 'is-invalid' : ''}`}
                      value={formData.patient_name}
                      onChange={handleInputChange}
                      placeholder="Enter patient's name"
                      required
                    />
                    {errors.patient_name && <div className="invalid-feedback">{errors.patient_name[0]}</div>}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-muted">Blood Group Needed</label>
                    <select 
                      name="blood_group_needed" 
                      className="form-select"
                      value={formData.blood_group_needed}
                      onChange={handleInputChange}
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-muted">Units Required</label>
                    <input 
                      type="number" 
                      name="units_required" 
                      className={`form-control ${errors.units_required ? 'is-invalid' : ''}`}
                      value={formData.units_required}
                      onChange={handleInputChange}
                      min={1}
                      max={20}
                      required
                    />
                    {errors.units_required && <div className="invalid-feedback">{errors.units_required[0]}</div>}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-muted">Urgency Severity Level</label>
                    <select 
                      name="emergency_level" 
                      className="form-select"
                      value={formData.emergency_level}
                      onChange={handleInputChange}
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High Urgency</option>
                      <option value="CRITICAL">Critical (Immediate)</option>
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-muted">Required Date</label>
                    <input 
                      type="date" 
                      name="required_date" 
                      className={`form-control ${errors.required_date ? 'is-invalid' : ''}`}
                      value={formData.required_date}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.required_date && <div className="invalid-feedback">{errors.required_date[0]}</div>}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label small fw-semibold text-muted">Required Time</label>
                    <input 
                      type="time" 
                      name="required_time" 
                      className={`form-control ${errors.required_time ? 'is-invalid' : ''}`}
                      value={formData.required_time}
                      onChange={handleInputChange}
                      required
                    />
                    {errors.required_time && <div className="invalid-feedback">{errors.required_time[0]}</div>}
                  </div>
                  <div className="col-md-12">
                    <label className="form-label small fw-semibold text-muted">Remarks / Medical History Notes</label>
                    <textarea 
                      name="remarks" 
                      className="form-control"
                      value={formData.remarks}
                      onChange={handleInputChange}
                      placeholder="Specify critical details (e.g. Operation planned, platelets request, etc.)"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="btn btn-red px-5 py-3 d-flex align-items-center justify-content-center gap-2 m-auto"
                >
                  <IoSaveOutline size={18} />
                  {submitting ? "Saving details..." : "Save Request Details"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiverProfilePage;
