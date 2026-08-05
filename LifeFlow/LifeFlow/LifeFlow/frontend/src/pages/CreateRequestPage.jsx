import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { IoAddCircleOutline, IoSaveOutline } from 'react-icons/io5';

const CreateRequestPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    patient_name: '',
    blood_group: 'O+',
    units_required: 1,
    emergency_level: 'NORMAL',
    hospital_name: '',
    hospital_address: '',
    required_date: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await api.post('requests/create/', formData);
      setToastType('success');
      setToastMessage("Emergency blood request created! Matching donors notified.");
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
        setToastMessage("Failed to submit blood request.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'RECEIVER') {
    return (
      <div className="container py-5 text-center">
        <h4>Access Denied</h4>
        <p className="text-muted">Only receivers can create blood requests.</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {toastMessage && (
        <div className="toast-container-custom">
          <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
        </div>
      )}

      {loading && <Loader fullPage={true} message="Posting emergency request..." />}

      <div className="row g-4">
        {/* Sidebar */}
        <div className="col-lg-3">
          <Sidebar />
        </div>

        {/* Form panel */}
        <div className="col-lg-9">
          <div className="custom-card p-4">
            <div className="d-flex align-items-center gap-3 border-bottom pb-3 mb-4">
              <div className="text-danger">
                <IoAddCircleOutline size={40} />
              </div>
              <div>
                <h4 className="fw-bold mb-0">Submit Blood Request</h4>
                <p className="text-secondary small mb-0">Create a real-time emergency request for available donors</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-muted">Patient Full Name</label>
                  <input 
                    type="text" 
                    name="patient_name" 
                    className={`form-control ${errors.patient_name ? 'is-invalid' : ''}`}
                    value={formData.patient_name}
                    onChange={handleInputChange}
                    placeholder="Enter patient name"
                    required
                  />
                  {errors.patient_name && <div className="invalid-feedback">{errors.patient_name[0]}</div>}
                </div>

                <div className="col-md-3">
                  <label className="form-label small fw-semibold text-muted">Blood Group Needed</label>
                  <select 
                    name="blood_group" 
                    className="form-select"
                    value={formData.blood_group}
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

                <div className="col-md-3">
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
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label small fw-semibold text-muted">Hospital Name</label>
                  <input 
                    type="text" 
                    name="hospital_name" 
                    className={`form-control ${errors.hospital_name ? 'is-invalid' : ''}`}
                    value={formData.hospital_name}
                    onChange={handleInputChange}
                    placeholder="e.g. Apollo Hospital"
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
                    placeholder="e.g. Sector 12, Vashi, Mumbai"
                    required
                  />
                  {errors.hospital_address && <div className="invalid-feedback">{errors.hospital_address[0]}</div>}
                </div>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-6">
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

                <div className="col-md-6">
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
              </div>

              <div className="mb-4">
                <label className="form-label small fw-semibold text-muted">Remarks</label>
                <textarea 
                  name="remarks" 
                  className="form-control"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  placeholder="e.g. Operation scheduled, platelet request..."
                  rows={3}
                />
              </div>

              <button type="submit" className="btn btn-red px-5 py-3 d-flex align-items-center gap-2 m-auto">
                <IoSaveOutline size={18} />
                Submit Emergency Request
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRequestPage;
