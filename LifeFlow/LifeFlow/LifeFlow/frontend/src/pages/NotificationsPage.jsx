import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';
import api from '../services/api';
import { 
  IoNotificationsOutline, 
  IoTrashOutline, 
  IoMailOpenOutline, 
  IoMailUnreadOutline, 
  IoAlertCircleOutline 
} from 'react-icons/io5';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  const fetchNotifications = async () => {
    try {
      const response = await api.get('notification/list/');
      const alerts = response.data;
      setNotifications(alerts);

      // Viewing the Alerts page acknowledges all messages and clears the nav indicator.
      if (alerts.some((notification) => !notification.is_read)) {
        await api.patch('notification/read-all/');
        setNotifications(alerts.map((notification) => ({ ...notification, is_read: true })));
        window.dispatchEvent(new Event('lifeflow:alerts-read'));
      }
    } catch (err) {
      setToastType('danger');
      setToastMessage("Failed to retrieve notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Mark a single notification read
  const handleMarkRead = async (id) => {
    setActionLoading(true);
    try {
      await api.patch(`notification/read/${id}/`);
      setNotifications(prev => 
        prev.map(item => item.id === id ? { ...item, is_read: true } : item)
      );
      setToastType('success');
      setToastMessage("Notification marked as read.");
    } catch (err) {
      setToastType('danger');
      setToastMessage("Failed to update notification.");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete a single notification
  const handleDelete = async (id) => {
    setActionLoading(true);
    try {
      await api.delete(`notification/delete/${id}/`);
      setNotifications(prev => prev.filter(item => item.id !== id));
      setToastType('success');
      setToastMessage("Notification deleted.");
    } catch (err) {
      setToastType('danger');
      setToastMessage("Failed to delete notification.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="container py-4">
      {toastMessage && (
        <div className="toast-container-custom">
          <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
        </div>
      )}

      {loading ? (
        <Loader fullPage={true} message="Opening notification vault..." />
      ) : (
        <div className="row g-4">
          {/* Sidebar */}
          <div className="col-lg-3">
            <Sidebar />
          </div>

          {/* List Content */}
          <div className="col-lg-9">
            <div className="custom-card p-4">
              <div className="d-flex align-items-center gap-3 border-bottom pb-3 mb-4">
                <div className="text-danger animate-pulse">
                  <IoNotificationsOutline size={36} />
                </div>
                <div>
                  <h4 className="fw-bold mb-0">Notification Center</h4>
                  <p className="text-secondary small mb-0">Manage system alerts and match notifications</p>
                </div>
              </div>

              {notifications.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {notifications.map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-3 border rounded-3 d-flex align-items-start justify-content-between gap-3 transition ${item.is_read ? 'bg-light bg-opacity-50 text-muted' : 'bg-white border-start border-danger border-3 shadow-sm'}`}
                    >
                      <div className="d-flex gap-3 align-items-start">
                        <div className={`p-2 rounded-circle mt-1 ${item.is_read ? 'bg-secondary bg-opacity-10 text-secondary' : 'bg-danger bg-opacity-10 text-danger'}`}>
                          <IoAlertCircleOutline size={20} />
                        </div>
                        <div>
                          <h6 className={`fw-bold mb-1 ${item.is_read ? 'text-secondary' : 'text-dark'}`}>{item.title}</h6>
                          <p className="small mb-1">{item.message}</p>
                          <span className="text-muted small fw-semibold" style={{ fontSize: '0.75rem' }}>
                            {new Date(item.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="d-flex gap-2">
                        {!item.is_read && (
                          <button 
                            onClick={() => handleMarkRead(item.id)} 
                            disabled={actionLoading}
                            title="Mark as Read"
                            className="btn btn-sm btn-outline-secondary p-2 d-flex align-items-center rounded-circle border-0"
                          >
                            <IoMailOpenOutline size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete(item.id)} 
                          disabled={actionLoading}
                          title="Delete Alert"
                          className="btn btn-sm btn-outline-danger p-2 d-flex align-items-center rounded-circle border-0"
                        >
                          <IoTrashOutline size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState 
                  message="Your inbox is empty." 
                  subMessage="No new emergency alerts or reminders match your account."
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
