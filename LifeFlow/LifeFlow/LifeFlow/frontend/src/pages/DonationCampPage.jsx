import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { IoCalendarOutline, IoLocationOutline, IoArrowForwardOutline, IoAddCircleOutline, IoTrashOutline } from 'react-icons/io5';

const DonationCampPage = () => {
  const { user } = useAuth();

  // States
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('UPCOMING');
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  // Admin Add Camp State
  const [showAddModal, setShowAddModal] = useState(false);
  const [submittingCamp, setSubmittingCamp] = useState(false);
  const [campForm, setCampForm] = useState({
    name: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    organizer: user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Red Cross India',
    status: 'UPCOMING'
  });

  const fetchCamps = async () => {
    setLoading(true);
    try {
      const response = await api.get(`camp/list/?status=${statusFilter}`);
      setCamps(response.data);
    } catch (err) {
      setToastType('danger');
      setToastMessage("Failed to retrieve donation camps list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCamps();
  }, [statusFilter]);

  const handleAddCamp = async (e) => {
    e.preventDefault();
    setSubmittingCamp(true);
    try {
      await api.post('camp/create/', campForm);
      setToastType('success');
      setToastMessage(`✅ Donation camp '${campForm.name}' created successfully!`);
      setShowAddModal(false);
      setCampForm({
        name: '',
        location: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        organizer: user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Red Cross India',
        status: 'UPCOMING'
      });
      fetchCamps();
    } catch (err) {
      setToastType('danger');
      setToastMessage(err.response?.data?.detail || "Failed to create camp. Check input values.");
    } finally {
      setSubmittingCamp(false);
    }
  };

  const handleDeleteCamp = async (campId, campName) => {
    if (!window.confirm(`Are you sure you want to remove camp '${campName}'?`)) return;
    try {
      await api.delete(`camp/delete/${campId}/`);
      setToastType('success');
      setToastMessage(`Camp '${campName}' removed.`);
      setCamps(prev => prev.filter(c => c.id !== campId));
    } catch (err) {
      setToastType('danger');
      setToastMessage(err.response?.data?.detail || "Failed to delete camp.");
    }
  };

  const isAdmin = Boolean(
    user && (
      user.role?.toUpperCase() === 'ADMIN' || 
      user.is_superuser || 
      user.is_staff || 
      user.user_type?.toUpperCase() === 'ADMIN' || 
      user.username === 'admin'
    )
  );

  return (
    <div className="container py-4">
      {toastMessage && (
        <div className="toast-container-custom">
          <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
        </div>
      )}

      {loading ? (
        <Loader fullPage={true} message="Accessing camp registry..." />
      ) : (
        <div className="row g-4">
          {/* Sidebar */}
          <div className="col-lg-3">
            <Sidebar />
          </div>

          {/* List panel */}
          <div className="col-lg-9">
            <div className="custom-card p-4">
              <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4 flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="text-danger">
                    <IoCalendarOutline size={36} />
                  </div>
                  <div>
                    <h4 className="fw-bold mb-0">Blood Donation Camps</h4>
                    <p className="text-secondary small mb-0">Join nearby blood camps and earn certification awards</p>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2 flex-wrap">
                  {isAdmin && (
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="btn btn-red btn-sm fw-bold d-flex align-items-center gap-1 px-3 py-2"
                      style={{ borderRadius: 8 }}
                    >
                      <IoAddCircleOutline size={18} />
                      Add New Camp
                    </button>
                  )}

                  {/* Filter Toggles */}
                  <div className="btn-group" role="group">
                    <button 
                      onClick={() => setStatusFilter('UPCOMING')}
                      className={`btn btn-sm ${statusFilter === 'UPCOMING' ? 'btn-red' : 'btn-outline-danger'}`}
                    >
                      Upcoming
                    </button>
                    <button 
                      onClick={() => setStatusFilter('COMPLETED')}
                      className={`btn btn-sm ${statusFilter === 'COMPLETED' ? 'btn-red' : 'btn-outline-danger'}`}
                    >
                      Completed
                    </button>
                  </div>
                </div>
              </div>

              {camps.length > 0 ? (
                <div className="row g-3">
                  {camps.map((camp) => (
                    <div className="col-md-6" key={camp.id}>
                      <div className="custom-card p-4 h-100 d-flex flex-column border position-relative">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className={`badge bg-${camp.status === 'UPCOMING' ? 'danger' : 'secondary'} uppercase small fw-bold px-2 py-1`}>
                            {camp.status}
                          </span>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteCamp(camp.id, camp.name)}
                              className="btn btn-outline-danger btn-sm p-1 d-flex align-items-center justify-content-center"
                              title="Remove Camp"
                              style={{ width: 28, height: 28, borderRadius: 6 }}
                            >
                              <IoTrashOutline size={16} />
                            </button>
                          )}
                        </div>

                        <h5 className="fw-bold text-dark mb-1">{camp.name}</h5>
                        <p className="text-muted small mb-3">Organized by: {camp.organizer}</p>
                        
                        <div className="text-secondary small mb-4">
                          <div className="mb-2 d-flex align-items-center gap-2">
                            <IoCalendarOutline className="text-danger" />
                            <strong>Date/Time:</strong> {camp.date} @ {camp.time.substring(0, 5)}
                          </div>
                          <div className="d-flex align-items-start gap-2">
                            <IoLocationOutline className="text-danger flex-shrink-0 mt-1" />
                            <span><strong>Location:</strong> {camp.location}</span>
                          </div>
                        </div>

                        {/* Direct link button */}
                        <div className="mt-auto">
                          <Link 
                            to={`/camps/${camp.id}`} 
                            className="btn btn-red-outline btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
                          >
                            {isAdmin ? 'View Details & Manage' : 'View Details & Register'}
                            <IoArrowForwardOutline />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState 
                  message="No donation camps scheduled." 
                  subMessage="Modify the upcoming/completed toggles or contact administrators for upcoming camp dates."
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Add Camp Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 1060, display: 'flex', alignItems: 'center', justify: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 500, boxShadow: '0 24px 60px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg, #c62828, #e53935)', padding: '20px 24px', display: 'flex', alignItems: 'center', justify: 'space-between' }}>
              <h5 style={{ color: '#fff', fontWeight: 800, margin: 0 }}>➕ Add Blood Donation Camp</h5>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleAddCamp} style={{ padding: '24px' }}>
              <div className="mb-3">
                <label className="form-label small fw-bold">Camp Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={campForm.name}
                  onChange={(e) => setCampForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Annual City Voluntary Blood Drive"
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label small fw-bold">Organizer</label>
                <input
                  type="text"
                  className="form-control"
                  value={campForm.organizer}
                  onChange={(e) => setCampForm(prev => ({ ...prev, organizer: e.target.value }))}
                  placeholder="e.g. Red Cross Society / Rotary Club"
                  required
                />
              </div>
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label small fw-bold">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={campForm.date}
                    onChange={(e) => setCampForm(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label small fw-bold">Schedule Time</label>
                  <input
                    type="time"
                    className="form-control"
                    value={campForm.time}
                    onChange={(e) => setCampForm(prev => ({ ...prev, time: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="form-label small fw-bold">Camp Location / Address</label>
                <input
                  type="text"
                  className="form-control"
                  value={campForm.location}
                  onChange={(e) => setCampForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g. Community Hall, MG Road, Ahmedabad"
                  required
                />
              </div>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-outline-secondary flex-grow-1" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" disabled={submittingCamp} className="btn btn-red flex-grow-1 fw-bold">
                  {submittingCamp ? 'Saving...' : 'Create Camp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationCampPage;
