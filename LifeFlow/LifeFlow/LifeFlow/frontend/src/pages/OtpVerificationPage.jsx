import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IoShieldCheckmarkOutline } from 'react-icons/io5';
import Loader from '../components/Loader';
import Toast from '../components/Toast';

const OtpVerificationPage = () => {
  const { verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve email from URL search query
  const queryParams = new URLSearchParams(location.search);
  const emailParam = queryParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  // Resend Timer Countdown (60 seconds)
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const response = await verifyOtp(email, otpCode);
    setLoading(false);

    if (response.success) {
      setToastType('success');
      setToastMessage("Account verified successfully! Redirecting to login...");
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(response.error);
      setToastType('danger');
      setToastMessage(response.error);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setError(null);
    setLoading(true);

    const response = await resendOtp(email);
    setLoading(false);

    if (response.success) {
      setToastType('success');
      setToastMessage("A new OTP code has been sent!");
      setResendTimer(60);
      setCanResend(false);
    } else {
      setToastType('danger');
      setToastMessage(response.error);
    }
  };

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

      {loading && <Loader fullPage={true} message="Verifying..." />}

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo d-flex align-items-center justify-content-center">
            <IoShieldCheckmarkOutline className="animate-pulse text-danger" />
          </div>
          <h3 className="fw-bold">Verify Account</h3>
          <p className="text-muted small">We've sent a 6-digit OTP code to your email</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email (readonly if provided, editable otherwise) */}
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
          <div className="mb-4">
            <label className="form-label small fw-semibold text-muted">6-Digit OTP Code</label>
            <input 
              type="text" 
              className={`form-control text-center fs-4 fw-bold letter-spacing-md ${error ? 'is-invalid' : ''}`}
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))} // only numbers
              placeholder="0 0 0 0 0 0"
              required
            />
            {error && <div className="invalid-feedback text-center">{error}</div>}
          </div>

          <button type="submit" className="btn btn-red w-100 py-3 fw-medium">
            Verify & Activate
          </button>
        </form>

        <div className="text-center mt-4">
          <span className="text-muted small">Didn't receive code? </span>
          <button 
            type="button" 
            className="btn btn-link p-0 border-0 fs-7 fw-semibold text-danger text-decoration-none" 
            onClick={handleResend}
            disabled={!canResend}
          >
            {canResend ? "Resend OTP" : `Resend in ${resendTimer}s`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtpVerificationPage;
