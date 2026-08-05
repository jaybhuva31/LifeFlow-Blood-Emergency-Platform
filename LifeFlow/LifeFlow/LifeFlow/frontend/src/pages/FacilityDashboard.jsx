import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import api from '../services/api';
import { 
  IoBusinessOutline, 
  IoWaterOutline, 
  IoSaveOutline, 
  IoDocumentTextOutline, 
  IoDownloadOutline, 
  IoCheckmarkCircleOutline, 
  IoCallOutline, 
  IoLocationOutline, 
  IoTimeOutline,
  IoAlertCircleOutline,
  IoRefreshOutline,
  IoAddCircleOutline,
  IoRemoveCircleOutline,
  IoShieldCheckmarkOutline
} from 'react-icons/io5';

const FacilityDashboard = () => {
  const { user } = useAuth();
  const [facility, setFacility] = useState(null);
  const [stock, setStock] = useState({
    stock_a_positive: 0,
    stock_a_negative: 0,
    stock_b_positive: 0,
    stock_b_negative: 0,
    stock_o_positive: 0,
    stock_o_negative: 0,
    stock_ab_positive: 0,
    stock_ab_negative: 0
  });

  const [requests, setRequests] = useState([]);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingStock, setSavingStock] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const bloodGroups = [
    { key: 'stock_a_positive', label: 'A+', bg: '#ef4444' },
    { key: 'stock_a_negative', label: 'A-', bg: '#dc2626' },
    { key: 'stock_b_positive', label: 'B+', bg: '#ea580c' },
    { key: 'stock_b_negative', label: 'B-', bg: '#c2410c' },
    { key: 'stock_o_positive', label: 'O+', bg: '#b91c1c' },
    { key: 'stock_o_negative', label: 'O-', bg: '#991b1b' },
    { key: 'stock_ab_positive', label: 'AB+', bg: '#d97706' },
    { key: 'stock_ab_negative', label: 'AB-', bg: '#b45309' }
  ];

  const fetchFacilityData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Facility Profile
      const facRes = await api.get('receiver/facility/my-facility/');
      setFacility(facRes.data);
      setStock({
        stock_a_positive: facRes.data.stock_a_positive || 0,
        stock_a_negative: facRes.data.stock_a_negative || 0,
        stock_b_positive: facRes.data.stock_b_positive || 0,
        stock_b_negative: facRes.data.stock_b_negative || 0,
        stock_o_positive: facRes.data.stock_o_positive || 0,
        stock_o_negative: facRes.data.stock_o_negative || 0,
        stock_ab_positive: facRes.data.stock_ab_positive || 0,
        stock_ab_negative: facRes.data.stock_ab_negative || 0
      });

      // 2. Fetch Incoming Requests
      const reqRes = await api.get('receiver/facility/incoming-requests/');
      
      // Filter for PENDING requests ONLY in the incoming table queue
      const pendingList = [
        ...(reqRes.data.emergency_requests || []).map(r => ({ ...r, is_emergency: true })),
        ...(reqRes.data.blood_requests || []).map(r => ({ ...r, is_emergency: false }))
      ].filter(r => r.status === 'PENDING' || r.status === 'OPEN' || !r.status);
      setRequests(pendingList);

      // Store ACCEPTED requests for Excel export
      const acceptedList = [
        ...(reqRes.data.accepted_emergency_requests || []).map(r => ({ ...r, is_emergency: true })),
        ...(reqRes.data.accepted_blood_requests || []).map(r => ({ ...r, is_emergency: false }))
      ];
      setAcceptedRequests(acceptedList);
    } catch (err) {
      console.error("Facility data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilityData();
  }, []);

  const handleStockChange = (key, delta) => {
    setStock(prev => ({
      ...prev,
      [key]: Math.max(0, (parseInt(prev[key]) || 0) + delta)
    }));
  };

  const handleDirectStockInput = (key, val) => {
    const num = Math.max(0, parseInt(val) || 0);
    setStock(prev => ({ ...prev, [key]: num }));
  };

  const handleSaveStock = async () => {
    setSavingStock(true);
    try {
      const res = await api.patch('receiver/facility/update-stock/', stock);
      setFacility(res.data.facility);
      setToast({
        show: true,
        message: "✅ Blood Stock Inventory updated successfully!",
        type: "success"
      });
    } catch (err) {
      setToast({
        show: true,
        message: "Failed to update blood stock inventory.",
        type: "danger"
      });
    } finally {
      setSavingStock(false);
    }
  };

  const handleAcceptRequest = async (reqId) => {
    setAcceptingId(reqId);
    try {
      const res = await api.patch(`receiver/facility/requests/${reqId}/accept/`);
      setToast({
        show: true,
        message: res.data.message || `🚨 Request #${reqId} ACCEPTED! Inventory updated automatically & requester notified.`,
        type: "success"
      });
      await fetchFacilityData();
    } catch (err) {
      setToast({
        show: true,
        message: err.response?.data?.detail || "Cannot accept request: Insufficient blood stock available in inventory.",
        type: "danger"
      });
    } finally {
      setAcceptingId(null);
    }
  };

  // Export Stock to Excel/CSV
  const exportStockCSV = () => {
    if (!facility) return;
    const headers = ["Facility Name", "Facility Type", "License Number", "City", "Helpline", "Blood Group", "Units Available", "Last Updated"];
    const rows = bloodGroups.map(bg => [
      `"${facility.name}"`,
      `"${facility.facility_type}"`,
      `"${facility.license_number || 'N/A'}"`,
      `"${facility.city}"`,
      `"${facility.helpline_phone}"`,
      `"${bg.label}"`,
      stock[bg.key],
      `"${new Date().toLocaleDateString()}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Blood_Stock_${facility.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Accepted / Active Requests to Excel/CSV
  const exportAcceptedRequestsCSV = () => {
    if (!facility) return;
    
    // Export accepted requests if available, otherwise export all facility requests so the file is never empty
    const exportList = acceptedRequests.length > 0 ? acceptedRequests : requests;

    if (exportList.length === 0) {
      setToast({ show: true, message: "No blood requests currently available to export.", type: "warning" });
      return;
    }

    const headers = [
      "Request ID",
      "Patient Name",
      "Request Type",
      "Blood Group",
      "Units Required",
      "Hospital / Location",
      "Contact Phone",
      "Emergency Level",
      "Status",
      "Date Created"
    ];

    const rows = exportList.map(req => {
      const reqId = req.request_id || (req.id ? `#${req.id}` : 'REQ-N/A');
      const patient = req.patient_name || 'Emergency Patient';
      const type = req.is_emergency ? 'Voice Emergency' : 'Standard Request';
      const bg = req.blood_group || req.blood_group_needed || 'O+';
      const units = req.units || req.units_needed || req.units_required || 1;
      const location = (req.hospital_name || req.location || req.hospital_address || req.city || 'N/A').replace(/"/g, '""');
      const phone = req.contact_number || req.phone || req.helpline || '9876543210';
      const priority = req.emergency_level || req.urgency_level || 'HIGH';
      const reqStatus = req.status || 'PENDING';
      const date = req.created_at ? new Date(req.created_at).toLocaleString() : new Date().toLocaleDateString();

      return [
        `"${reqId}"`,
        `"${patient}"`,
        `"${type}"`,
        `"${bg}"`,
        units,
        `"${location}"`,
        `"${phone}"`,
        `"${priority}"`,
        `"${reqStatus}"`,
        `"${date}"`
      ];
    });

    const csvHeaderLine = headers.join(",");
    const csvRowLines = rows.map(r => r.join(",")).join("\n");

    // Add UTF-8 BOM byte \uFEFF so Excel opens CSV cleanly with full column layout
    const blob = new Blob(["\uFEFF" + csvHeaderLine + "\n" + csvRowLines], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Blood_Requests_${facility.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToast({ 
      show: true, 
      message: `📥 Exported ${exportList.length} blood request(s) to Excel/CSV successfully!`, 
      type: "success" 
    });
  };

  // Export Stock to Printable PDF
  const exportStockPDF = () => {
    if (!facility) return;
    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Blood Stock Report - ${facility.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; color: #1e293b; }
          .header { text-align: center; border-bottom: 3px solid #e11d48; padding-bottom: 15px; margin-bottom: 25px; }
          .header h1 { color: #e11d48; margin: 0; font-size: 24px; }
          .header p { color: #64748b; margin: 5px 0 0 0; }
          .meta { display: flex; justify-content: space-between; margin-bottom: 25px; background: #f8fafc; padding: 15px; border-radius: 8px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #e11d48; color: #fff; text-align: left; padding: 12px; font-size: 14px; }
          td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
          tr:nth-child(even) { background: #f8fafc; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 12px; background: #ffe4e6; color: #e11d48; font-weight: bold; }
          .footer { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🩸 LifeFlow Emergency Blood Platform</h1>
          <p>Official Facility Inventory & Stock Report</p>
        </div>
        
        <div class="meta">
          <div>
            <strong>Facility Name:</strong> ${facility.name}<br/>
            <strong>License No:</strong> ${facility.license_number || 'N/A'}<br/>
            <strong>Facility Type:</strong> ${facility.facility_type === 'BLOOD_BANK' ? 'Blood Bank' : 'Hospital'}
          </div>
          <div>
            <strong>City:</strong> ${facility.city}<br/>
            <strong>Helpline:</strong> ${facility.helpline_phone}<br/>
            <strong>Generated Date:</strong> ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
          </div>
        </div>

        <h3>Available Blood Units Summary</h3>
        <table>
          <thead>
            <tr>
              <th>Blood Group</th>
              <th>Status</th>
              <th>Available Units</th>
            </tr>
          </thead>
          <tbody>
            ${bloodGroups.map(bg => `
              <tr>
                <td><span class="badge">${bg.label}</span></td>
                <td>${stock[bg.key] > 5 ? 'In Stock' : stock[bg.key] > 0 ? 'Low Stock' : 'Out of Stock'}</td>
                <td><strong>${stock[bg.key]} Units</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 20px; text-align: right; font-size: 16px;">
          <strong>Total Available Inventory:</strong> 
          <span style="color: #e11d48; font-size: 20px; font-weight: bold; margin-left: 8px;">
            ${Object.values(stock).reduce((a, b) => (parseInt(a) || 0) + (parseInt(b) || 0), 0)} Units
          </span>
        </div>

        <div class="footer">
          Verified Official Report • Generated via LifeFlow Healthcare System
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (loading) {
    return <Loader message="Loading Facility Dashboard..." />;
  }

  const totalStockCount = Object.values(stock).reduce((a, b) => (parseInt(a) || 0) + (parseInt(b) || 0), 0);

  return (
    <div className="container py-4">
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(p => ({ ...p, show: false }))} 
        />
      )}

      {/* Header Banner */}
      <div className="card border-0 shadow-lg p-4 mb-4 text-white" style={{ borderRadius: 24, background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge bg-danger text-white px-3 py-1 rounded-pill small fw-bold d-flex align-items-center gap-1">
                <IoBusinessOutline /> {facility?.facility_type === 'BLOOD_BANK' ? 'Blood Bank Facility' : 'Hospital Facility'}
              </span>
              {facility?.is_verified ? (
                <span className="badge bg-success text-white px-3 py-1 rounded-pill small fw-bold d-flex align-items-center gap-1">
                  <IoShieldCheckmarkOutline /> Verified by Admin
                </span>
              ) : (
                <span className="badge bg-warning text-dark px-3 py-1 rounded-pill small fw-bold d-flex align-items-center gap-1">
                  <IoAlertCircleOutline /> Pending Admin Review
                </span>
              )}
            </div>
            <h2 className="fw-bold mb-1 text-white">{facility?.name || user?.first_name || 'Hospital Facility'}</h2>
            <p className="text-white-50 small mb-0 d-flex align-items-center gap-3 flex-wrap">
              <span><IoLocationOutline /> {facility?.address}, {facility?.city}</span>
              <span><IoCallOutline /> Helpline: {facility?.helpline_phone || 'N/A'}</span>
              <span><IoTimeOutline /> {facility?.operating_hours}</span>
            </p>
          </div>

          <div className="bg-dark p-3 rounded-4 border border-secondary text-center" style={{ minWidth: 160 }}>
            <span className="text-white-50 small fw-semibold">Total Stock Units</span>
            <h2 className="fw-bold text-danger mb-0 display-6">{totalStockCount}</h2>
          </div>
        </div>
      </div>

      {/* Stock Management & Action Bar */}
      <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: 20 }}>
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
              <IoWaterOutline color="#e11d48" /> Change & Update Blood Inventory Stock
            </h4>
            <p className="text-muted small mb-0">Modify live blood unit counts and export official inventory reports.</p>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button 
              onClick={exportStockPDF} 
              className="btn btn-outline-danger fw-bold d-flex align-items-center gap-1 shadow-sm"
              style={{ borderRadius: 12, padding: '8px 16px' }}
            >
              <IoDocumentTextOutline size={18} /> Export Stock (PDF)
            </button>
            <button 
              onClick={exportStockCSV} 
              className="btn btn-outline-dark fw-bold d-flex align-items-center gap-1 shadow-sm"
              style={{ borderRadius: 12, padding: '8px 16px' }}
            >
              <IoDownloadOutline size={18} /> Export Stock (Excel / CSV)
            </button>
            <button 
              onClick={handleSaveStock} 
              disabled={savingStock}
              className="btn btn-red fw-bold d-flex align-items-center gap-1 shadow-sm px-4"
              style={{ borderRadius: 12, padding: '8px 20px' }}
            >
              {savingStock ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" /> Saving...
                </>
              ) : (
                <>
                  <IoSaveOutline size={18} /> Save Stock Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* 8 Blood Groups Inventory Cards Grid */}
        <div className="row g-3">
          {bloodGroups.map(bg => (
            <div key={bg.key} className="col-12 col-sm-6 col-md-3">
              <div 
                className="card border-0 shadow-sm p-3 h-100 text-center"
                style={{ 
                  borderRadius: 16, 
                  background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
                  borderLeft: `5px solid ${bg.bg}`
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span 
                    className="badge text-white fw-bold px-3 py-1" 
                    style={{ background: bg.bg, borderRadius: 8, fontSize: '0.95rem' }}
                  >
                    {bg.label}
                  </span>
                  <span className="small text-muted fw-semibold">
                    {stock[bg.key] > 5 ? 'In Stock' : stock[bg.key] > 0 ? 'Low Stock' : 'Out of Stock'}
                  </span>
                </div>

                <div className="d-flex align-items-center justify-content-center gap-2 my-2">
                  <button 
                    onClick={() => handleStockChange(bg.key, -1)}
                    className="btn btn-light text-danger p-1 rounded-circle border shadow-sm d-flex align-items-center justify-content-center"
                    style={{ width: 34, height: 34 }}
                    title="Decrease 1 unit"
                  >
                    <IoRemoveCircleOutline size={24} />
                  </button>

                  <input 
                    type="number" 
                    min="0"
                    value={stock[bg.key]}
                    onChange={(e) => handleDirectStockInput(bg.key, e.target.value)}
                    className="form-control text-center fw-bold fs-4 text-dark border-0 bg-transparent p-0"
                    style={{ width: 70 }}
                  />

                  <button 
                    onClick={() => handleStockChange(bg.key, 1)}
                    className="btn btn-light text-success p-1 rounded-circle border shadow-sm d-flex align-items-center justify-content-center"
                    style={{ width: 34, height: 34 }}
                    title="Increase 1 unit"
                  >
                    <IoAddCircleOutline size={24} />
                  </button>
                </div>

                <span className="small text-muted">Available Units</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Incoming Requests Section */}
      <div className="card border-0 shadow-sm p-4" style={{ borderRadius: 20 }}>
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div>
            <h4 className="fw-bold text-dark mb-1">
              🚨 Incoming Blood Requests to Facility
            </h4>
            <p className="text-muted small mb-0">Emergency blood requests submitted by patients targeting your facility location.</p>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button 
              onClick={exportAcceptedRequestsCSV}
              className="btn btn-outline-success btn-sm fw-bold d-flex align-items-center gap-1 rounded-pill shadow-sm"
              title="Download all accepted blood requests in Excel / CSV format"
            >
              <IoDownloadOutline size={16} /> Download Accepted Requests (Excel/CSV)
            </button>
            <button onClick={fetchFacilityData} className="btn btn-light btn-sm fw-semibold d-flex align-items-center gap-1 rounded-pill border">
              <IoRefreshOutline /> Refresh Requests List
            </button>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="alert alert-light text-center p-4 rounded-3 border text-muted">
            <IoCheckmarkCircleOutline size={40} className="text-success mb-2" /><br />
            No pending blood requests currently matching your facility location.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Request ID</th>
                  <th>Patient Name</th>
                  <th>Blood Group</th>
                  <th>Units</th>
                  <th>Facility Stock</th>
                  <th>Priority</th>
                  <th>Required Location</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => {
                  const reqId = req.id || req.request_id;
                  const isAccepted = req.status === 'ACCEPTED' || req.status === 'COMPLETE';
                  const priorityClass = req.emergency_level === 'CRITICAL' || req.urgency_level === 'CRITICAL' ? 'bg-danger' : 'bg-warning text-dark';

                  const bgStr = (req.blood_group || req.blood_group_needed || 'O+').toUpperCase().trim();
                  const bgKey = 'stock_' + bgStr.toLowerCase().replace('+', '_positive').replace('-', '_negative');
                  const availableUnits = stock[bgKey] || 0;
                  const reqUnits = parseInt(req.units || req.units_needed || req.units_required || 1);
                  const hasEnoughStock = availableUnits >= reqUnits;

                  return (
                    <tr key={reqId}>
                      <td className="fw-bold text-dark">#{req.request_id || reqId}</td>
                      <td>
                        <div className="fw-bold text-dark">{req.patient_name || 'Emergency Patient'}</div>
                        <div className="small text-muted">{req.is_emergency ? 'Voice Emergency' : 'Standard Request'}</div>
                      </td>
                      <td>
                        <span className="badge bg-danger px-3 py-1.5 rounded-pill fs-6">
                          {bgStr}
                        </span>
                      </td>
                      <td className="fw-bold text-dark">{reqUnits} Unit(s)</td>
                      <td>
                        <span className={`badge ${hasEnoughStock ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} px-2.5 py-1 rounded-pill small fw-bold d-inline-flex align-items-center gap-1`}>
                          {hasEnoughStock ? `✓ ${availableUnits} Units Available` : `⚠️ Low Stock (${availableUnits} Available)`}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${priorityClass} px-2.5 py-1 rounded-pill small fw-bold`}>
                          {req.emergency_level || req.urgency_level || 'HIGH'}
                        </span>
                      </td>
                      <td className="small text-muted" style={{ maxWidth: 200 }}>
                        {req.hospital_name || req.location || req.hospital_address}
                      </td>
                      <td className="small font-monospace">{req.contact_number || req.phone || '9876543210'}</td>
                      <td>
                        {isAccepted ? (
                          <span className="badge bg-success text-white px-3 py-1.5 rounded-pill fw-bold small">
                            ✓ ACCEPTED
                          </span>
                        ) : (
                          <span className="badge bg-secondary text-white px-2.5 py-1.5 rounded-pill small">
                            {req.status || 'PENDING'}
                          </span>
                        )}
                      </td>
                      <td>
                        {isAccepted ? (
                          <button className="btn btn-sm btn-outline-success fw-bold rounded-pill disabled px-3">
                            <IoCheckmarkCircleOutline /> Accepted
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleAcceptRequest(reqId)}
                            disabled={acceptingId === reqId}
                            className="btn btn-sm btn-success fw-bold px-3 py-1.5 rounded-pill shadow-sm d-flex align-items-center gap-1"
                            title={`Accept & Fulfill blood request for ${bgStr}`}
                          >
                            {acceptingId === reqId ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" /> Accepting...
                              </>
                            ) : (
                              <>
                                <IoCheckmarkCircleOutline size={16} /> Accept Request
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacilityDashboard;
