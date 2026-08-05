import React from 'react';

const Loader = ({ fullPage = false, message = "Loading..." }) => {
  if (fullPage) {
    return (
      <div 
        className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-white bg-opacity-75"
        style={{ zIndex: 9999 }}
      >
        <div className="loader-spinner mb-3" style={{ width: '3rem', height: '3rem', borderWidth: '5px' }}></div>
        <p className="text-muted fw-medium">{message}</p>
      </div>
    );
  }

  return (
    <div className="text-center py-4">
      <div className="loader-spinner mb-2"></div>
      <p className="small text-muted">{message}</p>
    </div>
  );
};

export default Loader;
