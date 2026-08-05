import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';
import api from '../services/api';
import { IoTimeOutline, IoDownloadOutline, IoStar, IoStarOutline } from 'react-icons/io5';

const DonationHistoryPage = () => {
  // States
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  
  // Feedback
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  const fetchHistory = async () => {
    try {
      const response = await api.get('donor/history/');
      setHistory(response.data);
    } catch (err) {
      setToastType('danger');
      setToastMessage("Failed to retrieve donor history logs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Filter criteria
  const filteredHistory = history.filter(item => {
    if (filterStatus === 'ALL') return true;
    return item.status === filterStatus;
  });

  const getStatusBadgeColor = (statusVal) => {
    switch (statusVal) {
      case 'COMPLETE':
      case 'COMPLETED': return 'success';
      case 'ON_THE_WAY':
      case 'ARRIVED': return 'info text-white';
      case 'SENT': return 'warning text-dark';
      default: return 'secondary';
    }
  };

  const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

  const downloadHistoryCsv = () => {
    if (!filteredHistory.length) return;

    const headers = [
      'Date', 'Patient', 'Hospital', 'Blood Group', 'Units',
      'Donation Status', 'Rating (out of 5)', 'Review Comment', 'Reviewed On'
    ];
    const rows = filteredHistory.map((item) => [
      item.date || '',
      item.patient_name || '',
      item.hospital || '',
      item.blood_group || '',
      item.units ?? '',
      item.status ? item.status.replaceAll('_', ' ') : '',
      item.rating ?? 'Not rated',
      item.review_comment || '',
      item.reviewed_at ? new Date(item.reviewed_at).toLocaleDateString() : ''
    ].map(escapeCsv).join(','));

    // UTF-8 BOM keeps names and review text readable in Excel.
    const csv = `\uFEFF${headers.map(escapeCsv).join(',')}\r\n${rows.join('\r\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `donation-history-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const ReviewStars = ({ rating }) => {
    if (!rating) return <span className="text-muted small">Not rated</span>;
    return (
      <span className="d-inline-flex align-items-center gap-1" aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => star <= rating
          ? <IoStar key={star} color="#f59e0b" size={16} />
          : <IoStarOutline key={star} color="#cbd5e1" size={16} />
        )}
      </span>
    );
  };

  return (
    <div className="container py-4">
      {toastMessage && (
        <div className="toast-container-custom">
          <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
        </div>
      )}

      {loading ? (
        <Loader fullPage={true} message="Fetching donor transaction logs..." />
      ) : (
        <div className="row g-4">
          {/* Sidebar */}
          <div className="col-lg-3">
            <Sidebar />
          </div>

          {/* Main List */}
          <div className="col-lg-9">
            <div className="custom-card p-4">
              <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4 flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="text-danger">
                    <IoTimeOutline size={36} />
                  </div>
                  <div>
                    <h4 className="fw-bold mb-0">My Donor History Logs</h4>
                    <p className="text-secondary small mb-0">Record of emergency blood donations and life-saves</p>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <select 
                    className="form-select form-select-sm"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="COMPLETE">Complete</option>
                    <option value="ARRIVED">Arrived at Hospital</option>
                    <option value="ON_THE_WAY">On the Way</option>
                    <option value="SENT">Accepted (Pending Arrival)</option>
                  </select>
                  <button
                    type="button"
                    onClick={downloadHistoryCsv}
                    className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1 fw-semibold"
                    disabled={!filteredHistory.length}
                    title="Download the displayed history as a CSV file"
                  >
                    <IoDownloadOutline size={16} /> Export CSV
                  </button>
                </div>
              </div>

              {filteredHistory.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3">Patient</th>
                        <th className="py-3">Hospital</th>
                        <th className="py-3">Blood Group</th>
                        <th className="py-3">Units</th>
                        <th className="py-3 text-center">Donation Status</th>
                        <th className="py-3 text-center">Review</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map((item) => (
                        <tr key={item.id}>
                          <td className="py-3 px-3 fw-bold text-dark">{item.date || 'Recent'}</td>
                          <td className="py-3 text-secondary">{item.patient_name}</td>
                          <td className="py-3 text-muted">{item.hospital}</td>
                          <td className="py-3 fw-semibold text-danger">{item.blood_group}</td>
                          <td className="py-3 fw-semibold">{item.units} unit(s)</td>
                          <td className="py-3 text-center">
                            <span className={`badge bg-${getStatusBadgeColor(item.status)} px-3 py-2 rounded-pill small fw-semibold`}>
                              {item.status ? item.status.replace('_', ' ') : 'COMPLETE'}
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            <ReviewStars rating={item.rating} />
                            {item.review_comment && (
                              <div className="text-muted small mt-1 text-truncate" style={{ maxWidth: 180 }} title={item.review_comment}>
                                {item.review_comment}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState 
                  message="No matching donor history logs found." 
                  subMessage="Accept emergency requests and complete blood donations to build your life-saving history log."
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationHistoryPage;
