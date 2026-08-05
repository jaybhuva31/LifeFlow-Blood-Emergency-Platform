import React, { useState, useEffect, useRef } from 'react';
import { IoMicOutline, IoVolumeHighOutline, IoCheckmarkCircleOutline, IoRefreshOutline } from 'react-icons/io5';
import VoiceWave from './VoiceWave';

const STEPS = [
  { key: 'blood_group', prompt: 'Which blood group do you need?' },
  { key: 'city', prompt: 'Which city is the hospital located in?' },
  { key: 'hospital', prompt: 'What is the hospital or medical center name?' },
  { key: 'priority', prompt: 'What is the priority level? Critical, High, or Normal?' },
  { key: 'confirm', prompt: 'Everything is set. Should I send the emergency request now?' }
];

const HandsFreeAssistant = ({ onComplete, onCancel }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [collectedData, setCollectedData] = useState({
    blood_group: 'O+',
    city: 'Ahmedabad',
    hospital: 'Civil Hospital',
    priority: 'HIGH'
  });
  const [status, setStatus] = useState('speaking'); // speaking, listening, processing
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  const currentStep = STEPS[currentStepIndex];

  const speakText = (text, callback) => {
    setStatus('speaking');
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.onend = () => {
        if (callback) callback();
      };
      utterance.onerror = () => {
        if (callback) callback();
      };
      window.speechSynthesis.speak(utterance);
    } else {
      if (callback) callback();
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (recognitionRef.current) recognitionRef.current.abort();

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setStatus('listening');
      setTranscript('');
    };

    recognition.onresult = (event) => {
      const speech = event.results[0][0].transcript.toLowerCase();
      setTranscript(speech);
      setStatus('processing');
      processSpeechInput(speech);
    };

    recognition.onerror = () => {
      setStatus('listening');
    };

    recognition.onend = () => {
      if (status === 'listening') {
        setStatus('listening');
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const processSpeechInput = (speech) => {
    const key = currentStep.key;

    if (key === 'blood_group') {
      if (speech.includes('o pos') || speech.includes('o+')) setCollectedData(p => ({ ...p, blood_group: 'O+' }));
      else if (speech.includes('o neg') || speech.includes('o-')) setCollectedData(p => ({ ...p, blood_group: 'O-' }));
      else if (speech.includes('a pos') || speech.includes('a+')) setCollectedData(p => ({ ...p, blood_group: 'A+' }));
      else if (speech.includes('a neg') || speech.includes('a-')) setCollectedData(p => ({ ...p, blood_group: 'A-' }));
      else if (speech.includes('b pos') || speech.includes('b+')) setCollectedData(p => ({ ...p, blood_group: 'B+' }));
      else if (speech.includes('b neg') || speech.includes('b-')) setCollectedData(p => ({ ...p, blood_group: 'B-' }));
      else if (speech.includes('ab pos') || speech.includes('ab+')) setCollectedData(p => ({ ...p, blood_group: 'AB+' }));
      else if (speech.includes('ab neg') || speech.includes('ab-')) setCollectedData(p => ({ ...p, blood_group: 'AB-' }));
    } else if (key === 'city') {
      setCollectedData(p => ({ ...p, city: speech.trim() }));
    } else if (key === 'hospital') {
      setCollectedData(p => ({ ...p, hospital: speech.trim() }));
    } else if (key === 'priority') {
      if (speech.includes('critical') || speech.includes('urgent')) setCollectedData(p => ({ ...p, priority: 'CRITICAL' }));
      else if (speech.includes('normal')) setCollectedData(p => ({ ...p, priority: 'NORMAL' }));
      else setCollectedData(p => ({ ...p, priority: 'HIGH' }));
    } else if (key === 'confirm') {
      if (speech.includes('yes') || speech.includes('send') || speech.includes('sure') || speech.includes('ok')) {
        speakText("Emergency request submitted successfully!", () => {
          onComplete(collectedData);
        });
        return;
      }
    }

    // Move to next step
    if (currentStepIndex < STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      speakText(STEPS[nextIndex].prompt, () => startListening());
    }
  };

  useEffect(() => {
    speakText(currentStep.prompt, () => startListening());
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="card border-0 shadow-lg p-4 text-center my-3" style={{ borderRadius: 24, background: '#0f172a', color: '#fff' }}>
      <div className="badge bg-danger text-white px-3 py-1.5 rounded-pill mb-3 mx-auto" style={{ width: 'fit-content', fontSize: '0.78rem' }}>
        🎙️ Hands-Free Conversational Mode
      </div>

      <div className="my-3">
        <VoiceWave status={status} />
      </div>

      <h5 className="fw-bold mb-2 text-warning">{currentStep.prompt}</h5>
      <p className="text-white-50 small mb-4">
        {status === 'speaking' && "AI Speaking..."}
        {status === 'listening' && "Listening to your response..."}
        {status === 'processing' && "Processing speech input..."}
      </p>

      {transcript && (
        <div className="p-3 rounded-3 mb-3 bg-dark border border-secondary text-info fw-semibold small">
          "{transcript}"
        </div>
      )}

      {/* Progress Pills */}
      <div className="d-flex justify-content-center gap-2 mb-4">
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            style={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: i === currentStepIndex ? '#f59e0b' : i < currentStepIndex ? '#22c55e' : '#334155'
            }}
          />
        ))}
      </div>

      <div className="d-flex justify-content-center gap-3">
        <button onClick={onCancel} className="btn btn-outline-light btn-sm px-4 rounded-pill">
          Cancel
        </button>
        <button onClick={() => processSpeechInput("yes")} className="btn btn-danger btn-sm px-4 rounded-pill fw-bold">
          Manual Confirm →
        </button>
      </div>
    </div>
  );
};

export default HandsFreeAssistant;
