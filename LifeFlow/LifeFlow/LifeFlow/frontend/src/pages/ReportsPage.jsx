import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import Toast from '../components/Toast';
import api from '../services/api';
import { 
  BloodGroupPieChart, 
  MonthlyDonationBarChart, 
  RequestStatusDoughnutChart, 
  CityWiseDonationChart 
} from '../components/ChartComponents';
import { 
  IoStatsChartOutline, 
  IoDownloadOutline, 
  IoPrintOutline, 
  IoPeopleOutline, 
  IoWaterOutline, 
  IoCheckmarkDoneCircleOutline 
} from 'react-icons/io5';

const ReportsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  const fetchStats = async () => {
    try {
      const response = await api.get('reports/stats/');
      setStats(response.data);
    } catch (err) {
      setToastType('danger');
      setToastMessage("Failed to fetch reports statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Secure CSV downloader using Blob URLs and attaching JWT tokens
  const handleCsvExport = async (reportType) => {
    setExporting(true);
    setToastType('info');
    setToastMessage(`Generating ${reportType} CSV report...`);
    try {
      const response = await api.get(`reports/export/?report_type=${reportType}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `lifeflow_${reportType}_report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setToastType('success');
      setToastMessage("Report downloaded successfully.");
    } catch (err) {
      setToastType('danger');
      setToastMessage("Failed to download CSV report.");
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container py-4">
      {toastMessage && (
        <div className="toast-container-custom">
          <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
        </div>
      )}

      {loading ? (
        <Loader fullPage={true} message="Generating statistical layouts..." />
      ) : (
        <div className="row g-4 print-layout">
          {/* Sidebar (Hide when printing) */}
          <div className="col-lg-3 d-print-none">
            <Sidebar />
          </div>

          {/* Main Panel */}
          <div className="col-lg-9 col-print-12">
            <div className="custom-card p-4 mb-4">
              <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4 flex-wrap gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="text-danger">
                    <IoStatsChartOutline size={36} />
                  </div>
                  <div>
                    <h4 className="fw-bold mb-0">System Analytics & Reports</h4>
                    <p className="text-secondary small mb-0">Monitor network ratios, camps, and download logs</p>
                  </div>
                </div>

                {/* Print/Download Toolbar */}
                <div className="d-flex gap-2 d-print-none">
                  <button onClick={handlePrint} className="btn btn-outline-secondary d-flex align-items-center gap-2 rounded-3 py-2 fw-medium">
                    <IoPrintOutline />
                    Print PDF
                  </button>
                  <div className="dropdown">
                    <button className="btn btn-red dropdown-toggle d-flex align-items-center gap-2 rounded-3 py-2 fw-medium" type="button" id="exportDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                      <IoDownloadOutline />
                      Export Data
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2" aria-labelledby="exportDropdown">
                      <li>
                        <button className="dropdown-item py-2" onClick={() => handleCsvExport('requests')}>
                          Emergency Requests CSV
                        </button>
                      </li>
                      <li>
                        <button className="dropdown-item py-2" onClick={() => handleCsvExport('donations')}>
                          Completed Donations CSV
                        </button>
                      </li>
                      <li>
                        <button className="dropdown-item py-2" onClick={() => handleCsvExport('camps')}>
                          Donation Camps CSV
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Stats Counters Overview */}
              <div className="row g-3 mb-4">
                <div className="col-md-3 col-6">
                  <div className="p-3 bg-light rounded-3 text-center border">
                    <IoPeopleOutline className="text-danger mb-2" size={24} />
                    <h4 className="fw-bold mb-0">{stats.totals.total_users}</h4>
                    <span className="text-muted small uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>Total Users</span>
                  </div>
                </div>
                <div className="col-md-3 col-6">
                  <div className="p-3 bg-light rounded-3 text-center border">
                    <IoWaterOutline className="text-danger mb-2" size={24} />
                    <h4 className="fw-bold mb-0">{stats.totals.total_donors}</h4>
                    <span className="text-muted small uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>Total Donors</span>
                  </div>
                </div>
                <div className="col-md-3 col-6">
                  <div className="p-3 bg-light rounded-3 text-center border">
                    <IoCheckmarkDoneCircleOutline className="text-success mb-2" size={24} />
                    <h4 className="fw-bold mb-0">{stats.totals.completed_requests}</h4>
                    <span className="text-muted small uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>Completed</span>
                  </div>
                </div>
                <div className="col-md-3 col-6">
                  <div className="p-3 bg-light rounded-3 text-center border">
                    <IoStatsChartOutline className="text-warning mb-2" size={24} />
                    <h4 className="fw-bold mb-0">{stats.totals.pending_requests}</h4>
                    <span className="text-muted small uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>Pending</span>
                  </div>
                </div>
              </div>

              {/* Grid 1: Charts */}
              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <div className="p-3 border rounded-3 bg-white h-100">
                    <h6 className="fw-bold text-secondary mb-3 text-center">Donor Blood Group Distribution</h6>
                    <BloodGroupPieChart data={stats.blood_groups} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="p-3 border rounded-3 bg-white h-100">
                    <h6 className="fw-bold text-secondary mb-3 text-center">Request Outcome Ratios</h6>
                    <RequestStatusDoughnutChart data={stats.request_statuses} />
                  </div>
                </div>
              </div>

              {/* Grid 2: Charts */}
              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <div className="p-3 border rounded-3 bg-white h-100">
                    <h6 className="fw-bold text-secondary mb-3 text-center">Monthly Donation Frequency</h6>
                    <MonthlyDonationBarChart data={stats.monthly_donations} />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="p-3 border rounded-3 bg-white h-100">
                    <h6 className="fw-bold text-secondary mb-3 text-center">Donor Density By City</h6>
                    <CityWiseDonationChart data={stats.city_donations} />
                  </div>
                </div>
              </div>

              {/* Top Active Donors Table */}
              <div className="border rounded-3 p-3 bg-white">
                <h6 className="fw-bold text-dark mb-3 border-bottom pb-2">Top Active Donors (Honor Roll)</h6>
                {stats.top_donors.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 small">
                      <thead className="table-light">
                        <tr>
                          <th className="py-2 px-3">Donor Name</th>
                          <th className="py-2">Blood Group</th>
                          <th className="py-2">Home City</th>
                          <th className="py-2 px-3 text-end">Saves Logged</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.top_donors.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 fw-bold text-dark">{item.name}</td>
                            <td className="py-2 fw-semibold text-danger">{item.blood_group}</td>
                            <td className="py-2 text-muted">{item.city}</td>
                            <td className="py-2 px-3 text-end fw-bold text-success">{item.donations} Save(s)</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted small mb-0 text-center py-3">No donations completed yet. Complete requests to view rankings.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
