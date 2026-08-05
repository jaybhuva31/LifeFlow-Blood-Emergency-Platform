import React from 'react';
import { IoCreateOutline, IoMicOutline } from 'react-icons/io5';

const TranscriptPanel = ({ transcript, isListening, onTranscriptChange }) => {
  return (
    <div className="card border-0 shadow-sm p-3 mb-3" style={{ borderRadius: 16, background: '#f8fafc' }}>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="badge bg-danger-subtle text-danger px-2.5 py-1 rounded-pill fw-bold small d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
          <IoMicOutline /> Live Transcript
        </span>
        <span className="text-muted small d-flex align-items-center gap-1" style={{ fontSize: '0.75rem' }}>
          <IoCreateOutline size={14} /> Editable
        </span>
      </div>

      {isListening && !transcript ? (
        <div className="text-muted fst-italic py-2 small text-center" style={{ color: '#94a3b8' }}>
          Listening... Speak your emergency request naturally (English, Hindi, Gujarati)...
        </div>
      ) : (
        <textarea
          className="form-control border-0 bg-transparent fw-medium text-dark p-0 shadow-none"
          rows={3}
          style={{ resize: 'none', fontSize: '0.92rem', lineHeight: 1.6 }}
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          placeholder="Speech transcript will appear here..."
        />
      )}
    </div>
  );
};

export default TranscriptPanel;
