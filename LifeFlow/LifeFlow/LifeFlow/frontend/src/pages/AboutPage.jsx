import React from 'react';

const AboutPage = () => {
  return (
    <div className="container py-5">
      <div className="custom-card p-5 bg-white">
        <h2 className="fw-bold mb-3">About LifeFlow</h2>
        <p className="text-muted">
          LifeFlow is a Blood Donor Emergency System designed to bridge the gap between people who need blood in urgent medical conditions and healthy individuals who are ready to donate.
        </p>
        <h5 className="fw-bold mt-4">Key Features</h5>
        <ul className="text-muted">
          <li>Real-time notification system connecting requests with matching donors.</li>
          <li>Leaflet Maps integration to locate nearest donors and calculate distances.</li>
          <li>Comprehensive Admin Panel for monitoring camps, users, and requests.</li>
          <li>Secure verification flow via Email OTP.</li>
        </ul>
        <h5 className="fw-bold mt-4">Clean Architecture</h5>
        <p className="text-muted small">
          Built using React.js (Vite) on the frontend for rendering modular elements, Axios for sending REST requests, Django REST Framework on the backend for handling logic, and SQLite/MySQL databases for transaction logs.
        </p>
      </div>
    </div>
  );
};

export default AboutPage;
