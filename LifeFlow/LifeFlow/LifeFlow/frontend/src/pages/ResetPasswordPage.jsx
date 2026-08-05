import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IoKeyOutline } from 'react-icons/io5';
import Loader from '../components/Loader';
import Toast from '../components/Toast';

const ResetPasswordPage = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const emailParam = queryParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setErrorState(null);
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setErrors({ confirm_password: "Passwords do not match." });
      setLoading(false);
      return;
    }

    const response = await resetPassword(email, otpCode, newPassword, confirmPassword);
    setLoading(false);

    if (response.success) {
      setToastType('success');
      setToastMessage("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setErrorState(response.error);
      setToastType('danger');
      setToastMessage(response.error);
    }
  };

  const [errorState, setErrorState] = useState(null);

  return (
    <div className="auth-wrapper">
      {toastMessage && (
        <div className="toast-container-custom">
          <Toast 
            message={toastMessage} 
            type={toastType} 
            onClose={() => setToastMessage(null)} 
          />
        </div>
      )}

      {loading && <Loader fullPage={true} message="Resetting password..." />}

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo d-flex align-items-center justify-content-center">
            <IoKeyOutline className="text-danger" />
          </div>
          <h3 className="fw-bold">Reset Password</h3>
          <p className="text-muted small">Enter the reset OTP code and choose a new password</p>
        </div>

        {errorState && typeof errorState === 'string' && (
          <div className="alert alert-danger p-3 mb-4 rounded-3 small">
            {errorState}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="mb-3">
            <label className="form-label small fw-semibold text-muted">Email Address</label>
            <input 
              type="email" 
              className="form-control bg-light"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              readOnly={!!emailParam}
              required
            />
          </div>

          {/* OTP Code */}
          <div className="mb-3">
            <label className="form-label small fw-semibold text-muted">6-Digit OTP Code</label>
            <input 
              type="text" 
              className="form-control text-center fs-5 fw-semibold"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              required
            />
          </div>

          {/* New Password */}
          <div className="mb-3">
            <label className="form-label small fw-semibold text-muted">New Password</label>
            <input 
              type="password" 
              className="form-control"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
            />
          </div>

          {/* Confirm Password */}
          <div className="mb-4">
            <label className="form-label small fw-semibold text-muted">Confirm Password</label>
            <input 
              type="password" 
              className={`form-control ${errors.confirm_password ? 'is-invalid' : ''}`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
            {errors.confirm_password && <div className="invalid-feedback">{errors.confirm_password}</div>}
          </div>

          <button type="submit" className="btn btn-red w-100 py-3 fw-medium">
            Reset Password
          </button>
        </form>

        <div className="text-center mt-4">
          <Link to="/login" className="small text-danger fw-semibold text-decoration-none">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
