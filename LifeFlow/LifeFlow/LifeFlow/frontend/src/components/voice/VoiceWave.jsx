import React from 'react';

const VoiceWave = ({ status = 'listening' }) => {
  const isListening = status === 'listening';
  const isProcessing = status === 'processing';

  return (
    <div className="d-flex align-items-center justify-content-center gap-1 py-3">
      {[40, 70, 100, 65, 85, 45, 90, 60].map((h, idx) => (
        <div
          key={idx}
          style={{
            width: 4,
            height: isListening ? `${h * 0.4}px` : isProcessing ? '14px' : '6px',
            background: isListening ? 'linear-gradient(to top, #ef4444, #f43f5e)' : isProcessing ? '#f59e0b' : '#94a3b8',
            borderRadius: 4,
            transition: 'all 0.25s ease',
            animation: isListening ? `wavePulse 1.2s ease-in-out infinite alternate ${idx * 0.12}s` : 'none'
          }}
        />
      ))}
      <style>{`
        @keyframes wavePulse {
          0% { height: 8px; opacity: 0.4; }
          100% { height: 38px; opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default VoiceWave;
