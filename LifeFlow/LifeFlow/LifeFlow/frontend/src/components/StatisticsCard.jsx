import React from 'react';

const StatisticsCard = ({ title, value, icon, badgeText, badgeColor = 'danger', description }) => {
  return (
    <div className="custom-card p-4 h-100">
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div className="text-secondary small fw-semibold text-uppercase tracking-wider">
          {title}
        </div>
        <div className="bg-danger bg-opacity-10 text-danger rounded-3 p-2 d-flex align-items-center justify-content-center">
          {icon}
        </div>
      </div>
      
      <div className="d-flex align-items-baseline gap-2 mb-2">
        <h2 className="fw-bold text-dark mb-0">{value}</h2>
        {badgeText && (
          <span className={`badge bg-${badgeColor} text-uppercase fs-8 fw-bold px-2 py-1 rounded-pill`}>
            {badgeText}
          </span>
        )}
      </div>

      {description && (
        <p className="text-muted small mb-0">{description}</p>
      )}
    </div>
  );
};

export default StatisticsCard;
