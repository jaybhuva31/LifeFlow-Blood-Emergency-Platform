import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IoMailOpenOutline } from 'react-icons/io5';
import Loader from '../components/Loader';
import Toast from '../components/Toast';

const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const response = await forgotPassword(email);
    setLoading(false);

    if (response.success) {
      setToastMessage("Password reset OTP sent! Redirecting...");
      setTimeout(() => {
        navigate(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 2000);
    } else {
      setError(response.error);
    }
  };

  return (
    <div className="auth-wrapper">
      {toastMessage && (
        <div className="toast-container-custom">
          <Toast 
            message={toastMessage} 
            type="success" 
            onClose={() => setToastMessage(null)} 
          />
        </div>
      )}

      {loading && <Loader fullPage={true} message="Sending request..." />}

      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo d-flex align-items-center justify-content-center">
            <IoMailOpenOutline className="text-danger" />
          </div>
          <h3 className="fw-bold">Forgot Password</h3>
          <p className="text-muted small">Enter your email address to receive a password reset OTP code</p>
        </div>

        {error && (
          <div className="alert alert-danger p-3 mb-4 rounded-3 small" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="mb-4">
            <label className="form-label small fw-semibold text-muted">Email Address</label>
            <input 
              type="email" 
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>

          <button type="submit" className="btn btn-red w-100 py-3 fw-medium">
            Send Reset OTP
          </button>
        </form>

        <div className="text-center mt-4">
          <Link to="/login" className="small text-danger fw-semibold text-decoration-none">&larr; Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
