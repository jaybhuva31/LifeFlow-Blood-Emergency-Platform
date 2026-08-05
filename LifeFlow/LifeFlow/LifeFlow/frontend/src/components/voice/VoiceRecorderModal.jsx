import React, { useState, useEffect, useRef } from 'react';
import { 
  IoMicOutline, 
  IoStopCircleOutline, 
  IoRefreshOutline, 
  IoCloseOutline, 
  IoLanguageOutline,
  IoSparklesOutline,
  IoHardwareChipOutline
} from 'react-icons/io5';
import VoiceWave from './VoiceWave';
import TranscriptPanel from './TranscriptPanel';
import AIExtractionCard from './AIExtractionCard';
import VoiceConfirmation from './VoiceConfirmation';
import HandsFreeAssistant from './HandsFreeAssistant';
import api from '../../services/api';

const VoiceRecorderModal = ({ isOpen, onClose, onRequestSubmitted }) => {
  if (!isOpen) return null;

  const [language, setLanguage] = useState('en-US');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [handsFreeMode, setHandsFreeMode] = useState(false);

  const [transcript, setTranscript] = useState('');
  const [aiExtraction, setAiExtraction] = useState(null);
  const [confirmationStep, setConfirmationStep] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  const startListening = () => {
    setErrorMsg(null);
    setConfirmationStep(false);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMsg("Web Speech API is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (recognitionRef.current) recognitionRef.current.abort();

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript + ' ';
      }
      setTranscript(currentTranscript.trim());
    };

    recognition.onerror = (err) => {
      console.error("Voice recognition error:", err);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    if (transcript) {
      handleAnalyzeTranscript(transcript);
    }
  };

  const handleAnalyzeTranscript = async (textToAnalyze) => {
    if (!textToAnalyze || textToAnalyze.trim().length < 3) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // Get browser location coordinates
      let coords = {};
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => {
            coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          },
          () => {}
        );
      }

      const res = await api.post('voice/transcribe/', {
        transcript: textToAnalyze,
        ...coords
      });

      setAiExtraction(res.data);
      setConfirmationStep(true);
    } catch (err) {
      console.error("Voice transcription failed:", err);
      setErrorMsg("Failed to analyze voice transcript. Please try again or type manually.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExtractionFieldChange = (field, value) => {
    setAiExtraction(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFinalSubmit = async () => {
    if (!aiExtraction) return;
    setIsSubmitting(true);
    try {
      const res = await api.post('voice/request/', {
        log_id: aiExtraction.log_id,
        patient_name: `Patient (${aiExtraction.extracted_relation || 'Self'})`,
        blood_group: aiExtraction.extracted_blood_group,
        hospital: aiExtraction.extracted_hospital,
        city: aiExtraction.extracted_city,
        landmark: aiExtraction.extracted_landmark,
        priority: aiExtraction.extracted_priority,
        relation: aiExtraction.extracted_relation,
        reason: aiExtraction.extracted_reason
      });

      if (onRequestSubmitted) {
        onRequestSubmitted(res.data);
      }
      onClose();
    } catch (err) {
      console.error("Voice request submit error:", err);
      setErrorMsg(err.response?.data?.detail || "Failed to submit emergency request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startListening();
    }
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
    };
  }, [isOpen, language]);

  return (
    <div className="modal show d-block tab-modal-backdrop" style={{ background: 'rgba(15, 23, 42, 0.75)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: 24, overflow: 'hidden' }}>
          {/* Header */}
          <div className="bg-danger text-white p-4 d-flex justify-content-between align-items-center" style={{ background: 'linear-gradient(135deg, #b91c1c, #e11d48)' }}>
            <div>
              <span className="badge bg-white text-danger fw-bold px-3 py-1 rounded-pill mb-1 small" style={{ fontSize: '0.75rem' }}>
                <IoSparklesOutline /> AI Voice Assistant
              </span>
              <h5 className="fw-bold mb-0 text-white">Voice-Activated Emergency Request</h5>
            </div>
            <button onClick={onClose} className="btn-close btn-close-white" />
          </div>

          {/* Modal Body */}
          <div className="modal-body p-4" style={{ background: '#f8fafc', maxHeight: '80vh', overflowY: 'auto' }}>
            {errorMsg && (
              <div className="alert alert-danger p-3 rounded-3 mb-3 small fw-semibold">
                {errorMsg}
              </div>
            )}

            {/* Mode Switcher: Standard Voice vs Hands-Free Conversational */}
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div className="btn-group btn-group-sm">
                {[
                  { id: 'en-US', label: '🇬🇧 English' },
                  { id: 'hi-IN', label: '🇮🇳 हिन्दी (Hindi)' },
                  { id: 'gu-IN', label: '🇮🇳 ગુજરાતી (Gujarati)' }
                ].map(l => (
                  <button
                    key={l.id}
                    onClick={() => setLanguage(l.id)}
                    className={`btn ${language === l.id ? 'btn-danger fw-bold' : 'btn-light text-muted'}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setHandsFreeMode(!handsFreeMode)}
                className={`btn btn-sm ${handsFreeMode ? 'btn-dark' : 'btn-outline-dark'} fw-bold d-flex align-items-center gap-1`}
                style={{ borderRadius: 10 }}
              >
                <IoHardwareChipOutline /> {handsFreeMode ? 'Switch to Standard Voice' : '🤖 Hands-Free Mode'}
              </button>
            </div>

            {handsFreeMode ? (
              <HandsFreeAssistant
                onComplete={(data) => {
                  setAiExtraction({
                    extracted_blood_group: data.blood_group,
                    blood_group_detected: true,
                    extracted_city: data.city,
                    extracted_hospital: data.hospital,
                    extracted_priority: data.priority,
                    extracted_relation: 'Self',
                    overall_confidence: 96.0
                  });
                  setConfirmationStep(true);
                  setHandsFreeMode(false);
                }}
                onCancel={() => setHandsFreeMode(false)}
              />
            ) : (
              <>
                {/* Visualizer Wave */}
                <VoiceWave status={isListening ? 'listening' : isProcessing ? 'processing' : 'idle'} />

                {/* Mic Action Control Bar */}
                <div className="d-flex justify-content-center align-items-center gap-3 my-3">
                  {isListening ? (
                    <button
                      onClick={stopListening}
                      className="btn btn-danger px-4 py-2.5 rounded-pill fw-bold d-flex align-items-center gap-2 shadow-sm"
                    >
                      <IoStopCircleOutline size={22} /> Stop & Extract AI Details
                    </button>
                  ) : (
                    <button
                      onClick={startListening}
                      className="btn btn-red px-4 py-2.5 rounded-pill fw-bold d-flex align-items-center gap-2 shadow-sm"
                    >
                      <IoMicOutline size={22} /> {transcript ? 'Re-speak Voice Request' : 'Start Speaking Voice Request'}
                    </button>
                  )}

                  {transcript && !isListening && (
                    <button
                      onClick={() => handleAnalyzeTranscript(transcript)}
                      disabled={isProcessing}
                      className="btn btn-dark px-4 py-2.5 rounded-pill fw-bold d-flex align-items-center gap-2"
                    >
                      <IoRefreshOutline size={20} /> {isProcessing ? 'Processing AI...' : 'Re-Analyze Text'}
                    </button>
                  )}
                </div>

                {/* Live Transcript Panel */}
                <TranscriptPanel
                  transcript={transcript}
                  isListening={isListening}
                  onTranscriptChange={setTranscript}
                />

                {/* AI Extracted Information Card */}
                {aiExtraction && (
                  <AIExtractionCard
                    extraction={aiExtraction}
                    onChange={handleExtractionFieldChange}
                  />
                )}

                {/* Voice Confirmation Card */}
                {confirmationStep && aiExtraction && (
                  <VoiceConfirmation
                    confirmationText={aiExtraction.confirmation_prompt}
                    onConfirm={handleFinalSubmit}
                    onCancel={() => setConfirmationStep(false)}
                    isSubmitting={isSubmitting}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceRecorderModal;
