import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  IoWater, 
  IoLogOutOutline, 
  IoPersonCircleOutline, 
  IoSpeedometerOutline, 
  IoCalendarOutline,
  IoNotificationsOutline,
  IoStatsChartOutline,
  IoTimeOutline,
  IoAddCircleOutline,
  IoMenuOutline,
  IoHeartOutline,
  IoBusinessOutline
} from 'react-icons/io5';
import AuthModal from './AuthModal';
import api from '../services/api';

const Navbar = () => {
  const { user, logout, hasMultipleRoles } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadAlerts(0);
      return;
    }

    const loadUnreadAlerts = async () => {
      try {
        const response = await api.get('notification/list/');
        setUnreadAlerts(response.data.filter((notification) => !notification.is_read).length);
      } catch {
        setUnreadAlerts(0);
      }
    };

    loadUnreadAlerts();
  }, [user, location.pathname]);

  useEffect(() => {
    const clearAlertBadge = () => setUnreadAlerts(0);
    window.addEventListener('lifeflow:alerts-read', clearAlertBadge);
    return () => window.removeEventListener('lifeflow:alerts-read', clearAlertBadge);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const openLogin = () => { setAuthTab('login'); setShowAuth(true); };
  const openRegister = () => { setAuthTab('register'); setShowAuth(true); };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'ADMIN': return '/admin-dashboard';
      case 'HOSPITAL':
      case 'BLOOD_BANK': return '/facility-dashboard';
      case 'DONOR': return '/donor-dashboard';
      case 'RECEIVER': default: return '/receiver-dashboard';
    }
  };

  const isActive = (path) => location.pathname === path;
  const userInitials = user ? (user.first_name?.[0] || user.username?.[0] || 'U').toUpperCase() : '';

  const isAdminUser = Boolean(
    user && (
      user.role?.toUpperCase() === 'ADMIN' ||
      user.is_superuser ||
      user.is_staff ||
      user.user_type?.toUpperCase() === 'ADMIN' ||
      user.username === 'admin'
    )
  );

  return (
    <>
      {showAuth && <AuthModal defaultTab={authTab} onClose={() => setShowAuth(false)} />}

      <nav className="navbar navbar-expand-lg navbar-glass sticky-top py-2">
        <div className="container">
          {/* Brand */}
          <Link className="navbar-brand d-flex align-items-center gap-2 fw-bold" to="/">
            <div style={{
              background: 'linear-gradient(135deg, #e53935, #b71c1c)',
              width: 36, height: 36, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(229,57,53,0.4)'
            }}>
              <IoWater size={20} color="#fff" className="animate-pulse" />
            </div>
            <span style={{ color: '#fff' }}>Life<span style={{ color: '#ff6b6b' }}>Flow</span></span>
          </Link>

          {/* Toggler */}
          <button
            className="navbar-toggler border-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
            style={{ color: '#fff' }}
          >
            <IoMenuOutline size={26} />
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-lg-center gap-1">
              {!user && (
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/') ? 'active-link' : ''}`} to="/">Home</Link>
                </li>
              )}
              <li className="nav-item">
                <Link className={`nav-link ${isActive('/about') ? 'active-link' : ''}`} to="/about">About</Link>
              </li>
              {user?.role !== 'RECEIVER' && user?.role !== 'HOSPITAL' && user?.role !== 'BLOOD_BANK' && (
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/camps') ? 'active-link' : ''}`} to="/camps">
                    <IoCalendarOutline size={15} className="me-1" />
                    Camps
                  </Link>
                </li>
              )}
              {!isAdminUser && user?.role !== 'HOSPITAL' && user?.role !== 'BLOOD_BANK' && (
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/hospitals-blood-banks') ? 'active-link' : ''}`} to="/hospitals-blood-banks">
                    <IoBusinessOutline size={15} className="me-1" />
                    Hospitals & Blood Banks
                  </Link>
                </li>
              )}

              {user ? (
                <>
                  {(user.role === 'HOSPITAL' || user.role === 'BLOOD_BANK') ? (
                    <>
                      <li className="nav-item">
                        <Link className={`nav-link ${isActive('/facility-dashboard') ? 'active-link' : ''}`} to="/facility-dashboard">
                          <IoSpeedometerOutline size={15} className="me-1" />
                          Facility Dashboard
                        </Link>
                      </li>
                    </>
                  ) : (
                    <>
                      {user.role === 'RECEIVER' && (
                        <li className="nav-item">
                          <Link className="nav-link" style={{ color: '#ff8a80 !important' }} to="/receiver-dashboard?new-request=1">
                            <IoAddCircleOutline size={16} className="me-1" />
                            Emergency Request
                          </Link>
                        </li>
                      )}
                      <li className="nav-item">
                        <Link className={`nav-link ${isActive('/notifications') ? 'active-link' : ''}`} to="/notifications">
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <IoNotificationsOutline size={17} className="me-1" />
                            {unreadAlerts > 0 && <span className="nav-badge" />}
                          </div>
                          Alerts
                        </Link>
                      </li>
                      {isAdminUser && (
                        <li className="nav-item">
                          <Link className={`nav-link ${isActive('/reports') ? 'active-link' : ''}`} to="/reports">
                            <IoStatsChartOutline size={15} className="me-1" />
                            Reports
                          </Link>
                        </li>
                      )}
                      <li className="nav-item">
                        <Link className={`nav-link ${isActive(getDashboardLink()) ? 'active-link' : ''}`} to={getDashboardLink()}>
                          <IoSpeedometerOutline size={15} className="me-1" />
                          Dashboard
                        </Link>
                      </li>
                    </>
                  )}

                  {/* User Dropdown */}
                  <li className="nav-item dropdown ms-lg-2">
                    <a
                      className="nav-link dropdown-toggle d-flex align-items-center gap-2 text-white fw-semibold"
                      href="#"
                      id="navbarDropdown"
                      role="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <div className="user-avatar-nav">{userInitials}</div>
                      <span className="d-none d-lg-inline" style={{ fontSize: '0.875rem' }}>
                        {user.first_name || user.username}
                      </span>
                    </a>
                    <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                      <li className="px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <p className="mb-0" style={{ color: '#fff', fontWeight: 700, fontSize: '0.875rem' }}>
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="mb-0" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                          {user.email}
                        </p>
                      </li>
                      {(user.role === 'HOSPITAL' || user.role === 'BLOOD_BANK') ? (
                        <li className="mt-1">
                          <Link className="dropdown-item d-flex align-items-center gap-2" to="/facility-dashboard">
                            <IoSpeedometerOutline size={16} />
                            Facility Dashboard
                          </Link>
                        </li>
                      ) : (
                        <>
                          {user.role !== 'RECEIVER' && (
                            <li className="mt-1">
                              <Link className="dropdown-item d-flex align-items-center gap-2" to="/profile">
                                <IoPersonCircleOutline size={16} />
                                My Profile
                              </Link>
                            </li>
                          )}
                          {hasMultipleRoles() && (
                            <li>
                              <Link className="dropdown-item d-flex align-items-center gap-2" to="/select-role">
                                <IoHeartOutline size={16} />
                                Switch Role
                              </Link>
                            </li>
                          )}
                          {!isAdminUser && user.role === 'DONOR' && (
                            <li>
                              <Link className="dropdown-item d-flex align-items-center gap-2" to="/history">
                                <IoTimeOutline size={16} />
                                History Logs
                              </Link>
                            </li>
                          )}
                        </>
                      )}
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <button
                          className="dropdown-item py-2 d-flex align-items-center gap-2"
                          onClick={handleLogout}
                          style={{ color: '#ff6b6b' }}
                        >
                          <IoLogOutOutline size={18} />
                          Logout
                        </button>
                      </li>
                    </ul>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item ms-lg-2 mt-2 mt-lg-0">
                    <Link
                      to="/register-facility"
                      className="btn btn-outline-danger d-flex align-items-center gap-1 fw-bold text-nowrap"
                      style={{ borderRadius: 8, padding: '7px 14px', fontSize: '0.84rem', color: '#ff8a80', borderColor: 'rgba(255,107,107,0.5)' }}
                    >
                      <IoBusinessOutline size={16} />
                      Register Hospital / Blood Bank
                    </Link>
                  </li>
                  <li className="nav-item ms-lg-2 mt-2 mt-lg-0">
                    <button
                      id="navbar-login-btn"
                      className="btn-glass d-flex align-items-center gap-2"
                      style={{ borderRadius: 8, padding: '8px 18px', fontSize: '0.875rem' }}
                      onClick={openLogin}
                    >
                      Login / Register
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
