import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  IoSpeedometerOutline, 
  IoPersonOutline, 
  IoSettingsOutline, 
  IoLogOutOutline, 
  IoCalendarOutline, 
  IoTimeOutline,
  IoStatsChartOutline
} from 'react-icons/io5';

const Sidebar = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  // Render role-specific navigation links
  const renderLinks = () => {
    switch (user.role) {
      case 'DONOR':
        return (
          <>
            <li className="nav-item mb-2">
              <NavLink 
                to="/donor-dashboard" 
                className={({ isActive }) => `nav-link d-flex align-items-center gap-3 px-3 py-3 rounded-3 text-decoration-none ${isActive ? 'bg-danger text-white shadow-sm' : 'text-secondary hover-bg-light'}`}
              >
                <IoSpeedometerOutline size={20} />
                <span className="fw-medium">Donor Panel</span>
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink 
                to="/profile" 
                className={({ isActive }) => `nav-link d-flex align-items-center gap-3 px-3 py-3 rounded-3 text-decoration-none ${isActive ? 'bg-danger text-white shadow-sm' : 'text-secondary hover-bg-light'}`}
              >
                <IoPersonOutline size={20} />
                <span className="fw-medium">My Donor Profile</span>
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink 
                to="/camps" 
                className={({ isActive }) => `nav-link d-flex align-items-center gap-3 px-3 py-3 rounded-3 text-decoration-none ${isActive ? 'bg-danger text-white shadow-sm' : 'text-secondary hover-bg-light'}`}
              >
                <IoCalendarOutline size={20} />
                <span className="fw-medium">Donation Camps</span>
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink 
                to="/history" 
                className={({ isActive }) => `nav-link d-flex align-items-center gap-3 px-3 py-3 rounded-3 text-decoration-none ${isActive ? 'bg-danger text-white shadow-sm' : 'text-secondary hover-bg-light'}`}
              >
                <IoTimeOutline size={20} />
                <span className="fw-medium">Donation History</span>
              </NavLink>
            </li>
          </>
        );
      case 'RECEIVER':
        return (
          <>
            <li className="nav-item mb-2">
              <NavLink 
                to="/receiver-dashboard" 
                className={({ isActive }) => `nav-link d-flex align-items-center gap-3 px-3 py-3 rounded-3 text-decoration-none ${isActive ? 'bg-danger text-white shadow-sm' : 'text-secondary hover-bg-light'}`}
              >
                <IoSpeedometerOutline size={20} />
                <span className="fw-medium">Receiver Panel</span>
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink to="/my-requests" className={({ isActive }) => `nav-link d-flex align-items-center gap-3 px-3 py-3 rounded-3 text-decoration-none ${isActive ? 'bg-danger text-white shadow-sm' : 'text-secondary hover-bg-light'}`}>
                <IoTimeOutline size={20} />
                <span className="fw-medium">My Requests</span>
              </NavLink>
            </li>
          </>
        );
      case 'ADMIN':
        return (
          <>
            <li className="nav-item mb-2">
              <NavLink 
                to="/admin-dashboard" 
                className={({ isActive }) => `nav-link d-flex align-items-center gap-3 px-3 py-3 rounded-3 text-decoration-none ${isActive ? 'bg-danger text-white shadow-sm' : 'text-secondary hover-bg-light'}`}
              >
                <IoSpeedometerOutline size={20} />
                <span className="fw-medium">Admin Panel</span>
              </NavLink>
            </li>
            <li className="nav-item mb-2">
              <NavLink 
                to="/reports" 
                className={({ isActive }) => `nav-link d-flex align-items-center gap-3 px-3 py-3 rounded-3 text-decoration-none ${isActive ? 'bg-danger text-white shadow-sm' : 'text-secondary hover-bg-light'}`}
              >
                <IoStatsChartOutline size={20} />
                <span className="fw-medium">Reports & Analytics</span>
              </NavLink>
            </li>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border rounded-4 p-3 shadow-sm h-100 d-flex flex-column" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* User Quick Info */}
      <div className="d-flex align-items-center gap-3 px-2 py-3 border-bottom mb-3">
        <div className="bg-danger text-white rounded-circle d-flex align-items-center justify-content-center fw-bold text-uppercase fs-5" style={{ width: '45px', height: '45px' }}>
          {user.username.substring(0, 2)}
        </div>
        <div className="overflow-hidden">
          <h6 className="fw-bold mb-0 text-dark text-truncate">{user.first_name || user.username}</h6>
          <span className="text-muted small text-uppercase fw-semibold">{user.role}</span>
        </div>
      </div>

      {/* Navigation List */}
      <ul className="nav flex-column mb-auto">
        {renderLinks()}
        
        {/* Common links for all authenticated roles */}
        <li className="nav-item mb-2">
          <NavLink 
            to="/settings" 
            className={({ isActive }) => `nav-link d-flex align-items-center gap-3 px-3 py-3 rounded-3 text-decoration-none ${isActive ? 'bg-danger text-white shadow-sm' : 'text-secondary hover-bg-light'}`}
          >
            <IoSettingsOutline size={20} />
            <span className="fw-medium">Account Settings</span>
          </NavLink>
        </li>
      </ul>

      {/* Logout button at bottom */}
      <div className="border-top pt-3">
        <button 
          onClick={logout}
          className="btn btn-outline-danger w-100 py-2 d-flex align-items-center justify-content-center gap-2 rounded-3 fw-medium"
        >
          <IoLogOutOutline size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
