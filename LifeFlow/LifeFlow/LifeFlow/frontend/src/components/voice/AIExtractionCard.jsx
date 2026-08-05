import React from 'react';
import { 
  IoWaterOutline, 
  IoAlertCircleOutline, 
  IoBusinessOutline, 
  IoLocationOutline, 
  IoTimeOutline, 
  IoPersonOutline,
  IoCheckmarkCircleOutline,
  IoWarningOutline
} from 'react-icons/io5';

const PriorityBadge = ({ priority }) => {
  if (priority === 'CRITICAL') {
    return (
      <span className="badge bg-danger text-white px-3 py-1.5 fw-bold rounded-pill d-inline-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
        🔴 CRITICAL
      </span>
    );
  }
  if (priority === 'NORMAL') {
    return (
      <span className="badge bg-success text-white px-3 py-1.5 fw-bold rounded-pill d-inline-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
        🟢 NORMAL
      </span>
    );
  }
  return (
    <span className="badge bg-warning text-dark px-3 py-1.5 fw-bold rounded-pill d-inline-flex align-items-center gap-1" style={{ fontSize: '0.8rem' }}>
      🟠 HIGH
    </span>
  );
};

const ConfidenceBadge = ({ score }) => {
  const isLow = score < 80;
  return (
    <span 
      className={`badge ${isLow ? 'bg-warning-subtle text-warning-emphasis' : 'bg-success-subtle text-success'} px-2 py-0.5 rounded-pill fw-bold ms-1`}
      style={{ fontSize: '0.68rem' }}
    >
      {score}% {isLow && '⚠️ Review'}
    </span>
  );
};

const AIExtractionCard = ({ extraction, onChange }) => {
  if (!extraction) return null;

  const {
    extracted_blood_group,
    blood_group_detected,
    extracted_priority,
    extracted_hospital,
    extracted_city,
    extracted_landmark,
    extracted_relation,
    extracted_required_time,
    field_confidences = {}
  } = extraction;

  return (
    <div className="card border-0 shadow-sm p-4 mb-3" style={{ borderRadius: 20, background: '#ffffff', border: '1px solid #e2e8f0' }}>
      <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
        <h6 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
          <IoAlertCircleOutline color="var(--primary-red)" size={20} />
          AI Extracted Information
        </h6>
        <PriorityBadge priority={extracted_priority} />
      </div>

      {/* Blood Group Alert / Badge */}
      <div className="mb-3">
        <label className="form-label fw-semibold small text-secondary d-flex align-items-center justify-content-between">
          <span>Blood Group *</span>
          <ConfidenceBadge score={field_confidences.blood_group || 95} />
        </label>
        {blood_group_detected ? (
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-danger text-white px-3 py-2 fs-6 fw-extrabold rounded-3">
              <IoWaterOutline size={16} /> {extracted_blood_group}
            </span>
            <select
              className="form-select form-select-sm fw-bold border-0 bg-light"
              style={{ maxWidth: 140 }}
              value={extracted_blood_group}
              onChange={(e) => onChange('extracted_blood_group', e.target.value)}
            >
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="alert alert-warning p-2 small mb-2 d-flex align-items-center gap-2 rounded-3">
            <IoWarningOutline size={18} className="text-warning-emphasis" />
            <span className="fw-bold">Blood group not detected.</span> Please select blood group manually.
            <select
              className="form-select form-select-sm fw-bold border-warning ms-auto"
              style={{ maxWidth: 120 }}
              value={extracted_blood_group || 'O+'}
              onChange={(e) => onChange('extracted_blood_group', e.target.value)}
            >
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="row g-3">
        {/* Hospital */}
        <div className="col-md-6">
          <label className="form-label fw-semibold small text-secondary d-flex align-items-center justify-content-between">
            <span>Hospital Name *</span>
            <ConfidenceBadge score={field_confidences.hospital || 90} />
          </label>
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-light border-0"><IoBusinessOutline /></span>
            <input
              type="text"
              className="form-control bg-light border-0 fw-semibold"
              value={extracted_hospital || ''}
              onChange={(e) => onChange('extracted_hospital', e.target.value)}
              placeholder="Hospital Name"
            />
          </div>
        </div>

        {/* City & Landmark */}
        <div className="col-md-6">
          <label className="form-label fw-semibold small text-secondary d-flex align-items-center justify-content-between">
            <span>City & Landmark *</span>
            <ConfidenceBadge score={field_confidences.location || 88} />
          </label>
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-light border-0"><IoLocationOutline /></span>
            <input
              type="text"
              className="form-control bg-light border-0 fw-semibold"
              value={`${extracted_city || ''} ${extracted_landmark ? ' - ' + extracted_landmark : ''}`.trim()}
              onChange={(e) => onChange('extracted_city', e.target.value)}
              placeholder="City, Landmark"
            />
          </div>
        </div>

        {/* Priority Selector */}
        <div className="col-md-4">
          <label className="form-label fw-semibold small text-secondary">Emergency Priority</label>
          <select
            className="form-select form-select-sm bg-light border-0 fw-bold"
            value={extracted_priority}
            onChange={(e) => onChange('extracted_priority', e.target.value)}
          >
            <option value="CRITICAL">🔴 Critical</option>
            <option value="HIGH">🟠 High</option>
            <option value="NORMAL">🟢 Normal</option>
          </select>
        </div>

        {/* Relation */}
        <div className="col-md-4">
          <label className="form-label fw-semibold small text-secondary">Patient Relation</label>
          <input
            type="text"
            className="form-control form-control-sm bg-light border-0 fw-semibold"
            value={extracted_relation || 'Self'}
            onChange={(e) => onChange('extracted_relation', e.target.value)}
          />
        </div>

        {/* Required Time */}
        <div className="col-md-4">
          <label className="form-label fw-semibold small text-secondary">Required Within</label>
          <input
            type="text"
            className="form-control form-control-sm bg-light border-0 fw-semibold"
            value={extracted_required_time || 'Within 2 Hours'}
            onChange={(e) => onChange('extracted_required_time', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default AIExtractionCard;
