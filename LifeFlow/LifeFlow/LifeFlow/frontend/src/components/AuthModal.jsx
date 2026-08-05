import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  IoWater, IoLogInOutline, IoPersonAddOutline, IoCloseOutline,
  IoEyeOutline, IoEyeOffOutline, IoLockClosedOutline, IoMailOutline,
  IoCallOutline, IoPersonOutline
} from 'react-icons/io5';
import Loader from './Loader';
import Toast from './Toast';

const AuthModal = ({ defaultTab = 'login', onClose }) => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Login form
  const [loginData, setLoginData] = useState({ email: '', password: '' });

  // Register form
  const [signupData, setSignupData] = useState({
    email: '', first_name: '', last_name: '', phone: '',
    roles: ['DONOR', 'RECEIVER'], password: '', confirm_password: ''
  });
  const [signupErrors, setSignupErrors] = useState({});

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const response = await login(loginData.email, loginData.password);
    setLoading(false);
    if (response.success) {
      setToastType('success');
      setToastMessage('Login successful! Redirecting...');
      setTimeout(() => {
        if (onClose) onClose(true);
        const userObj = response.user;
        if (userObj.role === 'ADMIN') {
          navigate('/admin-dashboard', { replace: true });
        } else if (userObj.role === 'HOSPITAL' || userObj.role === 'BLOOD_BANK') {
          navigate('/facility-dashboard', { replace: true });
        } else if (userObj.role === 'DONOR') {
          navigate('/donor-dashboard', { replace: true });
        } else if (userObj.role === 'RECEIVER') {
          navigate('/receiver-dashboard', { replace: true });
        } else {
          navigate('/select-role', { replace: true });
        }
      }, 600);
    } else {
      setError(response.error);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupErrors({});
    const cleanPhone = (signupData.phone || '').replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setSignupErrors({ phone: ['Phone number must be exactly 10 digits.'] });
      return;
    }
    if (signupData.password !== signupData.confirm_password) {
      setSignupErrors({ confirm_password: 'Passwords do not match.' });
      return;
    }
    setLoading(true);
    const response = await register(signupData);
    setLoading(false);
    if (response.success) {
      setToastType('success');
      setToastMessage('Account created! Redirecting to OTP verification...');
      setTimeout(() => {
        if (onClose) onClose(true);
        navigate(`/verify-otp?email=${encodeURIComponent(signupData.email)}`);
      }, 1500);
    } else {
      if (typeof response.error === 'object') setSignupErrors(response.error);
      else { setToastType('danger'); setToastMessage(response.error || 'Registration failed.'); }
    }
  };

  return (
    <>
      {toastMessage && (
        <div className="toast-container-custom">
          <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
        </div>
      )}
      {loading && <Loader fullPage={true} message={activeTab === 'login' ? 'Authenticating...' : 'Creating account...'} />}

      {/* Overlay */}
      <div className="auth-fullscreen" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="auth-fullscreen-card">
          {/* Header */}
          <div className="auth-fullscreen-header">
            <button className="auth-close-btn" onClick={onClose} aria-label="Close">
              <IoCloseOutline size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <div style={{
                background: 'linear-gradient(135deg, #e53935, #b71c1c)',
                width: 44, height: 44, borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(229,57,53,0.4)'
              }}>
                <IoWater size={24} color="#fff" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 800, fontSize: '1.4rem', color: '#fff', lineHeight: 1.1 }}>
                  Life<span style={{ color: '#ff6b6b' }}>Flow</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em' }}>
                  BLOOD DONATION NETWORK
                </div>
              </div>
            </div>
            {/* Tab Switcher */}
            <div className="auth-tab-switcher">
              <button
                className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => { setActiveTab('login'); setError(null); }}
              >
                <IoLogInOutline size={14} style={{ marginRight: 5 }} />
                Sign In
              </button>
              <button
                className={`auth-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => { setActiveTab('register'); setError(null); }}
              >
                <IoPersonAddOutline size={14} style={{ marginRight: 5 }} />
                Register
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="auth-fullscreen-body">
            {activeTab === 'login' ? (
              /* === LOGIN FORM === */
              <form onSubmit={handleLogin}>
                {error && (
                  <div className="alert alert-danger p-3 mb-4 rounded-3 small" role="alert">
                    <strong>⚠️ </strong>{error}
                    {error.includes('verify your OTP') && (
                      <Link to={`/verify-otp?email=${encodeURIComponent(loginData.email)}`}
                        className="alert-link ms-1" onClick={onClose}>
                        Verify now →
                      </Link>
                    )}
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">Email, Username or Mobile Number</label>
                  <div style={{ position: 'relative' }}>
                    <IoMailOutline size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input
                      type="text"
                      className="form-control"
                      style={{ paddingLeft: 40 }}
                      value={loginData.email}
                      onChange={e => setLoginData(p => ({ ...p, email: e.target.value }))}
                      placeholder="Email, Username or Mobile Number"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label className="form-label mb-0">Password</label>
                    <Link to="/forgot-password" className="small" style={{ color: 'var(--primary-red)', textDecoration: 'none', fontWeight: 600 }} onClick={onClose}>
                      Forgot Password?
                    </Link>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <IoLockClosedOutline size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input
                      type={showPass ? 'text' : 'password'}
                      className="form-control"
                      style={{ paddingLeft: 40, paddingRight: 44 }}
                      value={loginData.password}
                      onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))}
                      placeholder="••••••••"
                      required
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                      {showPass ? <IoEyeOffOutline size={18} /> : <IoEyeOutline size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn btn-red w-100 py-3 d-flex align-items-center justify-content-center gap-2">
                  <IoLogInOutline size={20} />
                  Sign In to LifeFlow
                </button>

                <div className="divider-text my-4">or continue with</div>

                <p className="text-center small mb-0" style={{ color: '#6b7280' }}>
                  Don't have an account?{' '}
                  <button type="button" onClick={() => setActiveTab('register')}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-red)', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                    Create one free →
                  </button>
                </p>
              </form>
            ) : (
              /* === REGISTER FORM === */
              <form onSubmit={handleSignup}>
                <div className="row g-2 mb-3">
                  <div className="col-6">
                    <label className="form-label">First Name</label>
                    <div style={{ position: 'relative' }}>
                      <IoPersonOutline size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        type="text"
                        className={`form-control ${signupErrors.first_name ? 'is-invalid' : ''}`}
                        style={{ paddingLeft: 36 }}
                        value={signupData.first_name}
                        onChange={e => setSignupData(p => ({ ...p, first_name: e.target.value }))}
                        placeholder="First Name"
                        required
                      />
                      {signupErrors.first_name && <div className="invalid-feedback">{signupErrors.first_name[0]}</div>}
                    </div>
                  </div>
                  <div className="col-6">
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      className={`form-control ${signupErrors.last_name ? 'is-invalid' : ''}`}
                      value={signupData.last_name}
                      onChange={e => setSignupData(p => ({ ...p, last_name: e.target.value }))}
                      placeholder="Last Name"
                      required
                    />
                    {signupErrors.last_name && <div className="invalid-feedback">{signupErrors.last_name[0]}</div>}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <IoMailOutline size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input
                      type="email"
                      className={`form-control ${signupErrors.email ? 'is-invalid' : ''}`}
                      style={{ paddingLeft: 36 }}
                      value={signupData.email}
                      onChange={e => setSignupData(p => ({ ...p, email: e.target.value }))}
                      placeholder="Email Address"
                      required
                    />
                    {signupErrors.email && <div className="invalid-feedback">{signupErrors.email[0]}</div>}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Phone Number (10 Digits)</label>
                  <div style={{ position: 'relative' }}>
                    <IoCallOutline size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input
                      type="tel"
                      className={`form-control ${signupErrors.phone ? 'is-invalid' : ''}`}
                      style={{ paddingLeft: 36 }}
                      value={signupData.phone}
                      maxLength={10}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setSignupData(p => ({ ...p, phone: val }));
                      }}
                      placeholder="10-digit Phone Number"
                      required
                    />
                    {signupErrors.phone && <div className="invalid-feedback">{typeof signupErrors.phone === 'string' ? signupErrors.phone : signupErrors.phone[0]}</div>}
                  </div>
                </div>

                <div className="row g-2 mb-4">
                  <div className="col-6">
                    <label className="form-label">Password</label>
                    <div style={{ position: 'relative' }}>
                      <IoLockClosedOutline size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        type={showPass ? 'text' : 'password'}
                        className={`form-control ${signupErrors.password ? 'is-invalid' : ''}`}
                        style={{ paddingLeft: 36, paddingRight: 36 }}
                        value={signupData.password}
                        onChange={e => setSignupData(p => ({ ...p, password: e.target.value }))}
                        placeholder="••••••••"
                        required
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                        {showPass ? <IoEyeOffOutline size={16} /> : <IoEyeOutline size={16} />}
                      </button>
                      {signupErrors.password && <div className="invalid-feedback">{signupErrors.password[0]}</div>}
                    </div>
                  </div>
                  <div className="col-6">
                    <label className="form-label">Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                      <IoLockClosedOutline size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                      <input
                        type={showConfirmPass ? 'text' : 'password'}
                        className={`form-control ${signupErrors.confirm_password ? 'is-invalid' : ''}`}
                        style={{ paddingLeft: 36, paddingRight: 36 }}
                        value={signupData.confirm_password}
                        onChange={e => setSignupData(p => ({ ...p, confirm_password: e.target.value }))}
                        placeholder="••••••••"
                        required
                      />
                      <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
                        {showConfirmPass ? <IoEyeOffOutline size={16} /> : <IoEyeOutline size={16} />}
                      </button>
                      {signupErrors.confirm_password && <div className="invalid-feedback">{typeof signupErrors.confirm_password === 'string' ? signupErrors.confirm_password : signupErrors.confirm_password[0]}</div>}
                    </div>
                  </div>
                </div>

                {/* Info badge */}
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: '0.8rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1rem' }}>ℹ️</span>
                  You can act as both Donor and Receiver — select your role after login.
                </div>

                <button type="submit" className="btn btn-red w-100 py-3 d-flex align-items-center justify-content-center gap-2">
                  <IoPersonAddOutline size={20} />
                  Create LifeFlow Account
                </button>

                <p className="text-center small mt-3 mb-0" style={{ color: '#6b7280' }}>
                  Already registered?{' '}
                  <button type="button" onClick={() => setActiveTab('login')}
                    style={{ background: 'none', border: 'none', color: 'var(--primary-red)', fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                    Sign in →
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthModal;
