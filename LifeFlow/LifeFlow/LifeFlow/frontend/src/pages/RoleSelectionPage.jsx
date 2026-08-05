import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoHandLeftOutline, IoMedkitOutline } from 'react-icons/io5';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';

const dashboardForRole = (role) => {
  if (role === 'HOSPITAL' || role === 'BLOOD_BANK') return '/facility-dashboard';
  if (role === 'DONOR') return '/donor-dashboard';
  if (role === 'RECEIVER') return '/receiver-dashboard';
  return '/admin-dashboard';
};

const RoleSelectionPage = () => {
  const { user, selectRole, canUseRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      if (user.role === 'HOSPITAL' || user.role === 'BLOOD_BANK') {
        navigate('/facility-dashboard', { replace: true });
      } else if (user.role === 'ADMIN') {
        navigate('/admin-dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  const roles = [
    {
      key: 'RECEIVER',
      title: 'Receiver',
      text: 'Create blood requests, find nearby donors, and track emergency support.',
      icon: <IoMedkitOutline size={28} />,
    },
    {
      key: 'DONOR',
      title: 'Donor',
      text: 'View emergency requests, manage availability, and track donation activity.',
      icon: <IoHandLeftOutline size={28} />,
    },
  ].filter((role) => canUseRole(role.key));

  const handleSelect = async (role) => {
    setError(null);
    setLoading(true);
    const response = await selectRole(role);
    setLoading(false);

    if (response.success) {
      navigate(dashboardForRole(role));
      return;
    }

    setError(response.error);
  };

  return (
    <div className="auth-wrapper">
      {loading && <Loader fullPage={true} message="Switching role..." />}

      <div className="auth-card" style={{ maxWidth: '720px' }}>
        <div className="auth-header text-center mb-4">
          <h3 className="fw-bold">Choose Your Role</h3>
          <p className="text-muted small mb-0">
            Continue as {user?.first_name || user?.username}
          </p>
        </div>

        {error && (
          <div className="alert alert-danger p-3 rounded-3 small" role="alert">
            {error}
          </div>
        )}

        <div className="row g-3">
          {roles.map((role) => (
            <div className="col-md-6" key={role.key}>
              <button
                type="button"
                className={`btn w-100 h-100 text-start p-4 border rounded-3 ${user?.role === role.key ? 'btn-red-outline' : 'btn-light'}`}
                onClick={() => handleSelect(role.key)}
              >
                <span className="d-flex align-items-center gap-2 fw-bold mb-2">
                  {role.icon}
                  {role.title}
                </span>
                <span className="text-muted small d-block">{role.text}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionPage;
