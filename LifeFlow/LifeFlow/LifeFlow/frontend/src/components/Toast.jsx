import React, { useEffect } from 'react';
import { IoCheckmarkCircle, IoCloseCircle, IoAlertCircle, IoInformationCircle, IoClose } from 'react-icons/io5';

const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <IoCheckmarkCircle className="text-success me-2" size={22} />;
      case 'danger':
        return <IoCloseCircle className="text-danger me-2" size={22} />;
      case 'warning':
        return <IoAlertCircle className="text-warning me-2" size={22} />;
      case 'info':
      default:
        return <IoInformationCircle className="text-info me-2" size={22} />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return '#198754';
      case 'danger':
        return '#dc3545';
      case 'warning':
        return '#ffc107';
      case 'info':
      default:
        return '#0dcaf0';
    }
  };

  return (
    <div 
      className="custom-toast" 
      style={{ borderLeftColor: getBorderColor() }}
    >
      <div className="d-flex align-items-center me-3">
        {getIcon()}
        <span className="small fw-medium text-dark">{message}</span>
      </div>
      <button 
        type="button" 
        className="btn p-0 m-0 border-0 d-flex align-items-center justify-content-center text-muted" 
        onClick={onClose}
        style={{ background: 'transparent' }}
      >
        <IoClose size={18} />
      </button>
    </div>
  );
};

export default Toast;
