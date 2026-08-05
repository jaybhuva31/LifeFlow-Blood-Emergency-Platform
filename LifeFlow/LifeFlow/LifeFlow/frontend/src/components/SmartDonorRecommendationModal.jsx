import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Toast from './Toast';
import Loader from './Loader';
import { 
  IoRibbon, 
  IoFlame, 
  IoLocationOutline, 
  IoTimeOutline, 
  IoShieldCheckmark, 
  IoCallOutline, 
  IoCheckmarkCircle, 
  IoSend,
  IoClose
} from 'react-icons/io5';

const SmartDonorRecommendationModal = ({ requestId, isOpen, onClose }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [requestMeta, setRequestMeta] = useState(null);

  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('success');

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const payload = requestId ? { request_id: requestId } : {};
      const response = await api.post('requests/emergency/recommend-donors/', payload);
      setRecommendations(response.data.recommended_donors || []);
      setRequestMeta({
        blood_group: response.data.blood_group,
        hospital_name: response.data.hospital_name,
        city: response.data.city
      });
    } catch (err) {
      console.error("Failed to load AI donor recommendations:", err);
      setToastType('danger');
      setToastMessage(err.response?.data?.detail || "Failed to load AI donor recommendations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRecommendations();
    }
  }, [isOpen, requestId]);

  const handleBatchNotify = async (batchSize = 5) => {
    setNotifyLoading(true);
    try {
      const res = await api.post('requests/emergency/batch-notify/', { request_id: requestId, batch_size: batchSize });
      setToastType('success');
      setToastMessage(res.data.message || `Successfully alerted top ${batchSize} AI recommended donors!`);
    } catch (err) {
      setToastType('danger');
      setToastMessage(err.response?.data?.detail || "Failed to send batch alerts.");
    } finally {
      setNotifyLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-custom" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, padding: 16
    }}>
      <div style={{
        background: '#121826', borderRadius: 20, width: '100%', maxWidth: 720,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {toastMessage && (
          <div className="toast-container-custom">
            <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
          </div>
        )}

        {/* Modal Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(90deg, #d32f2f, #b71c1c)', color: '#fff',
              fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', borderRadius: 50,
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6
            }}>
              🤖 AI Recommendation Engine
            </div>
            <h4 style={{ color: '#fff', fontWeight: 800, margin: 0, fontSize: '1.2rem' }}>
              Top Recommended Donors
            </h4>
            {requestMeta && (
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', margin: '4px 0 0' }}>
                Group {requestMeta.blood_group} · {requestMeta.hospital_name} ({requestMeta.city})
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff',
              width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer'
            }}
          >
            <IoClose size={20} />
          </button>
        </div>

        {/* Modal Content Body */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Loader />
              <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: 16, fontWeight: 600, fontSize: '0.9rem' }}>
                🤖 AI is scoring & ranking compatible donors...
              </p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem' }}>
                Evaluating Haversine distance, historical trust scores, response speeds & eligibility.
              </p>
            </div>
          ) : recommendations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <IoShieldCheckmark size={48} color="rgba(255,255,255,0.3)" />
              <h6 style={{ color: '#fff', marginTop: 12 }}>No Matching Donors Available</h6>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                No active compatible donors were found in your region right now.
              </p>
            </div>
          ) : (
            <div>
              {/* Batch Action Bar */}
              <div style={{
                background: 'rgba(211, 47, 47, 0.12)', border: '1px solid rgba(211, 47, 47, 0.3)',
                borderRadius: 12, padding: '14px 18px', marginBottom: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12
              }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem' }}>
                    ⚡ Progressive Batch Dispatch
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem' }}>
                    Send high-priority alerts to the top AI recommended donors first.
                  </div>
                </div>
                <button
                  onClick={() => handleBatchNotify(5)}
                  disabled={notifyLoading}
                  style={{
                    background: '#d32f2f', color: '#fff', border: 'none',
                    padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: '0.82rem',
                    display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'
                  }}
                >
                  <IoSend size={14} />
                  {notifyLoading ? 'Alerting...' : 'Alert Top 5 Best Matches'}
                </button>
              </div>

              {/* Ranked Donor List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {recommendations.map((donor) => {
                  const isTopMatch = donor.ranking === 1;
                  return (
                    <div 
                      key={donor.donor_id}
                      style={{
                        background: isTopMatch ? 'linear-gradient(135deg, rgba(211,47,47,0.15), rgba(20,27,45,0.9))' : 'rgba(255,255,255,0.04)',
                        border: isTopMatch ? '1px solid #d32f2f' : '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 14, padding: 18, position: 'relative',
                        boxShadow: isTopMatch ? '0 10px 25px -5px rgba(211,47,47,0.3)' : 'none'
                      }}
                    >
                      {/* Top Match Badge */}
                      {isTopMatch && (
                        <div style={{
                          position: 'absolute', top: -12, right: 20,
                          background: 'linear-gradient(90deg, #ff9800, #f57c00)', color: '#fff',
                          padding: '3px 12px', borderRadius: 50, fontWeight: 900,
                          fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em',
                          boxShadow: '0 4px 10px rgba(245,124,0,0.4)', display: 'flex', alignItems: 'center', gap: 4
                        }}>
                          <IoRibbon size={14} /> AI Best Match #1
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                        {/* Donor Info */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{
                              background: 'rgba(255,255,255,0.1)', color: '#fff',
                              width: 24, height: 24, borderRadius: '50%', display: 'inline-flex',
                              alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem'
                            }}>
                              #{donor.ranking}
                            </span>
                            <h6 style={{ color: '#fff', fontWeight: 800, margin: 0, fontSize: '1.05rem' }}>
                              {donor.name}
                            </h6>
                            {donor.is_exact_match ? (
                              <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '0.68rem', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                                Exact {donor.blood_group}
                              </span>
                            ) : (
                              <span style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', fontSize: '0.68rem', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                                Compatible {donor.blood_group}
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 10, color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <IoLocationOutline size={14} color="#f59e0b" /> {donor.distance} ({donor.city})
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <IoTimeOutline size={14} color="#3b82f6" /> ETA: {donor.estimated_arrival_time}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <IoShieldCheckmark size={14} color="#10b981" /> Trust Score: {donor.trust_score}/100
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <IoCheckmarkCircle size={14} color="#a855f7" /> {donor.donation_count} Donations
                            </span>
                          </div>
                        </div>

                        {/* Recommendation Score Meter */}
                        <div style={{ textAlign: 'right', minWidth: 100 }}>
                          <div style={{
                            fontSize: '1.4rem', fontWeight: 900,
                            color: donor.recommendation_score >= 85 ? '#10b981' : (donor.recommendation_score >= 70 ? '#f59e0b' : '#3b82f6')
                          }}>
                            {donor.recommendation_score}%
                          </div>
                          <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase' }}>
                            AI Match Score
                          </div>
                          <div style={{
                            fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', marginTop: 4, fontWeight: 600
                          }}>
                            {(donor.acceptance_probability * 100).toFixed(1)}% Prob.
                          </div>
                        </div>
                      </div>

                      {/* Score Progress Bar */}
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, marginTop: 14, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${donor.recommendation_score}%`,
                          background: donor.recommendation_score >= 85
                            ? 'linear-gradient(90deg, #10b981, #059669)'
                            : (donor.recommendation_score >= 70 ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'linear-gradient(90deg, #3b82f6, #2563eb)')
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            className="btn btn-outline-secondary btn-sm"
            style={{ borderRadius: 8, padding: '6px 18px' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartDonorRecommendationModal;
