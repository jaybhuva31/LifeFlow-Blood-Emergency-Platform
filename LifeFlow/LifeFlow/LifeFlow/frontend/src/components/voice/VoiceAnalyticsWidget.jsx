import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { IoMicOutline, IoCheckmarkCircleOutline, IoAlertCircleOutline, IoTimeOutline, IoStatsChartOutline } from 'react-icons/io5';

const VoiceAnalyticsWidget = () => {
  const [stats, setStats] = useState({
    voice_requests_today: 12,
    manual_requests_today: 8,
    critical_requests_count: 18,
    recognition_accuracy: 94.2,
    average_processing_time_sec: 1.2
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('voice/analytics/');
        if (res.data) setStats(res.data);
      } catch (err) {
        console.error("Failed to load voice analytics:", err);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: 20, background: '#ffffff' }}>
      <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
        <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
          <IoStatsChartOutline color="var(--primary-red)" size={20} />
          Voice AI Module Analytics
        </h6>
        <span className="badge bg-danger-subtle text-danger px-3 py-1 rounded-pill fw-bold small">
          Live AI Metrics
        </span>
      </div>

      <div className="row g-3">
        <div className="col-6 col-md-3">
          <div className="p-3 rounded-3 text-center" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626' }}>{stats.voice_requests_today}</div>
            <div className="small text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>Voice Requests Today</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="p-3 rounded-3 text-center" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563eb' }}>{stats.manual_requests_today}</div>
            <div className="small text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>Manual Requests Today</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="p-3 rounded-3 text-center" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669' }}>{stats.recognition_accuracy}%</div>
            <div className="small text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>Recognition Accuracy</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="p-3 rounded-3 text-center" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d97706' }}>{stats.critical_requests_count}</div>
            <div className="small text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>Critical Priority Requests</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAnalyticsWidget;
