import React from 'react';
import { IoFolderOpenOutline } from 'react-icons/io5';

const EmptyState = ({ message = "No records found.", subMessage = "Create a request or verify parameters to load data." }) => {
  return (
    <div className="text-center py-5 px-4 my-3 bg-white border border-dashed rounded-4">
      <div className="text-muted mb-3 d-inline-block p-3 bg-light rounded-circle">
        <IoFolderOpenOutline size={40} className="text-secondary" />
      </div>
      <h5 className="fw-semibold text-dark mb-1">{message}</h5>
      <p className="text-muted small mb-0">{subMessage}</p>
    </div>
  );
};

export default EmptyState;
