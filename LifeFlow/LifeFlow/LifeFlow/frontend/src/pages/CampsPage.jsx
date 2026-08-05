import React from 'react';

const CampsPage = () => {
  return (
    <div className="container py-5">
      <div className="custom-card p-5 bg-white text-center">
        <h2 className="fw-bold mb-3">Donation Camps</h2>
        <p className="text-muted">
          Active and upcoming blood donation camps will be listed here.
        </p>
        <div className="alert alert-info d-inline-block p-3 rounded-3 small">
          <strong>Camps Module:</strong> In Part 3, we will add features to create camps, perform QR registrations, check-in attendees, and download attendance certificates.
        </div>
      </div>
    </div>
  );
};

export default CampsPage;
