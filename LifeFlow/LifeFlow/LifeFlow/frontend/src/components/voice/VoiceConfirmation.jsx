import React, { useEffect, useState, useRef } from 'react';
import { IoVolumeHighOutline, IoCheckmarkCircleOutline, IoCloseCircleOutline, IoMicOutline } from 'react-icons/io5';

const VoiceConfirmation = ({ confirmationText, onConfirm, onCancel, autoSpeak = true, isSubmitting = false }) => {
  const [speaking, setSpeaking] = useState(false);
  const [isListeningForConfirmation, setIsListeningForConfirmation] = useState(false);
  const recognitionRef = useRef(null);

  const startListeningForYes = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (recognitionRef.current) recognitionRef.current.abort();

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListeningForConfirmation(true);
      recognition.onresult = (event) => {
        const speech = event.results[0][0].transcript.toLowerCase();
        console.log("Confirmation voice input:", speech);
        if (speech.includes('yes') || speech.includes('send') || speech.includes('confirm') || speech.includes('ha') || speech.includes('haan') || speech.includes('sure')) {
          setIsListeningForConfirmation(false);
          onConfirm();
        }
      };
      recognition.onend = () => setIsListeningForConfirmation(false);
      recognition.onerror = () => setIsListeningForConfirmation(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error("Speech recognition error in VoiceConfirmation", e);
    }
  };

  const speakPrompt = () => {
    if ('speechSynthesis' in window && confirmationText) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(confirmationText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => {
        setSpeaking(false);
        startListeningForYes();
      };
      utterance.onerror = () => {
        setSpeaking(false);
        startListeningForYes();
      };
      window.speechSynthesis.speak(utterance);
    } else {
      startListeningForYes();
    }
  };

  useEffect(() => {
    if (autoSpeak) {
      speakPrompt();
    }
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, [confirmationText]);

  return (
    <div className="card border-0 shadow-sm p-4 text-center mb-3" style={{ borderRadius: 20, background: 'linear-gradient(135deg, #fff1f2, #ffe4e6)' }}>
      <div 
        className="mx-auto mb-3 d-flex align-items-center justify-content-center cursor-pointer"
        style={{ width: 54, height: 54, borderRadius: '50%', background: speaking ? '#e11d48' : isListeningForConfirmation ? '#dc2626' : '#fda4af', color: '#fff', transition: 'all 0.3s' }}
        onClick={speakPrompt}
        title="Click to replay voice prompt"
      >
        <IoVolumeHighOutline size={30} className={speaking || isListeningForConfirmation ? 'animate-pulse' : ''} />
      </div>

      <h6 className="fw-bold text-dark mb-2">Voice Confirmation</h6>
      <p className="small text-secondary mb-3 px-3" style={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
        "{confirmationText}"
      </p>

      <div className={`alert ${isListeningForConfirmation ? 'alert-danger animate-pulse' : 'alert-light'} p-2 small border mb-3 rounded-pill text-muted d-inline-flex align-items-center justify-content-center gap-1 mx-auto`} style={{ maxWidth: 380, fontSize: '0.78rem' }}>
        <IoMicOutline color="#e11d48" /> {isListeningForConfirmation ? <span>Listening... Say <strong className="text-danger">"Yes"</strong> or click button</span> : <span>Say <strong className="text-dark">"Yes"</strong> or click Send to broadcast alert to donors.</span>}
      </div>

      <div className="d-flex justify-content-center gap-3">
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="btn btn-light fw-semibold px-4 py-2 d-flex align-items-center gap-1"
          style={{ borderRadius: 12 }}
        >
          <IoCloseCircleOutline size={18} /> Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="btn btn-red fw-bold px-4 py-2 d-flex align-items-center gap-1 shadow-sm"
          style={{ borderRadius: 12 }}
        >
          {isSubmitting ? (
            <>
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...
            </>
          ) : (
            <>
              <IoCheckmarkCircleOutline size={20} /> Yes, Send Request Now →
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default VoiceConfirmation;
