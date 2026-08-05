import React, { useState } from 'react';
import { IoCloseOutline, IoStarOutline, IoChatbubblesOutline } from 'react-icons/io5';
import api from '../services/api';
import Toast from './Toast';

const FeedbackModal = ({ donor, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setToast({ message: 'Please select a star rating.', type: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      await api.post('requests/emergency/feedback/', {
        response_id: donor.id,
        rating,
        comment,
      });
      setToast({ message: '⭐ Thank you for your feedback!', type: 'success' });
      setTimeout(() => {
        onSuccess && onSuccess(donor.id);
        onClose();
      }, 1200);
    } catch (err) {
      setToast({ message: err.response?.data?.detail || 'Failed to submit feedback.', type: 'danger' });
    } finally {
      setSubmitting(false);
    }
  };

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'];

  return (
    <>
      {toast && (
        <div className="toast-container-custom">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
      <div className="feedback-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="feedback-card">
          {/* Close */}
          <button onClick={onClose} style={{
            position: 'absolute', top: 16, right: 16,
            background: '#f1f5f9', border: 'none', borderRadius: '50%',
            width: 32, height: 32, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', color: '#64748b'
          }}>
            <IoCloseOutline size={18} />
          </button>

          {/* Donor avatar */}
          <div style={{
            width: 64, height: 64, borderRadius: 18, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, #e53935, #b71c1c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 800, color: '#fff',
            boxShadow: '0 6px 20px rgba(229,57,53,0.3)'
          }}>
            {donor.blood_group || '🩸'}
          </div>

          <h5 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 4 }}>Rate Your Donor</h5>
          <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: 24 }}>
            How was your experience with <strong>{donor.donor_name || donor.name}</strong>?
          </p>

          <form onSubmit={handleSubmit}>
            {/* Stars */}
            <div className="star-rating mb-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  type="button"
                  key={star}
                  className={`star-btn ${star <= (hovered || rating) ? 'filled' : ''}`}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  aria-label={`Rate ${star} star`}
                >
                  ★
                </button>
              ))}
            </div>
            {(hovered || rating) > 0 && (
              <p style={{ color: 'var(--primary-red)', fontWeight: 700, fontSize: '0.9rem', marginBottom: 16 }}>
                {ratingLabels[hovered || rating]}
              </p>
            )}

            {/* Comment */}
            <div style={{ marginBottom: 20 }}>
              <label className="form-label d-flex align-items-center gap-1">
                <IoChatbubblesOutline size={14} />
                Comment (optional)
              </label>
              <textarea
                className="form-control"
                rows={3}
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Share your experience with this donor..."
                style={{ resize: 'none' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-red w-100 d-flex align-items-center justify-content-center gap-2"
              disabled={submitting}
            >
              <IoStarOutline size={18} />
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default FeedbackModal;
