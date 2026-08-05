import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { IoPersonCircle, IoLogOutOutline, IoPencilOutline, IoShieldCheckmarkOutline, IoStatsChartOutline, IoSpeedometerOutline, IoMailOutline, IoCallOutline } from 'react-icons/io5';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Toast from '../components/Toast';

const TempDashboard = ({ title = "Account Settings" }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(user?.username || '');
  const [savingUsername, setSavingUsername] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSaveUsername = async (e) => {
    e.preventDefault();
    setSavingUsername(true);
    try {
      const res = await api.patch('accounts/profile/', { username: usernameInput });
      const savedUser = JSON.parse(localStorage.getItem('authUser') || '{}');
      savedUser.username = res.data.username;
      localStorage.setItem('authUser', JSON.stringify(savedUser));
      user.username = res.data.username;
      setEditingUsername(false);
      setToastType('success');
      setToastMessage('Username updated successfully!');
    } catch (err) {
      setToastType('danger');
      setToastMessage(err.response?.data?.username?.[0] || err.response?.data?.detail || 'Failed to update username.');
    } finally {
      setSavingUsername(false);
    }
  };

  if (!user) {
    return (
      <div className="container py-5 text-center">
        <h4>Access Denied</h4>
        <p className="text-muted">Please log in to access this page.</p>
        <button className="btn btn-red mt-2" onClick={() => navigate('/login')}>Go to Login</button>
      </div>
    );
  }

  return (
    <div className="container py-5">
      {toastMessage && (
        <div className="toast-container-custom">
          <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
        </div>
      )}

      <div className="row g-4 justify-content-center">
        {/* User Profile Card */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm p-4 text-center" style={{ borderRadius: 20 }}>
            <div className="text-danger mb-3">
              <IoPersonCircle size={80} />
            </div>
            <h4 className="fw-bold mb-1">{user.first_name || user.username} {user.last_name || ''}</h4>
            <span className="badge bg-danger-subtle text-danger fw-bold px-3 py-2 rounded-pill text-uppercase mb-3" style={{ fontSize: '0.78rem' }}>
              🛡️ {user.role} ACCOUNT
            </span>
            <hr className="my-3" />
            
            <div className="text-start mb-4 small text-muted">
              <div className="mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <strong>Username:</strong>{' '}
                  <span className="fw-bold text-dark">@{user.username}</span>
                </div>
                {!editingUsername && (
                  <button
                    type="button"
                    onClick={() => { setUsernameInput(user.username); setEditingUsername(true); }}
                    className="btn btn-sm btn-outline-danger py-1 px-2 d-inline-flex align-items-center gap-1 fw-bold"
                    style={{ fontSize: '0.75rem', borderRadius: 6 }}
                  >
                    <IoPencilOutline size={13} /> Edit
                  </button>
                )}
              </div>

              {editingUsername && (
                <form onSubmit={handleSaveUsername} className="p-3 mb-3 bg-light rounded-3 border">
                  <label className="form-label fw-bold text-dark small mb-1">New Username</label>
                  <div className="d-flex gap-2">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      placeholder="Enter new username"
                      required
                    />
                    <button type="submit" disabled={savingUsername} className="btn btn-red btn-sm px-3 text-nowrap">
                      {savingUsername ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingUsername(false)}
                      className="btn btn-outline-secondary btn-sm px-2 text-nowrap"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <div className="mb-2 d-flex align-items-center gap-2">
                <IoMailOutline className="text-danger" size={16} />
                <span><strong>Email:</strong> {user.email}</span>
              </div>
              <div className="mb-2 d-flex align-items-center gap-2">
                <IoCallOutline className="text-danger" size={16} />
                <span><strong>Phone:</strong> {user.phone || 'Not Provided'}</span>
              </div>
              <div className="mb-2 d-flex align-items-center gap-2">
                <IoShieldCheckmarkOutline className="text-success" size={16} />
                <span><strong>Status:</strong> <span className="text-success fw-bold">Verified & Active</span></span>
              </div>
            </div>

            <button className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2 py-2 fw-semibold" style={{ borderRadius: 12 }} onClick={handleLogout}>
              <IoLogOutOutline size={18} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Content / Admin Actions Area */}
        <div className="col-lg-7">
          <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: 20 }}>
            <h4 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
              <IoShieldCheckmarkOutline className="text-danger" />
              {title}
            </h4>
            <p className="text-muted small mb-0">
              Welcome back to LifeFlow Admin Portal. Manage user accounts, inspect hospital and blood bank inventories, and generate analytical reports.
            </p>
          </div>

          {/* Quick Metrics & Links */}
          <div className="row g-3">
            <div className="col-sm-6">
              <Link to="/admin-dashboard" className="card border-0 shadow-sm p-3 d-flex flex-row align-items-center gap-3 text-decoration-none hover-shadow" style={{ borderRadius: 16 }}>
                <div className="bg-danger bg-opacity-10 text-danger rounded-circle p-3 d-flex align-items-center justify-content-center">
                  <IoSpeedometerOutline size={28} />
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-1">Admin Dashboard</h6>
                  <p className="text-muted mb-0 small">Users & Facilities</p>
                </div>
              </Link>
            </div>
            <div className="col-sm-6">
              <Link to="/reports" className="card border-0 shadow-sm p-3 d-flex flex-row align-items-center gap-3 text-decoration-none hover-shadow" style={{ borderRadius: 16 }}>
                <div className="bg-danger bg-opacity-10 text-danger rounded-circle p-3 d-flex align-items-center justify-content-center">
                  <IoStatsChartOutline size={28} />
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-1">Reports & Analytics</h6>
                  <p className="text-muted mb-0 small">View Insights</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TempDashboard;
