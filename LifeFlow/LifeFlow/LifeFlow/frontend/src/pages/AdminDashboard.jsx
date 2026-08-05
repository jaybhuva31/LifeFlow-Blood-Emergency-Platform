import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import api from '../services/api';
import { 
  IoPeopleOutline, 
  IoCheckmarkCircleOutline, 
  IoTimeOutline, 
  IoTrashOutline, 
  IoSearchOutline, 
  IoMailOutline, 
  IoPersonOutline, 
  IoEyeOutline, 
  IoShieldCheckmarkOutline,
  IoWaterOutline,
  IoRefreshOutline,
  IoCallOutline,
  IoBusinessOutline,
  IoAddCircleOutline,
  IoLocationOutline
} from 'react-icons/io5';

import VoiceAnalyticsWidget from '../components/voice/VoiceAnalyticsWidget';

const AdminDashboard = () => {
  // Navigation Section State: 'USERS' | 'FACILITIES'
  const [activeTab, setActiveTab] = useState('USERS');

  // Users Data State
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Facilities Data State (Hospitals & Blood Banks)
  const [facilities, setFacilities] = useState([]);
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const [facilitySearchQuery, setFacilitySearchQuery] = useState('');
  const [facilityTypeFilter, setFacilityTypeFilter] = useState('ALL');

  const [refreshing, setRefreshing] = useState(false);

  // Modals & Action States
  const [selectedUser, setSelectedUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [showAddFacilityModal, setShowAddFacilityModal] = useState(false);
  const [showAddCampModal, setShowAddCampModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // New Camp Form State
  const [campForm, setCampForm] = useState({
    name: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    organizer: 'Red Cross India',
    status: 'UPCOMING'
  });

  // New Facility Form State
  const [newFacility, setNewFacility] = useState({
    name: '',
    facility_type: 'HOSPITAL',
    license_number: '',
    city: '',
    address: '',
    helpline_phone: '',
    operating_hours: '24/7 Emergency Trauma Open',
    stock_o_positive: 10,
    stock_o_negative: 3,
    stock_a_positive: 8,
    stock_a_negative: 2,
    stock_b_positive: 12,
    stock_b_negative: 3,
    stock_ab_positive: 5,
    stock_ab_negative: 1
  });

  // Toast Notifications
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  const fetchUsers = async () => {
    try {
      let url = 'accounts/admin/users/';
      if (userSearchQuery) url += `?search=${encodeURIComponent(userSearchQuery)}`;
      const response = await api.get(url);
      setUsers(response.data);
    } catch (err) {
      setToastType('danger');
      setToastMessage(err.response?.data?.detail || "Failed to load registered users.");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchFacilities = async (overrideTypeFilter) => {
    try {
      let url = 'receiver/hospitals-blood-banks/';
      const params = new URLSearchParams();
      if (facilitySearchQuery) params.append('search', facilitySearchQuery);
      const activeFilter = overrideTypeFilter !== undefined ? overrideTypeFilter : facilityTypeFilter;
      if (activeFilter !== 'ALL') params.append('facility_type', activeFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await api.get(url);
      setFacilities(response.data);
    } catch (err) {
      setToastType('danger');
      setToastMessage("Failed to load hospitals and blood banks.");
    } finally {
      setLoadingFacilities(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchFacilities();
  }, [facilityTypeFilter]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUsers(), fetchFacilities()]);
    setRefreshing(false);
  };

  const handleUserSearchSubmit = (e) => {
    e.preventDefault();
    setLoadingUsers(true);
    fetchUsers();
  };

  const handleFacilitySearchSubmit = (e) => {
    e.preventDefault();
    setLoadingFacilities(true);
    fetchFacilities();
  };

  // Toggle user verification
  const handleToggleUserVerification = async (user) => {
    setActionLoading(true);
    try {
      const newStatus = !user.is_verified;
      const res = await api.patch(`accounts/admin/users/${user.id}/verify/`, { is_verified: newStatus });
      setToastType('success');
      setToastMessage(`✅ ${res.data.message}`);
      await fetchUsers();
      if (selectedUser && selectedUser.id === user.id) {
        setSelectedUser(prev => ({ ...prev, is_verified: newStatus, is_active: newStatus }));
      }
    } catch (err) {
      setToastType('danger');
      setToastMessage(err.response?.data?.detail || "Failed to update verification status.");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete user account
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setActionLoading(true);
    try {
      await api.delete(`accounts/admin/users/${userToDelete.id}/delete/`);
      setToastType('warning');
      setToastMessage(`User '${userToDelete.username}' removed successfully.`);
      setUserToDelete(null);
      if (selectedUser && selectedUser.id === userToDelete.id) setSelectedUser(null);
      await fetchUsers();
    } catch (err) {
      setToastType('danger');
      setToastMessage(err.response?.data?.detail || "Failed to delete user.");
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle or approve facility status
  const handleApproveFacility = async (facility) => {
    setActionLoading(true);
    try {
      const newStatus = !facility.is_verified;
      const res = await api.patch(`receiver/hospitals-blood-banks/${facility.id}/approve/`, { is_verified: newStatus });
      setToastType('success');
      setToastMessage(`✅ ${res.data.message}`);
      await fetchFacilities();
    } catch (err) {
      setToastType('danger');
      setToastMessage(err.response?.data?.detail || "Failed to update facility approval.");
    } finally {
      setActionLoading(false);
    }
  };

  // Delete/Reject facility
  const handleDeleteFacility = async (facility) => {
    if (!window.confirm(`Are you sure you want to remove '${facility.name}'?`)) return;
    setActionLoading(true);
    try {
      await api.delete(`receiver/hospitals-blood-banks/${facility.id}/delete/`);
      setToastType('warning');
      setToastMessage(`Facility '${facility.name}' removed successfully.`);
      await fetchFacilities();
    } catch (err) {
      setToastType('danger');
      setToastMessage(err.response?.data?.detail || "Failed to remove facility.");
    } finally {
      setActionLoading(false);
    }
  };

  // Register New Facility (Hospital / Blood Bank)
  const handleCreateFacility = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('receiver/hospitals-blood-banks/create/', newFacility);
      setToastType('success');
      setToastMessage(`✅ Facility '${newFacility.name}' added successfully!`);
      setShowAddFacilityModal(false);
      setNewFacility({
        name: '',
        facility_type: 'HOSPITAL',
        license_number: '',
        city: '',
        address: '',
        helpline_phone: '',
        operating_hours: '24/7 Emergency Trauma Open',
        stock_o_positive: 0, stock_o_negative: 0, stock_a_positive: 0, stock_a_negative: 0,
        stock_b_positive: 0, stock_b_negative: 0, stock_ab_positive: 0, stock_ab_negative: 0
      });
      await fetchFacilities();
    } catch (err) {
      setToastType('danger');
      setToastMessage(err.response?.data?.detail || "Failed to register facility. Check input fields.");
    } finally {
      setActionLoading(false);
    }
  };

  // Create Blood Donation Camp
  const handleCreateCamp = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.post('camp/create/', campForm);
      setToastType('success');
      setToastMessage(`✅ Blood Donation Camp '${campForm.name}' created successfully!`);
      setShowAddCampModal(false);
      setCampForm({
        name: '',
        location: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        organizer: 'Red Cross India',
        status: 'UPCOMING'
      });
    } catch (err) {
      setToastType('danger');
      setToastMessage(err.response?.data?.detail || "Failed to create camp.");
    } finally {
      setActionLoading(false);
    }
  };

  // User summary metrics (excluding facility users)
  const filteredUsers = users.filter(u => u.role !== 'HOSPITAL' && u.role !== 'BLOOD_BANK' && !u.facility_profile);
  const totalUsers = filteredUsers.length;
  const verifiedUsers = filteredUsers.filter(u => u.is_verified).length;
  const pendingUsers = filteredUsers.filter(u => !u.is_verified).length;

  // Facility summary metrics
  const totalFacilities = facilities.length;
  const totalHospitals = facilities.filter(f => f.facility_type === 'HOSPITAL').length;
  const totalBloodBanks = facilities.filter(f => f.facility_type === 'BLOOD_BANK').length;

  return (
    <div className="container py-4">
      {toastMessage && (
        <div className="toast-container-custom">
          <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
        </div>
      )}

      <div className="row g-4">
        {/* Sidebar */}
        <div className="col-lg-3">
          <Sidebar />
        </div>

        {/* Main Admin Content */}
        <div className="col-lg-9">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
            <div>
              <h3 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <IoShieldCheckmarkOutline className="text-danger" />
                Admin Console
              </h3>
              <p className="text-muted small mb-0">Manage system users, verify emails, review hospitals & blood banks</p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                onClick={() => setShowAddCampModal(true)}
                className="btn btn-danger btn-sm d-flex align-items-center gap-1 fw-bold"
                style={{ borderRadius: 8 }}
              >
                <IoAddCircleOutline size={18} />
                Create Blood Camp
              </button>
              <button 
                onClick={handleRefresh} 
                disabled={refreshing}
                className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1 fw-semibold"
                style={{ borderRadius: 8 }}
              >
                <IoRefreshOutline className={refreshing ? 'spin-icon' : ''} />
                Refresh Data
              </button>
            </div>
          </div>

          {/* Navigation Section Tabs */}
          <div className="card border-0 shadow-sm p-2 mb-4" style={{ borderRadius: 16 }}>
            <div className="nav nav-pills nav-justified gap-2">
              <button
                className={`nav-link py-3 fw-bold d-flex align-items-center justify-content-center gap-2 ${activeTab === 'USERS' ? 'bg-danger text-white' : 'text-dark'}`}
                style={{ borderRadius: 12, transition: 'all 0.2s' }}
                onClick={() => setActiveTab('USERS')}
              >
                <IoPeopleOutline size={20} />
                User Management ({totalUsers})
              </button>
              <button
                className={`nav-link py-3 fw-bold d-flex align-items-center justify-content-center gap-2 ${activeTab === 'FACILITIES' ? 'bg-danger text-white' : 'text-dark'}`}
                style={{ borderRadius: 12, transition: 'all 0.2s' }}
                onClick={() => setActiveTab('FACILITIES')}
              >
                <IoBusinessOutline size={20} />
                Hospitals & Blood Banks ({totalFacilities})
              </button>
            </div>
          </div>

          {/* Voice Analytics Widget */}
          <div className="mb-4">
            <VoiceAnalyticsWidget />
          </div>

          {/* TAB 1: USER MANAGEMENT */}
          {activeTab === 'USERS' && (
            <>
              {/* Summary Metric Cards */}
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <div className="card border-0 shadow-sm p-3 text-center" style={{ borderRadius: 14, background: '#f8fafc' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b' }}>{totalUsers}</div>
                    <div className="small text-muted fw-semibold">Total Platform Users</div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card border-0 shadow-sm p-3 text-center" style={{ borderRadius: 14, background: '#f0fdf4' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a' }}>{verifiedUsers}</div>
                    <div className="small fw-semibold" style={{ color: '#15803d' }}>Verified Email Users</div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card border-0 shadow-sm p-3 text-center" style={{ borderRadius: 14, background: '#fffbeb' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#d97706' }}>{pendingUsers}</div>
                    <div className="small fw-semibold" style={{ color: '#b45309' }}>Pending Verification</div>
                  </div>
                </div>
              </div>

              {/* User Search Bar */}
              <div className="card border-0 shadow-sm p-3 mb-4" style={{ borderRadius: 16 }}>
                <form onSubmit={handleUserSearchSubmit} className="d-flex gap-2 flex-grow-1">
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <IoSearchOutline color="#94a3b8" size={18} />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0 ps-0"
                      placeholder="Search user by name, email, or phone number..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                    />
                    {userSearchQuery && (
                      <button type="button" onClick={() => { setUserSearchQuery(''); fetchUsers(); }} className="btn btn-light text-muted border-start-0">
                        Clear
                      </button>
                    )}
                    <button type="submit" className="btn btn-red px-4 fw-bold">Search Users</button>
                  </div>
                </form>
              </div>

              {/* Users Table */}
              {loadingUsers ? (
                <Loader fullPage={false} message="Loading registered users..." />
              ) : filteredUsers.length === 0 ? (
                <div className="card border-0 shadow-sm p-5 text-center" style={{ borderRadius: 16 }}>
                  <IoPeopleOutline size={48} className="mx-auto text-muted mb-3" />
                  <h5 className="fw-bold">No Users Found</h5>
                  <p className="text-muted small">No registered users matched your search criteria.</p>
                </div>
              ) : (
                <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: 16 }}>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead style={{ background: '#f8fafc', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <tr>
                          <th className="py-3 px-4">User</th>
                          <th className="py-3">Contact</th>
                          <th className="py-3">Email Verification</th>
                          <th className="py-3">Joined Date</th>
                          <th className="py-3 px-4 text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map(u => (
                          <tr key={u.id}>
                            <td className="py-3 px-4">
                              <div className="d-flex align-items-center gap-3">
                                <div 
                                  style={{ 
                                    width: 42, height: 42, borderRadius: '50%', background: '#fee2e2', color: '#b91c1c',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem'
                                  }}
                                >
                                  {(u.first_name?.[0] || u.username?.[0] || 'U').toUpperCase()}
                                </div>
                                <div>
                                  <div className="fw-bold text-dark" style={{ fontSize: '0.92rem' }}>
                                    {u.first_name || u.last_name ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : u.username}
                                  </div>
                                  <div className="text-muted small">@{u.username}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="small text-dark fw-semibold d-flex align-items-center gap-1">
                                <IoMailOutline size={13} className="text-muted" /> {u.email}
                              </div>
                              {u.phone && (
                                <div className="small text-muted d-flex align-items-center gap-1 mt-1">
                                  <IoCallOutline size={13} /> {u.phone}
                                </div>
                              )}
                            </td>
                            <td>
                              {u.is_verified ? (
                                <span className="badge bg-success-subtle text-success px-3 py-2 d-inline-flex align-items-center gap-1" style={{ borderRadius: 8 }}>
                                  <IoCheckmarkCircleOutline size={15} /> Verified Email
                                </span>
                              ) : (
                                <span className="badge bg-warning-subtle text-warning px-3 py-2 d-inline-flex align-items-center gap-1" style={{ borderRadius: 8 }}>
                                  <IoTimeOutline size={15} /> Pending Verification
                                </span>
                              )}
                            </td>
                            <td className="small text-muted">
                              {new Date(u.date_joined).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="py-3 px-4 text-end">
                              <div className="d-flex justify-content-end gap-2">
                                <button onClick={() => setSelectedUser(u)} className="btn btn-light btn-sm px-2 py-1 text-secondary" title="Inspect User Details">
                                  <IoEyeOutline size={18} />
                                </button>
                                <button onClick={() => handleToggleUserVerification(u)} disabled={actionLoading} className={`btn btn-sm px-2 py-1 ${u.is_verified ? 'btn-outline-warning' : 'btn-outline-success'}`} title={u.is_verified ? "Unverify User Email" : "Verify Email Now"}>
                                  <IoCheckmarkCircleOutline size={18} />
                                </button>
                                <button onClick={() => setUserToDelete(u)} disabled={actionLoading} className="btn btn-outline-danger btn-sm px-2 py-1" title="Delete User Account">
                                  <IoTrashOutline size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ================= HOSPITALS & BLOOD BANKS SECTION ================= */}
          {activeTab === 'FACILITIES' && (
            <>
              {/* Alert Banner for Pending Approval Facilities */}
              {facilities.filter(f => !f.is_verified).length > 0 && (
                <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: 16, background: '#fffbeb', borderLeft: '6px solid #f59e0b' }}>
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-2 rounded-circle bg-warning bg-opacity-25 text-warning-emphasis">
                        <IoAlertCircleOutline size={30} />
                      </div>
                      <div>
                        <h6 className="fw-bold mb-1 text-warning-emphasis">
                          🔔 Pending Registration Alerts ({facilities.filter(f => !f.is_verified).length})
                        </h6>
                        <p className="small mb-0 text-secondary">
                          {facilities.filter(f => !f.is_verified).length} new facility registration request(s) are awaiting your verification & approval.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setFacilityTypeFilter('ALL'); setLoadingFacilities(true); fetchFacilities('ALL'); }}
                      className="btn btn-warning fw-bold px-4 py-2 rounded-3 text-nowrap shadow-sm"
                    >
                      Review & Approve Facilities →
                    </button>
                  </div>
                </div>
              )}

              {/* Facility Metrics & Add Button */}
              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div className="row g-3 flex-grow-1 mb-0">
                  <div className="col-md-4">
                    <div className="card border-0 shadow-sm p-3 text-center" style={{ borderRadius: 14, background: '#f8fafc' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b' }}>{totalFacilities}</div>
                      <div className="small text-muted fw-semibold">Total Facilities</div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border-0 shadow-sm p-3 text-center" style={{ borderRadius: 14, background: '#e0f2fe' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0369a1' }}>{totalHospitals}</div>
                      <div className="small fw-semibold" style={{ color: '#0284c7' }}>🏥 Hospitals</div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border-0 shadow-sm p-3 text-center" style={{ borderRadius: 14, background: '#ffe4e6' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#be123c' }}>{totalBloodBanks}</div>
                      <div className="small fw-semibold" style={{ color: '#e11d48' }}>🩸 Blood Banks</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Facility Search & Add Bar */}
              <div className="card border-0 shadow-sm p-3 mb-4" style={{ borderRadius: 16 }}>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                  <div className="d-flex gap-2">
                    {[
                      { id: 'ALL', label: 'All Facilities' },
                      { id: 'HOSPITAL', label: '🏥 Hospitals' },
                      { id: 'BLOOD_BANK', label: '🩸 Blood Banks' }
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => { 
                          setFacilityTypeFilter(f.id); 
                          setLoadingFacilities(true); 
                          fetchFacilities(f.id);
                        }}
                        className={`btn btn-sm px-3 rounded-pill fw-bold ${facilityTypeFilter === f.id ? 'btn-red' : 'btn-light text-muted'}`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="d-flex gap-2 flex-grow-1" style={{ maxWidth: 450 }}>
                    <form onSubmit={handleFacilitySearchSubmit} className="input-group input-group-sm">
                      <span className="input-group-text bg-white border-end-0">
                        <IoSearchOutline color="#94a3b8" />
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0 ps-0"
                        placeholder="Search facility name or city..."
                        value={facilitySearchQuery}
                        onChange={(e) => setFacilitySearchQuery(e.target.value)}
                      />
                      <button type="submit" className="btn btn-red px-3">Search</button>
                    </form>
                    <button
                      onClick={() => setShowAddFacilityModal(true)}
                      className="btn btn-red btn-sm fw-bold px-3 d-flex align-items-center gap-1 text-nowrap"
                      style={{ borderRadius: 10 }}
                    >
                      <IoAddCircleOutline size={18} />
                      Register Facility
                    </button>
                  </div>
                </div>
              </div>

              {/* Facilities Table */}
              {loadingFacilities ? (
                <Loader fullPage={false} message="Loading hospitals and blood banks..." />
              ) : facilities.length === 0 ? (
                <div className="card border-0 shadow-sm p-5 text-center" style={{ borderRadius: 16 }}>
                  <IoBusinessOutline size={48} className="mx-auto text-muted mb-3" />
                  <h5 className="fw-bold">No Facilities Found</h5>
                  <p className="text-muted small">No hospital or blood bank matched your current filter.</p>
                </div>
              ) : (
                <div className="card border-0 shadow-sm overflow-hidden" style={{ borderRadius: 16 }}>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead style={{ background: '#f8fafc', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <tr>
                          <th className="py-3 px-4">Facility Name</th>
                          <th className="py-3">Type</th>
                          <th className="py-3">Status</th>
                          <th className="py-3">City & Address</th>
                          <th className="py-3">Helpline</th>
                          <th className="py-3">Total Stock</th>
                          <th className="py-3 px-4 text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {facilities.map(f => (
                          <tr key={f.id}>
                            <td className="py-3 px-4">
                              <div className="fw-bold text-dark" style={{ fontSize: '0.92rem' }}>{f.name}</div>
                              {f.license_number && <div className="text-muted small">Lic: {f.license_number}</div>}
                            </td>
                            <td>
                              <span 
                                className="badge px-3 py-1 fw-bold"
                                style={{
                                  borderRadius: 6,
                                  background: f.facility_type === 'BLOOD_BANK' ? '#ffe4e6' : '#e0f2fe',
                                  color: f.facility_type === 'BLOOD_BANK' ? '#be123c' : '#0369a1',
                                  fontSize: '0.75rem'
                                }}
                              >
                                {f.facility_type === 'BLOOD_BANK' ? '🩸 BLOOD BANK' : '🏥 HOSPITAL'}
                              </span>
                            </td>
                            <td>
                              {f.is_verified ? (
                                <span className="badge bg-success-subtle text-success px-3 py-2 d-inline-flex align-items-center gap-1" style={{ borderRadius: 8 }}>
                                  <IoCheckmarkCircleOutline size={15} /> Approved
                                </span>
                              ) : (
                                <span className="badge bg-warning-subtle text-warning px-3 py-2 d-inline-flex align-items-center gap-1" style={{ borderRadius: 8 }}>
                                  <IoTimeOutline size={15} /> Pending Approval
                                </span>
                              )}
                            </td>
                            <td>
                              <div className="small fw-semibold text-dark">{f.city}</div>
                              <div className="small text-muted" style={{ maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {f.address}
                              </div>
                            </td>
                            <td>
                              <div className="small fw-bold text-danger d-flex align-items-center gap-1">
                                <IoCallOutline size={14} /> {f.helpline_phone}
                              </div>
                            </td>
                            <td>
                              <span className="badge bg-danger-subtle text-danger px-3 py-2 fw-extrabold" style={{ borderRadius: 8 }}>
                                <IoWaterOutline size={14} /> {f.total_stock} Units
                              </span>
                            </td>
                            <td className="py-3 px-4 text-end">
                              <div className="d-flex justify-content-end gap-2">
                                <button
                                  onClick={() => setSelectedFacility(f)}
                                  className="btn btn-light btn-sm px-2 py-1 text-secondary"
                                  title="Inspect Facility & Stock"
                                >
                                  <IoEyeOutline size={18} />
                                </button>

                                <button
                                  onClick={() => handleApproveFacility(f)}
                                  disabled={actionLoading}
                                  className={`btn btn-sm px-2 py-1 ${f.is_verified ? 'btn-outline-warning' : 'btn-success fw-bold'}`}
                                  title={f.is_verified ? "Unverify Facility" : "Approve Facility Registration"}
                                >
                                  <IoCheckmarkCircleOutline size={18} /> {f.is_verified ? '' : 'Approve'}
                                </button>

                                <button
                                  onClick={() => handleDeleteFacility(f)}
                                  disabled={actionLoading}
                                  className="btn btn-outline-danger btn-sm px-2 py-1"
                                  title="Delete Facility"
                                >
                                  <IoTrashOutline size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ================= VOICE AI LOGS & ANALYTICS SECTION ================= */}
          {activeTab === 'VOICE_AI' && (
            <>
              <VoiceAnalyticsWidget />
            </>
          )}
        </div>
      </div>

      {/* Register New Facility Modal */}
      {showAddFacilityModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 20, overflow: 'hidden' }}>
              <div className="modal-header bg-danger text-white border-0 py-3 px-4">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <IoBusinessOutline /> Register New Hospital or Blood Bank
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddFacilityModal(false)}></button>
              </div>

              <form onSubmit={handleCreateFacility}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Facility Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. City LifeCare Hospital"
                        value={newFacility.name}
                        onChange={e => setNewFacility({ ...newFacility, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Facility Type</label>
                      <select
                        className="form-select"
                        value={newFacility.facility_type}
                        onChange={e => setNewFacility({ ...newFacility, facility_type: e.target.value })}
                      >
                        <option value="HOSPITAL">🏥 Hospital / Clinic</option>
                        <option value="BLOOD_BANK">🩸 Blood Bank</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">City</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Mumbai"
                        value={newFacility.city}
                        onChange={e => setNewFacility({ ...newFacility, city: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Helpline Phone Number</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="+91 98200 12345"
                        value={newFacility.helpline_phone}
                        onChange={e => setNewFacility({ ...newFacility, helpline_phone: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">License Number</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. HOSP-10492"
                        value={newFacility.license_number}
                        onChange={e => setNewFacility({ ...newFacility, license_number: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold small">Operating Hours</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="24/7 Emergency Open"
                        value={newFacility.operating_hours}
                        onChange={e => setNewFacility({ ...newFacility, operating_hours: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold small">Full Address</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        placeholder="Enter street, landmark, pincode..."
                        value={newFacility.address}
                        onChange={e => setNewFacility({ ...newFacility, address: e.target.value })}
                        required
                      ></textarea>
                    </div>
                  </div>

                  <hr className="my-4" />
                  <h6 className="fw-bold text-danger mb-3">🩸 Initial Blood Units Inventory (Stock)</h6>
                  <div className="row g-2">
                    {[
                      { label: 'O+ Units', field: 'stock_o_positive' },
                      { label: 'O- Units', field: 'stock_o_negative' },
                      { label: 'A+ Units', field: 'stock_a_positive' },
                      { label: 'A- Units', field: 'stock_a_negative' },
                      { label: 'B+ Units', field: 'stock_b_positive' },
                      { label: 'B- Units', field: 'stock_b_negative' },
                      { label: 'AB+ Units', field: 'stock_ab_positive' },
                      { label: 'AB- Units', field: 'stock_ab_negative' },
                    ].map(st => (
                      <div key={st.field} className="col-3 col-sm-3">
                        <div className="p-2 border rounded-3 bg-light text-center">
                          <label className="form-label mb-1 fw-bold small text-danger">{st.label}</label>
                          <input
                            type="number"
                            min="0"
                            className="form-control form-control-sm text-center fw-bold"
                            value={newFacility[st.field]}
                            onChange={e => setNewFacility({ ...newFacility, [st.field]: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="modal-footer border-0 p-3 bg-light">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddFacilityModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-danger btn-sm fw-bold px-4" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : '✅ Save & Register Facility'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Facility Inspection Modal */}
      {selectedFacility && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 20, overflow: 'hidden' }}>
              <div className="modal-header bg-danger text-white border-0 py-3 px-4">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <IoBusinessOutline /> Facility Details: {selectedFacility.name}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedFacility(null)}></button>
              </div>

              <div className="modal-body p-4">
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="text-muted small fw-semibold">Facility Type</div>
                      <div className="fw-bold text-dark">{selectedFacility.facility_type === 'BLOOD_BANK' ? '🩸 Regional Blood Bank' : '🏥 Hospital / Clinic'}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="text-muted small fw-semibold">Helpline Phone</div>
                      <div className="fw-bold text-danger">{selectedFacility.helpline_phone}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="text-muted small fw-semibold">City</div>
                      <div className="fw-bold text-dark">{selectedFacility.city}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="text-muted small fw-semibold">Operating Hours</div>
                      <div className="fw-bold text-dark">{selectedFacility.operating_hours}</div>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="text-muted small fw-semibold">Address</div>
                      <div className="fw-bold text-dark">{selectedFacility.address}</div>
                    </div>
                  </div>
                </div>

                <h6 className="fw-bold text-danger mb-3">🩸 Blood Stock Inventory Breakdown ({selectedFacility.total_stock} Total Units)</h6>
                <div className="row g-2">
                  {[
                    { bg: 'O+', count: selectedFacility.stock_o_positive },
                    { bg: 'O-', count: selectedFacility.stock_o_negative },
                    { bg: 'A+', count: selectedFacility.stock_a_positive },
                    { bg: 'A-', count: selectedFacility.stock_a_negative },
                    { bg: 'B+', count: selectedFacility.stock_b_positive },
                    { bg: 'B-', count: selectedFacility.stock_b_negative },
                    { bg: 'AB+', count: selectedFacility.stock_ab_positive },
                    { bg: 'AB-', count: selectedFacility.stock_ab_negative },
                  ].map(stock => (
                    <div key={stock.bg} className="col-3 col-sm-3">
                      <div className="p-2 text-center rounded-3 bg-danger-subtle border border-danger-subtle">
                        <div className="fw-bold text-danger small">{stock.bg}</div>
                        <div className="fw-extrabold text-danger fs-5">{stock.count} <span style={{ fontSize: '0.7rem' }}>units</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer border-0 p-3 bg-light">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedFacility(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 20, overflow: 'hidden' }}>
              <div className="modal-header bg-danger text-white border-0 py-3 px-4">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <IoPersonOutline /> User Inspection: {selectedUser.first_name || selectedUser.username} (@{selectedUser.username})
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedUser(null)}></button>
              </div>
              <div className="modal-body p-4">
                {/* Key Metrics Cards */}
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <div className="p-3 text-center rounded-3 bg-light border">
                      <div className="text-muted small fw-semibold">🌆 City / Location</div>
                      <div className="fw-bold fs-6 text-dark mt-1">
                        {selectedUser.city || selectedUser.donor_profile?.city || selectedUser.receiver_profile?.city || 'Not Specified'}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 text-center rounded-3 bg-danger-subtle border border-danger-subtle">
                      <div className="text-danger small fw-semibold">🩸 Total Donated Times</div>
                      <div className="fw-extrabold fs-4 text-danger mt-1">
                        {selectedUser.donation_count ?? selectedUser.donor_profile?.donation_count ?? 0} <span className="fs-6 fw-normal">times</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 text-center rounded-3 bg-primary-subtle border border-primary-subtle">
                      <div className="text-primary small fw-semibold">📩 Received Requests</div>
                      <div className="fw-extrabold fs-4 text-primary mt-1">
                        {selectedUser.received_requests_count ?? 0} <span className="fs-6 fw-normal">requests</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="text-muted small fw-semibold">Email Address</div>
                      <div className="fw-bold text-dark">{selectedUser.email}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="text-muted small fw-semibold">Contact Phone</div>
                      <div className="fw-bold text-dark">{selectedUser.phone || 'Not provided'}</div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="text-muted small fw-semibold">Blood Group</div>
                      <div className="fw-bold text-danger">
                        {selectedUser.blood_group || selectedUser.donor_profile?.blood_group || selectedUser.receiver_profile?.blood_group_needed || 'N/A'}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="text-muted small fw-semibold">Verification Status</div>
                      <div className={`fw-bold ${selectedUser.is_verified ? 'text-success' : 'text-warning'}`}>
                        {selectedUser.is_verified ? '✅ Email Verified & Active' : '⏳ Pending Email Verification'}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="text-muted small fw-semibold">Account Role</div>
                      <div className="fw-bold text-dark">
                        {selectedUser.role === 'DONOR' ? '🩸 Donor' : selectedUser.role === 'RECEIVER' ? '🏥 Receiver' : selectedUser.role}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="text-muted small fw-semibold">Joined Date</div>
                      <div className="fw-bold text-dark">
                        {new Date(selectedUser.date_joined).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 p-3 bg-light">
                <button type="button" onClick={() => handleToggleUserVerification(selectedUser)} className={`btn btn-sm ${selectedUser.is_verified ? 'btn-warning' : 'btn-success'}`}>
                  {selectedUser.is_verified ? 'Unverify Email' : '✅ Verify Email Now'}
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedUser(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 16 }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-danger">Delete User Account</h5>
                <button type="button" className="btn-close" onClick={() => setUserToDelete(null)}></button>
              </div>
              <div className="modal-body py-4">
                <p className="mb-1">Are you sure you want to delete the user account for <strong>{userToDelete.username}</strong> ({userToDelete.email})?</p>
                <p className="text-danger small mb-0 fw-semibold">This action is permanent and cannot be undone.</p>
              </div>
              <div className="modal-footer border-0">
                <button type="button" className="btn btn-light" onClick={() => setUserToDelete(null)}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={handleDeleteUser} disabled={actionLoading}>
                  {actionLoading ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Camp Modal */}
      {showAddCampModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 20, overflow: 'hidden' }}>
              <div className="modal-header bg-danger text-white border-0 py-3 px-4">
                <h5 className="modal-title fw-bold">➕ Create Blood Donation Camp</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddCampModal(false)}></button>
              </div>
              <form onSubmit={handleCreateCamp}>
                <div className="modal-body p-4">
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
                  <div className="mb-3">
                    <label className="form-label small fw-bold">Camp Location / Address</label>
                    <input
                      type="text"
                      className="form-control"
                      value={campForm.location}
                      onChange={(e) => setCampForm(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="e.g. Community Hall, MG Road, Mumbai"
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer border-0 p-3 bg-light">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddCampModal(false)}>Cancel</button>
                  <button type="submit" disabled={actionLoading} className="btn btn-danger btn-sm fw-bold px-4">
                    {actionLoading ? 'Creating...' : 'Create Camp'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
