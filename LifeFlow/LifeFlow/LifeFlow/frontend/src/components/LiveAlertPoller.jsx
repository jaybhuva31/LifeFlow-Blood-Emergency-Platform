import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { IoWarningOutline, IoCloseOutline } from 'react-icons/io5';

const LiveAlertPoller = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeAlert, setActiveAlert] = useState(null);

  useEffect(() => {
    // Only run if user is a DONOR
    if (!user || user.role !== 'DONOR') {
      setActiveAlert(null);
      return;
    }

    // Don't show popups if we are already on the emergency requests page
    if (location.pathname === '/emergency-requests') {
      setActiveAlert(null);
      return;
    }

    const checkAlerts = async () => {
      try {
        const response = await api.get('requests/emergency/active-alerts/');
        if (response.data && response.data.length > 0) {
          // Display the first/most recent active alert
          setActiveAlert(response.data[0]);
        } else {
          setActiveAlert(null);
        }
      } catch (err) {
        console.error("Error checking live alerts:", err);
      }
    };

    // Run immediately and then every 5 seconds
    checkAlerts();
    const interval = setInterval(checkAlerts, 5000);

    return () => clearInterval(interval);
  }, [user, location.pathname]);

  const handleIgnore = async () => {
    if (!activeAlert) return;
    try {
      await api.post(`requests/emergency/respond/${activeAlert.id}/`, { status: 'IGNORED' });
      setActiveAlert(null);
    } catch (err) {
      console.error("Error ignoring alert:", err);
    }
  };

  const handleView = () => {
    setActiveAlert(null);
    navigate('/emergency-requests');
  };

  if (!activeAlert) return null;

  return (
    <div 
      className="card shadow-lg border-0 border-start border-danger border-4 text-dark alert-slide-in"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        width: '340px',
        borderRadius: '12px',
        backgroundColor: '#fff',
        boxShadow: '0 10px 30px rgba(220, 53, 69, 0.15)',
        animation: 'slideIn 0.3s ease-out'
      }}
    >
      <style>{`
        @keyframes slideIn {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div className="card-body p-3">
        <div className="d-flex align-items-start gap-3">
          <div 
            className="bg-danger bg-opacity-10 text-danger rounded-circle p-2 d-flex align-items-center justify-content-center"
            style={{ width: '42px', height: '42px', flexShrink: 0 }}
          >
            <IoWarningOutline size={22} className="animate-pulse" />
          </div>
          <div className="flex-grow-1 overflow-hidden">
            <h6 className="fw-bold mb-1 text-danger d-flex align-items-center gap-1">
              🔴 Emergency Blood Needed
            </h6>
            <div className="small text-muted mb-2">
              <div className="text-truncate">
                <strong>Blood Group:</strong> <span className="badge bg-danger ms-1 px-2">{activeAlert.blood_group}</span>
              </div>
              <div className="text-truncate mt-1">
                <strong>Hospital:</strong> {activeAlert.hospital_name}
              </div>
              <div className="text-truncate mt-1">
                <strong>Location:</strong> {activeAlert.location}
              </div>
            </div>
            <div className="d-flex gap-2">
              <button 
                onClick={handleView}
                className="btn btn-danger btn-sm px-3 fw-semibold flex-grow-1"
                style={{ fontSize: '0.8rem' }}
              >
                View Request
              </button>
              <button 
                onClick={handleIgnore}
                className="btn btn-outline-secondary btn-sm px-2"
                title="Ignore request"
                style={{ fontSize: '0.8rem' }}
              >
                Ignore
              </button>
            </div>
          </div>
          <button 
            onClick={() => setActiveAlert(null)}
            className="btn-close ms-auto p-0 flex-shrink-0"
            style={{ fontSize: '0.8rem' }}
            aria-label="Close"
          />
        </div>
      </div>
    </div>
  );
};

export default LiveAlertPoller;
