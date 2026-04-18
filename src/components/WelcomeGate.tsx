import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const WelcomeGate: React.FC = () => {
  const navigate = useNavigate();
  
  // Phase 0 = Initial Start (to unlock audio)
  // Phase 1 = States 1,2,3,4
  // Phase 5 = States 5,6
  const [phase, setPhase] = useState<0 | 1 | 5>(0);
  const [showRedWarning, setShowRedWarning] = useState(false);
  
  // Speech Recognition API
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognitionRef = useRef<any>(null);
  
  const voiceTimeoutRef = useRef<any>(null);
  const repeatTimeoutRef = useRef<any>(null);
  const attemptsRef = useRef<number>(1); // Track how many times we've asked
  const navigatingRef = useRef(false);   // Guard: stop timers firing after navigation

  useEffect(() => {
    // Try to speak on load — browsers may block this, visual text is fallback
    try {
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance("Welcome. Press spacebar or click anywhere to start.");
      utterance.rate = 0.9;
      synth.speak(utterance);
    } catch (_) {}

    return () => cleanupTimersAndVoice();
  }, []); // Run ONCE on mount

  // Global Keydown Handler for State 6
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Exclude shift/ctrl/alt so it doesn't trigger unexpectedly
      if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') return;

      if (phase === 0) {
        setPhase(1);
        attemptsRef.current = 1;
        runState2Logic(false);
      }
      else if (phase === 1) {
        if (e.code === 'Space') {
          handleYes();
        } else {
          handleNo();
        }
      } else if (phase === 5) {
        if (e.code === 'Space') {
          navigatingRef.current = true;
          cleanupTimersAndVoice();
          navigate('/login?audio=true');
        } else {
          navigatingRef.current = true;
          cleanupTimersAndVoice();
          navigate('/register?audio=true');
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, navigate]);

  const cleanupTimersAndVoice = () => {
    clearTimeout(voiceTimeoutRef.current);
    clearTimeout(repeatTimeoutRef.current);
    window.speechSynthesis.cancel();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
  };

  const speak = (text: string, onEnd: () => void) => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    
    // IMPORTANT: Do NOT trigger any timers until speech has COMPLETELY finished
    utterance.onend = onEnd;
    
    // Fallback if browser autoplay blocks speech
    utterance.onerror = onEnd; 
    
    synth.speak(utterance);
  };

  // -----------------------------------------------------------------
  // STATES 2, 3, 4: VOICE ASSISTANT SETUP
  // -----------------------------------------------------------------
  const runState2Logic = (isRetry: boolean = false) => {
    cleanupTimersAndVoice();
    
    if (isRetry) {
      attemptsRef.current += 1;
    } else {
      attemptsRef.current = 1;
    }

    const phrase = attemptsRef.current > 2
      ? "Press spacebar for login, any other key for registration."
      : "Do you require voice assistant? Please say yes or no.";

    speak(phrase, () => {
      // Triggered ONLY after speech COMPLETELY finishes
      
      // STATE 3: Voices support check (Strict Timing) ONLY ON FIRST TRY
      if (attemptsRef.current === 1) {
        voiceTimeoutRef.current = setTimeout(() => {
          if (!SpeechRecognition) {
            setShowRedWarning(true);
            cleanupTimersAndVoice(); // Intercept the running 5s silence timer
            speak("Press spacebar for login, any other key for registration.", () => {
              // Restart the 5s generic fallback loop so the keyboard prompt repeats if idle
              repeatTimeoutRef.current = setTimeout(() => {
                attemptsRef.current = 3; // Lock into keyboard hints
                runState2Logic(true);
              }, 5000);
            });
          }
        }, 3000);
      }

      // STATE 4: Start Listening
      if (SpeechRecognition) {
        startListeningPhase1();
      }

      // CASE D: No Input Detected after 5 seconds of silence
      if (SpeechRecognition) {
        repeatTimeoutRef.current = setTimeout(() => {
          runState2Logic(true); // Loop every 5 seconds, escalating attempt count
        }, 5000);
      }
    });
  };

  const startListeningPhase1 = () => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      clearTimeout(repeatTimeoutRef.current); // Stop repeat timer
      
      const result = event.results[0][0].transcript.toLowerCase();
      if (result.includes('yes') || result.includes('yeah')) {
        handleYes();
      } else if (result.includes('no') || result.includes('nope')) {
        handleNo();
      } else {
        // CASE C: Unclear Input
        cleanupTimersAndVoice();
        attemptsRef.current += 1;
        
        const phrase = attemptsRef.current > 2
          ? "Press spacebar for login, any other key for registration."
          : "I did not understand. Please say yes or no.";
          
        speak(phrase, () => {
          startListeningPhase1();
          // Restart 5s loop
          repeatTimeoutRef.current = setTimeout(() => {
            runState2Logic(true);
          }, 5000);
        });
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        clearTimeout(repeatTimeoutRef.current);
        cleanupTimersAndVoice();
        attemptsRef.current += 1;

        const phrase = attemptsRef.current > 2
          ? "Press spacebar for login, any other key for registration."
          : "I did not understand. Please say yes or no.";

        speak(phrase, () => {
          startListeningPhase1();
          repeatTimeoutRef.current = setTimeout(() => {
            runState2Logic(true);
          }, 5000);
        });
      }
    };

    try { recognition.start(); } catch (e) {}
  };

  // -----------------------------------------------------------------
  // BUTTON HANDLERS FOR STATE 4
  // -----------------------------------------------------------------
  const handleNo = () => {
    // CASE A: User clicks/says NO -> Immediately navigate to LOGIN PAGE
    navigatingRef.current = true;
    cleanupTimersAndVoice();
    navigate('/login');
  };

  const handleYes = () => {
    // CASE B: User clicks/says YES -> Proceed to STATE 5
    runState5Logic();
  };

  // -----------------------------------------------------------------
  // STATE 5 & 6: CONFIRMATION STEP
  // -----------------------------------------------------------------
  const runState5Logic = () => {
    setPhase(5);
    cleanupTimersAndVoice();
    if (navigatingRef.current) return;
    
    const phrase = "Press spacebar for login, any other key for registration.";
    
    speak(phrase, () => {
      if (navigatingRef.current) return;

      // Voice recognition for 'login' / 'register' in phase 5
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.onresult = (event: any) => {
          if (navigatingRef.current) return;
          clearTimeout(repeatTimeoutRef.current);
          const result = event.results[0][0].transcript.toLowerCase();
          if (result.includes('login') || result.includes('log in')) {
            navigatingRef.current = true;
            cleanupTimersAndVoice();
            navigate('/login?audio=true');
          } else if (result.includes('register') || result.includes('create')) {
            navigatingRef.current = true;
            cleanupTimersAndVoice();
            navigate('/register?audio=true');
          } else {
            // Unclear voice — repeat once
            if (!navigatingRef.current) runState5Logic();
          }
        };
        try { recognition.start(); } catch (e) {}
      }

      // Only repeat after 8 seconds of genuine silence — and only if still on this page
      repeatTimeoutRef.current = setTimeout(() => {
        if (!navigatingRef.current) runState5Logic();
      }, 8000);
    });
  };

  // -----------------------------------------------------------------
  // RENDER UI
  // -----------------------------------------------------------------
  return (
    <div 
      onClick={() => {
        if (phase === 0) {
          setPhase(1);
          attemptsRef.current = 1;
          runState2Logic(false);
        }
      }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', width: '100vw', backgroundColor: '#1A202C',
        color: 'white', fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '2rem',
        cursor: phase === 0 ? 'pointer' : 'default'
      }}
    >
      {/* STATE 0: INITIAL START (Browser Policy Unlock) */}
      {phase === 0 && (
        <div style={{ animation: 'pulse 2s infinite' }}>
          <h1 style={{ fontSize: '4rem', fontWeight: 'bold' }}>Welcome</h1>
          <p style={{ fontSize: '2rem', color: '#68D391', marginTop: '1rem' }}>Press Spacebar or Click to Start</p>
        </div>
      )}

      {/* STATE 1: WELCOME SCREEN (INITIAL LOAD) */}
      {phase === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '3rem' }}>Do you require voice assistance?</h1>
          
          <div style={{ display: 'flex', gap: '2rem' }}>
            <button onClick={handleYes} style={s.btn}>YES</button>
            <button onClick={handleNo} style={s.btn}>NO</button>
          </div>

          {/* STATE 3: VOICE SUPPORT RED WARNING */}
          {showRedWarning && (
            <div style={{ marginTop: '3rem', padding: '1rem', backgroundColor: '#FC8181', borderRadius: '0.5rem', width: '100%', maxWidth: '500px' }}>
              <p style={{ color: '#742A2A', fontWeight: 'bold', fontSize: '1.2rem' }}>
                Voice input not supported. Use keyboard.
              </p>
            </div>
          )}
        </div>
      )}

      {/* STATE 5: CONFIRMATION STEP */}
      {phase === 5 && (
        <div>
          <h1 style={{ fontSize: '3rem' }}>Press spacebar for login, any other key for registration.</h1>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(0.98); } 100% { opacity: 1; transform: scale(1); } }
      `}</style>
      
    </div>
  );
};

const s = {
  btn: {
    padding: '1.5rem 4rem',
    fontSize: '2rem',
    fontWeight: 'bold',
    borderRadius: '0.5rem',
    border: '2px solid white',
    backgroundColor: 'transparent',
    color: 'white',
    cursor: 'pointer',
    transition: 'background-color 0.2s, color 0.2s',
  }
};

export default WelcomeGate;
