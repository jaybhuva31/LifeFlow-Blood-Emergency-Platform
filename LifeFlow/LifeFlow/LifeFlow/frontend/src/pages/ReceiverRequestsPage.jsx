import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import FeedbackModal from '../components/FeedbackModal';
import SmartDonorRecommendationModal from '../components/SmartDonorRecommendationModal';
import api from '../services/api';

const ReceiverRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackDonor, setFeedbackDonor] = useState(null);
  const [recommendModalOpen, setRecommendModalOpen] = useState(false);
  const [selectedReqId, setSelectedReqId] = useState(null);

  const load = async () => {
    try {
      const response = await api.get('requests/emergency/receiver-dashboard-data/');
      setRequests(response.data.my_requests);
      setDonors(response.data.accepted_donors);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="container py-4">
      {feedbackDonor && <FeedbackModal donor={feedbackDonor} onClose={() => setFeedbackDonor(null)} onSuccess={load} />}
      <SmartDonorRecommendationModal requestId={selectedReqId} isOpen={recommendModalOpen} onClose={() => setRecommendModalOpen(false)} />
      {loading ? <Loader fullPage message="Loading your requests..." /> : (
        <div className="row g-4">
          <div className="col-lg-3"><Sidebar /></div>
          <div className="col-lg-9">
            <div className="custom-card p-4 mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div>
                  <h4 className="fw-bold mb-1">My Requests</h4>
                  <p className="text-muted small mb-0">All emergency requests and donor progress in one place.</p>
                </div>
                <button
                  onClick={() => { setSelectedReqId(null); setRecommendModalOpen(true); }}
                  className="btn btn-outline-danger btn-sm fw-bold d-flex align-items-center gap-2"
                  style={{ borderRadius: 8 }}
                >
                  🤖 AI Donor Recommender
                </button>
              </div>
              {requests.length ? requests.map((request) => (
                <div key={request.id} className="border rounded-3 p-3 mb-3 bg-light">
                  <div className="d-flex justify-content-between gap-3 flex-wrap align-items-center">
                    <div><strong>{request.patient_name || 'Emergency patient'}</strong><div className="text-muted small">{request.hospital_name} · {request.blood_group} · {request.units} unit(s)</div></div>
                    <div className="d-flex align-items-center gap-2">
                      {request.status !== 'COMPLETE' && request.status !== 'COMPLETED' && (
                        <button
                          onClick={() => { setSelectedReqId(request.id); setRecommendModalOpen(true); }}
                          className="btn btn-outline-danger btn-sm fw-bold"
                          style={{ borderRadius: 6, fontSize: '0.75rem' }}
                        >
                          🤖 AI Recommendations
                        </button>
                      )}
                      <span className={`badge ${request.status === 'COMPLETE' ? 'bg-success' : request.status === 'PENDING' ? 'bg-warning text-dark' : 'bg-primary'}`}>{request.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              )) : <p className="text-muted mb-0">No emergency requests yet.</p>}
            </div>
            <div className="custom-card p-4">
              <h5 className="fw-bold mb-3">Donors Who Accepted</h5>
              {donors.length ? donors.map((donor) => (
                <div key={donor.id} className="border rounded-3 p-3 mb-3 d-flex justify-content-between align-items-center gap-3 flex-wrap">
                  <div><strong>{donor.donor_name}</strong><div className="text-muted small">{donor.donor_blood_group} · {donor.donor_city} · {donor.donor_phone}</div></div>
                  <div className="d-flex gap-2 align-items-center"><span className={`badge ${donor.donation_status === 'COMPLETE' ? 'bg-success' : 'bg-primary'}`}>{(donor.donation_status || 'SENT').replaceAll('_', ' ')}</span>{donor.donation_status === 'COMPLETE' && !donor.feedback_submitted && <button className="btn btn-sm btn-warning" onClick={() => setFeedbackDonor(donor)}>Rate Donor</button>}</div>
                </div>
              )) : <p className="text-muted mb-0">No donor has accepted a request yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiverRequestsPage;
