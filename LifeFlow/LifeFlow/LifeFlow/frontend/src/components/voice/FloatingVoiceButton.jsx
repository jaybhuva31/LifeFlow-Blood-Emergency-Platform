import React from 'react';
import { IoMicOutline, IoSparklesOutline } from 'react-icons/io5';

const FloatingVoiceButton = ({ onClick }) => {
  return (
    <div 
      className="position-fixed bottom-0 end-0 m-4 z-3 d-flex flex-column align-items-center" 
      style={{ zIndex: 1055 }}
    >
      <button
        onClick={onClick}
        className="btn btn-danger rounded-circle shadow-lg d-flex align-items-center justify-content-center p-0 text-white border-0 position-relative"
        style={{
          width: 64,
          height: 64,
          background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
          boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.5), 0 8px 10px -6px rgba(220, 38, 38, 0.4)'
        }}
        title="AI Voice Assistant - Emergency Request"
      >
        <div 
          className="position-absolute w-100 h-100 rounded-circle border border-danger border-2 animate-ping"
          style={{ opacity: 0.75, animation: 'ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite' }}
        />
        <IoMicOutline size={30} />
      </button>

      <div 
        className="badge bg-dark text-white px-2 py-1 rounded-pill mt-2 shadow-sm d-flex align-items-center gap-1 small"
        style={{ fontSize: '0.72rem', letterSpacing: '0.03em' }}
      >
        <IoSparklesOutline color="#f59e0b" size={12} /> Voice AI Request
      </div>

      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default FloatingVoiceButton;
