import React from 'react';
import { IoCheckmarkOutline, IoCarOutline, IoLocationOutline, IoTrophyOutline } from 'react-icons/io5';

const STEPS = [
  { key: 'SENT', label: 'Sent', icon: <IoCheckmarkOutline size={14} /> },
  { key: 'ON_THE_WAY', label: 'On Way', icon: <IoCarOutline size={14} /> },
  { key: 'ARRIVED', label: 'Arrived', icon: <IoLocationOutline size={14} /> },
  { key: 'COMPLETE', label: 'Complete', icon: <IoTrophyOutline size={14} /> },
];

const ORDER = ['SENT', 'ON_THE_WAY', 'ARRIVED', 'COMPLETE'];

const DonationStatusStepper = ({ currentStatus, onUpdateStatus, loading = false }) => {
  const currentIdx = ORDER.indexOf(currentStatus);

  return (
    <div>
      <div className="status-stepper">
        {STEPS.map((step, i) => {
          const isDone = i <= currentIdx;
          const isActive = i === currentIdx;
          return (
            <div
              key={step.key}
              className={`step-item ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
            >
              <div className="step-circle">
                {step.icon}
              </div>
              <span className="step-label">{step.label}</span>
            </div>
          );
        })}
      </div>

      {/* Action buttons — move to next step */}
      {currentIdx < STEPS.length - 1 && (
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
          <button
            className="btn btn-red btn-sm d-flex align-items-center gap-2"
            style={{ fontSize: '0.8rem', padding: '7px 18px', borderRadius: 8 }}
            disabled={loading}
            onClick={(event) => {
              event.stopPropagation();
              onUpdateStatus(STEPS[currentIdx + 1].key);
            }}
          >
            {loading ? 'Updating...' : `Mark as "${STEPS[currentIdx + 1].label}"`}
          </button>
        </div>
      )}

      {currentIdx === STEPS.length - 1 && (
        <div style={{
          textAlign: 'center', marginTop: 10,
          background: '#f0fdf4', border: '1px solid #86efac',
          borderRadius: 8, padding: '8px 16px', fontSize: '0.8rem', color: '#15803d', fontWeight: 600
        }}>
          🎉 Donation Complete! Thank you for saving a life.
        </div>
      )}
    </div>
  );
};

export default DonationStatusStepper;
