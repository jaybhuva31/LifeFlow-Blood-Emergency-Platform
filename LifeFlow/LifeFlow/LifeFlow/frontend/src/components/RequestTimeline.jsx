import React from 'react';
import { 
  IoHourglassOutline, 
  IoCheckmarkCircleOutline, 
  IoBicycleOutline, 
  IoHeartOutline, 
  IoCloseCircleOutline 
} from 'react-icons/io5';

const RequestTimeline = ({ currentStatus }) => {
  const statuses = [
    { key: 'PENDING', label: 'Pending', icon: <IoHourglassOutline size={20} /> },
    { key: 'ACCEPTED', label: 'Accepted', icon: <IoCheckmarkCircleOutline size={20} /> },
    { key: 'DONOR_ON_THE_WAY', label: 'On The Way', icon: <IoBicycleOutline size={20} /> },
    { key: 'COMPLETED', label: 'Completed', icon: <IoHeartOutline size={20} /> },
  ];

  // If request is cancelled, render a distinct workflow line
  const isCancelled = currentStatus === 'CANCELLED';

  const getStepClass = (stepKey, index) => {
    if (isCancelled) {
      if (stepKey === 'PENDING') return 'completed bg-secondary text-white';
      return 'disabled text-muted';
    }

    const currentIdx = statuses.findIndex(s => s.key === currentStatus);
    if (currentIdx === -1) return 'disabled text-muted';

    if (index === currentIdx) {
      return 'active bg-danger text-white border-danger animate-pulse';
    }
    if (index < currentIdx) {
      return 'completed bg-success text-white border-success';
    }
    return 'disabled text-muted bg-light';
  };

  return (
    <div className="py-4">
      {isCancelled ? (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4 rounded-3 small">
          <IoCloseCircleOutline size={20} />
          <strong>Request Cancelled:</strong> This emergency request was marked as Cancelled.
        </div>
      ) : null}

      <div className="d-flex justify-content-between align-items-center position-relative px-3" style={{ minHeight: '80px' }}>
        {/* Connector Line */}
        <div 
          className="position-absolute top-50 start-0 w-100 bg-secondary bg-opacity-25" 
          style={{ height: '3px', transform: 'translateY(-50%)', zIndex: 0 }}
        />

        {/* Dynamic Stepper Points */}
        {statuses.map((step, idx) => (
          <div key={step.key} className="d-flex flex-column align-items-center position-relative" style={{ zIndex: 1, width: '20%' }}>
            <div 
              className={`rounded-circle d-flex align-items-center justify-content-center border border-2`} 
              style={{ width: '45px', height: '45px', transition: 'all 0.3s ease', backgroundColor: '#fff' }}
              className={getStepClass(step.key, idx) + ' rounded-circle d-flex align-items-center justify-content-center'}
            >
              {step.icon}
            </div>
            <span className="small mt-2 fw-semibold text-center text-truncate w-100" style={{ fontSize: '0.8rem' }}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RequestTimeline;
