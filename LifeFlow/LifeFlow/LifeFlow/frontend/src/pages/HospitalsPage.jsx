import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  IoBusinessOutline, 
  IoCallOutline, 
  IoLocationOutline, 
  IoTimeOutline, 
  IoSearchOutline, 
  IoWaterOutline, 
  IoCheckmarkCircleOutline,
  IoAlertCircleOutline,
  IoAddCircleOutline
} from 'react-icons/io5';

const HospitalsPage = () => {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedCity, setSelectedCity] = useState('');

  // Notifications
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  const fetchFacilities = async () => {
    try {
      let url = 'receiver/hospitals-blood-banks/';
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedType !== 'ALL') params.append('facility_type', selectedType);
      if (selectedCity) params.append('city', selectedCity);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await api.get(url);
      setFacilities(response.data);
    } catch (err) {
      setToastType('danger');
      setToastMessage("Failed to load hospitals and blood banks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, [selectedType, selectedCity]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    fetchFacilities();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedCity('');
    setSelectedType('ALL');
    setLoading(true);
    setTimeout(() => {
      fetchFacilities();
    }, 100);
  };

  return (
    <div className="container py-4">
      {toastMessage && (
        <div className="toast-container-custom">
          <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
        </div>
      )}

      {/* Hero Banner */}
      <div className="card border-0 shadow-sm p-4 p-md-5 mb-4 text-white position-relative overflow-hidden" style={{ borderRadius: 24, background: 'linear-gradient(135deg, #b91c1c, #e11d48)' }}>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 680 }}>
          <span className="badge bg-white text-danger fw-bold px-3 py-2 rounded-pill mb-3" style={{ fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            🏥 Verified Healthcare Directory
          </span>
          <h2 className="display-6 fw-bold mb-2">Hospitals & Blood Banks Directory</h2>
          <p className="lead mb-0 text-white-50" style={{ fontSize: '1rem' }}>
            Search verified hospitals, clinics, and regional blood storage banks. Check live blood unit inventory and contact emergency helplines directly.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card border-0 shadow-sm p-3 mb-4" style={{ borderRadius: 16 }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          {/* Facility Type Tabs */}
          <div className="d-flex gap-2 flex-wrap">
            {[
              { id: 'ALL', label: 'All Facilities' },
              { id: 'HOSPITAL', label: '🏥 Hospitals' },
              { id: 'BLOOD_BANK', label: '🩸 Blood Banks' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setSelectedType(tab.id); setLoading(true); }}
                className={`btn btn-sm px-3 rounded-pill fw-bold ${selectedType === tab.id ? 'btn-red' : 'btn-light text-muted'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="d-flex gap-2 flex-grow-1" style={{ maxWidth: 420 }}>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <IoSearchOutline color="#94a3b8" />
              </span>
              <input
                type="text"
                className="form-control border-start-0 ps-0"
                placeholder="Search facility name or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button type="button" onClick={handleClearSearch} className="btn btn-light text-muted">Clear</button>
              )}
              <button type="submit" className="btn btn-red px-3">Search</button>
            </div>
          </form>
        </div>
      </div>

      {/* Facility Grid */}
      {loading ? (
        <Loader fullPage={false} message="Loading hospitals and blood banks..." />
      ) : facilities.length === 0 ? (
        <div className="card border-0 shadow-sm p-5 text-center" style={{ borderRadius: 16 }}>
          <IoBusinessOutline size={54} className="mx-auto text-muted mb-3" />
          <h5 className="fw-bold">No Facilities Found</h5>
          <p className="text-muted small">No verified hospital or blood bank matched your current search filters.</p>
        </div>
      ) : (
        <div className="row g-4">
          {facilities.map(item => (
            <div key={item.id} className="col-lg-6">
              <div className="card border-0 shadow-sm h-100 p-4" style={{ borderRadius: 20, transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}>
                <div className="d-flex justify-content-between align-items-start mb-3 gap-2">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <span 
                        className="badge px-3 py-1 fw-bold"
                        style={{
                          borderRadius: 6,
                          background: item.facility_type === 'BLOOD_BANK' ? '#ffe4e6' : '#e0f2fe',
                          color: item.facility_type === 'BLOOD_BANK' ? '#be123c' : '#0369a1',
                          fontSize: '0.75rem'
                        }}
                      >
                        {item.facility_type === 'BLOOD_BANK' ? '🩸 BLOOD BANK' : '🏥 HOSPITAL'}
                      </span>
                      {item.is_verified && (
                        <span className="badge bg-success-subtle text-success px-2 py-1 d-inline-flex align-items-center gap-1" style={{ fontSize: '0.72rem' }}>
                          <IoCheckmarkCircleOutline size={14} /> Verified
                        </span>
                      )}
                    </div>
                    <h5 className="fw-bold text-dark mb-1" style={{ fontSize: '1.1rem' }}>{item.name}</h5>
                    <div className="text-muted small d-flex align-items-center gap-1">
                      <IoLocationOutline size={14} color="#e11d48" /> {item.address}
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-3 mb-3 p-3 rounded-3" style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <div className="small text-muted d-flex align-items-center gap-1">
                    <IoTimeOutline size={16} className="text-warning" />
                    <strong>Hours:</strong> {item.operating_hours}
                  </div>
                  {item.license_number && (
                    <div className="small text-muted ms-auto">
                      <strong>Lic:</strong> {item.license_number}
                    </div>
                  )}
                </div>

                {/* Blood Stock Inventory Grid */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small fw-bold text-uppercase text-secondary" style={{ letterSpacing: '0.05em', fontSize: '0.72rem' }}>
                      <IoWaterOutline color="#e11d48" /> Live Blood Inventory ({item.total_stock} Total Units)
                    </span>
                  </div>
                  <div className="row g-2">
                    {[
                      { bg: 'O+', count: item.stock_o_positive },
                      { bg: 'O-', count: item.stock_o_negative },
                      { bg: 'A+', count: item.stock_a_positive },
                      { bg: 'A-', count: item.stock_a_negative },
                      { bg: 'B+', count: item.stock_b_positive },
                      { bg: 'B-', count: item.stock_b_negative },
                      { bg: 'AB+', count: item.stock_ab_positive },
                      { bg: 'AB-', count: item.stock_ab_negative },
                    ].map(stock => (
                      <div key={stock.bg} className="col-3 col-sm-3">
                        <div 
                          className="p-2 text-center rounded-3"
                          style={{
                            background: stock.count > 0 ? '#fff1f2' : '#f8fafc',
                            border: stock.count > 0 ? '1px solid #fecaca' : '1px solid #e2e8f0'
                          }}
                        >
                          <div className="fw-bold" style={{ fontSize: '0.85rem', color: stock.count > 0 ? '#be123c' : '#94a3b8' }}>
                            {stock.bg}
                          </div>
                          <div className="fw-extrabold" style={{ fontSize: '1rem', color: stock.count > 0 ? '#991b1b' : '#cbd5e1' }}>
                            {stock.count} <span style={{ fontSize: '0.68rem', fontWeight: 600 }}>units</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-auto pt-2 d-flex gap-2 flex-wrap" style={{ borderTop: '1px solid #f1f5f9' }}>
                  <a
                    href={`tel:${item.helpline_phone}`}
                    className="btn btn-outline-secondary btn-sm py-2 px-3 fw-bold d-flex align-items-center justify-content-center gap-1 flex-grow-1"
                    style={{ borderRadius: 10 }}
                  >
                    <IoCallOutline size={16} />
                    Call Helpline ({item.helpline_phone})
                  </a>

                  {user?.role === 'RECEIVER' && (
                    <Link
                      to={`/receiver-dashboard?new-request=1&hospital=${encodeURIComponent(item.name)}&city=${encodeURIComponent(item.city || '')}`}
                      className="btn btn-red btn-sm py-2 px-3 fw-bold d-flex align-items-center justify-content-center gap-1 flex-grow-1 text-nowrap"
                      style={{ borderRadius: 10 }}
                    >
                      <IoAddCircleOutline size={16} />
                      Send Blood Request
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HospitalsPage;
