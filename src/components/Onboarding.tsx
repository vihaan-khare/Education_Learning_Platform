import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAccessibility } from '../context/AccessibilityContext';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { getRouteForProfile } from '../utils/profileRoutes';
import { visualWords, adhdWords, autismWords, physicalWords, dyslexiaWords } from '../utils/symptoms';

const Onboarding: React.FC = () => {
  const { applyProfileSettings } = useAccessibility();
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<{ sender: 'ai' | 'user', text: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [pendingProfile, setPendingProfile] = useState<string | null>(null);

  // Voice to text state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Setup Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setUserInput(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Auto-start if audio=true is in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('audio') === 'true' && recognitionRef.current) {
      setTimeout(() => {
        try {
          recognitionRef.current?.start();
          setIsListening(true);
        } catch (e) {}
      }, 3000); // Wait for the initial greeting to speak a bit before listening
    }
  }, [location.search]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        setUserInput(''); // Clear input before starting new recording
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Failed to start speech recognition:", err);
      }
    }
  };

  // Silence timer for auto-send
  const silenceTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (isListening && userInput.trim().length > 0) {
      clearTimeout(silenceTimeoutRef.current);
      
      const lower = userInput.trim().toLowerCase();
      
      // Auto-send on "send", "yes", "no"
      if (lower.endsWith(' send') || lower === 'send' || lower === 'yes' || lower === 'no') {
        let finalInput = userInput.trim();
        if (lower.endsWith(' send')) {
          finalInput = finalInput.slice(0, -5).trim();
        } else if (lower === 'send') {
          // If they just said "send", ignore it, or maybe send whatever was previously captured? 
          // But userInput is "send". This might be an empty message. We will just pass it, handleSend will ignore empty.
        }

        silenceTimeoutRef.current = setTimeout(() => {
          recognitionRef.current?.stop();
          setIsListening(false);
          setUserInput(''); // Clear input box explicitly here just in case
          handleSend(finalInput || lower);
        }, 1000); // 1-second pause before triggering
        return;
      }

      // 5-second silence auto-send
      silenceTimeoutRef.current = setTimeout(() => {
        recognitionRef.current?.stop();
        setIsListening(false);
        setUserInput('');
        handleSend(userInput.trim());
      }, 5000);
    }
    
    return () => clearTimeout(silenceTimeoutRef.current);
  }, [userInput, isListening]);

  // Helper to make the AI speak
  const speakMessage = (text: string, onEnd?: () => void) => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (onEnd) {
      utterance.onend = onEnd;
    }
    synth.speak(utterance);
  };

  const addAiMessage = (text: string, onEnd?: () => void) => {
    setMessages(prev => [...prev, { sender: 'ai', text }]);
    speakMessage(text, onEnd);
  };

  // Initial Greeting
  useEffect(() => {
    let isActive = true;
    setIsTyping(true);

    const timer = setTimeout(() => {
      if (!isActive) return;
      setIsTyping(false);
      addAiMessage("Hi! I'm Aurora, your AI assistant. How can I customize your learning experience today? Are you experiencing visual impairment, ADHD, or learning difficulties?");
    }, 1500);

    return () => {
      isActive = false;
      clearTimeout(timer);
      window.speechSynthesis.cancel();
    };
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = (overrideText?: string | any) => {
    const currentInput = typeof overrideText === 'string' ? overrideText : userInput;
    if (!currentInput.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text: currentInput }]);
    if (typeof overrideText !== 'string') {
      setUserInput('');
    }

    if (pendingProfile) {
      if (currentInput.toLowerCase().match(/\b(yes|yeah|sure|ok|okay|yep|y)\b/)) {
        addAiMessage("Great! Taking you there now...");
        setTimeout(async () => {
          applyProfileSettings(pendingProfile as any);
          if (auth.currentUser) {
            try {
              await updateDoc(doc(db, 'users', auth.currentUser.uid), {
                disabilityProfile: pendingProfile
              });
            } catch (error) {
              console.error("Failed to save profile to Firestore", error);
            }
          }
          navigate(getRouteForProfile(pendingProfile));
        }, 2000);
        setPendingProfile(null);
      } else {
        addAiMessage("I'm sorry if I misunderstood! Could you provide a bit more detail about what you struggle with or what accommodations you need?");
        setPendingProfile(null);
      }
      return;
    }

    setIsTyping(true);

    // Use Keyword Matching first, and use Gemini LLM as a fallback
    const classifyWithLLM = async (): Promise<{ profile: 'visual' | 'learning' | 'adhd' | 'autism' | 'physical', response: string }> => {

      // Normalize smart/curly apostrophes so keywords like "can't see" always match
      const inputLower = currentInput.toLowerCase()
        .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
        .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"');

      // Score each profile by counting keyword hits
      const score = (words: string[]) => words.filter(w => inputLower.includes(w)).length;

      const scores = {
        visual: score(visualWords),
        adhd: score(adhdWords),
        autism: score(autismWords),
        physical: score(physicalWords),
        learning: score(dyslexiaWords),
      };

      // Find the profile with the highest score
      const best = (Object.entries(scores) as [string, number][])
        .sort((a, b) => b[1] - a[1])[0];

      console.log('[Aurora] Keyword scores:', scores, '| Best:', best[0], `(${best[1]})`);

      // If keywords match strongly, skip the LLM entirely
      if (best[1] > 0) {
        const profileResponses: Record<string, string> = {
          visual: 'Understood. Applying High Contrast mode and Text-to-Speech support. Stand by...',
          adhd: 'Got it. Applying the Sensory Focus profile to reduce distractions. Stand by...',
          autism: 'I understand. Applying the calm, low-stimulation Sensory Profile designed for your comfort. Stand by...',
          physical: 'Understood. Applying accessibility controls and support for physical or hearing constraints. Stand by...',
          learning: 'Understood. Applying the Dyslexia support profile. Stand by...',
        };
        return { profile: best[0] as any, response: profileResponses[best[0]] };
      }

      // If keywords do NOT match, fallback to the LLM
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

      if (apiKey && apiKey !== 'your-gemini-api-key') {
        try {
          const prompt = `You are an accessibility AI assistant. Classify the user's message into EXACTLY ONE of these five disability profiles:

1. visual  — blindness, low vision, blurry eyesight, eye conditions, trouble seeing near or far, need screen reader
2. adhd    — attention difficulties, hyperactivity, trouble focusing, impulsivity, distraction, forgetfulness
3. autism  — sensory overload, social difficulties, need for routine, overstimulation, meltdowns, stimming
4. learning — dyslexia, trouble reading/writing/spelling, letters jumping or reversing, slow reader
5. physical — mobility issues, wheelchair, trouble typing, paralysis, AND DEAFNESS, hearing loss, can't hear, deaf, hard of hearing, sign language

User message: "${currentInput.slice(0, 300)}"

Reply with ONLY valid JSON, no markdown fences, no explanation:
{"profile":"<one of: visual|adhd|autism|learning|physical>","response":"<one empathetic sentence>"}`;

          console.log('[Aurora] Sending to Gemini LLM...');

          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
          });

          if (res.ok) {
            const data = await res.json();
            const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            console.log('[Aurora] LLM raw response:', raw);
            if (raw) {
              const cleaned = raw.replace(/```json|```/g, '').trim();
              const parsed = JSON.parse(cleaned);
              const validProfiles = ['visual', 'learning', 'adhd', 'autism', 'physical'];
              if (validProfiles.includes(parsed.profile)) {
                return { profile: parsed.profile, response: parsed.response };
              }
            }
          } else {
            console.warn('[Aurora] LLM API error:', res.status, await res.text());
          }
        } catch (err) {
          console.warn('[Aurora] LLM classification failed:', err);
        }
      } else {
        console.warn('[Aurora] No valid VITE_GEMINI_API_KEY found. LLM is disabled.');
      }

      // True default — if even the LLM fails or API is unavailable
      return { profile: 'learning', response: "I'd like to help! Applying the standard learning profile for now. You can always change this later." };
    };

    classifyWithLLM().then(({ profile, response }) => {
      setIsTyping(false);
      const profileNames: Record<string, string> = {
        visual: 'Visual Impairment',
        adhd: 'ADHD',
        autism: 'Autism',
        physical: 'Physical Accessibility',
        learning: 'Dyslexia'
      };
      const recommendationMsg = `${response} I'd recommend the ${profileNames[profile] || profile} learning path for you. Would you like me to take you there? (Yes/No)`;
      addAiMessage(recommendationMsg);
      setPendingProfile(profile);
    });
  };

  return (
    <main className="flex h-screen w-full bg-surface text-on-surface font-body overflow-hidden items-center justify-center">

      {/* Central AI Interaction */}
      <section className="w-full max-w-4xl h-full bg-gradient-to-br from-surface-container-low to-surface flex flex-col relative shadow-2xl border-x border-outline-variant/20">
        <div className="p-12 pb-6 border-b border-outline-variant/10 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl font-headline font-bold tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#df6eff]">AURORA</span>
            </div>
            <h1 className="font-headline text-2xl font-bold tracking-tight text-on-surface">
              Accessibility Setup
            </h1>
          </div>
        </div>

        {/* Chat Interface */}
        <div ref={scrollRef} className="flex-grow overflow-y-auto px-12 py-8 space-y-6 flex flex-col justify-start pb-20">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 max-w-[85%] animate-fade-in ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              {msg.sender === 'ai' && (
                <div className="w-10 h-10 rounded-full intelligence-gradient flex items-center justify-center shrink-0 glow-soft">
                  <span className="material-symbols-outlined text-on-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
                </div>
              )}
              <div className={`rounded-xl p-5 text-on-surface ${msg.sender === 'ai' ? 'bg-surface-container border-l-2 border-primary/30 shadow-md' : 'bg-surface-container-high'}`}>
                {msg.sender === 'ai' && idx === 0 && <p className="font-label text-[10px] uppercase tracking-widest text-primary mb-1">Aurora AI</p>}
                <p className="leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-4 items-center pl-14">
              <div className="flex gap-1.5 px-3 py-2 bg-surface-container-high rounded-full w-fit shadow-inner">
                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
              <span className="text-xs font-label text-outline uppercase tracking-tighter">Aurora is typing</span>
            </div>
          )}
        </div>

        {/* Interaction Bar */}
        <div className="p-12 pt-6 shrink-0 bg-surface">
          <div className="relative">
            <div className="absolute -top-12 left-0 w-full h-12 bg-gradient-to-t from-surface to-transparent pointer-events-none"></div>
            <div className="flex items-center gap-4 bg-surface-container-high p-2 rounded-2xl border border-outline-variant/10 shadow-lg relative z-10">
              <input
                className="flex-grow bg-transparent border-none focus:ring-0 px-4 py-3 text-on-surface placeholder-on-surface-variant/50 outline-none"
                placeholder={isListening ? "Listening..." : "Type your response..."}
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button
                onClick={toggleListening}
                className={`p-3 rounded-xl transition-all flex items-center justify-center border-none cursor-pointer ${isListening ? 'bg-error text-on-error animate-pulse' : 'bg-surface-variant text-on-surface hover:bg-surface-variant/80'}`}
                title={isListening ? "Stop listening" : "Start speaking"}
              >
                <span className="material-symbols-outlined">{isListening ? 'mic_off' : 'mic'}</span>
              </button>
              <button
                onClick={handleSend}
                className="intelligence-gradient text-on-primary font-label font-bold px-6 py-3 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer border-none"
              >
                <span>SEND</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
            {/* Quick Select Direct Routes */}
            <div className="mt-6 flex flex-col items-center">
              <p className="text-[10px] font-label uppercase tracking-[0.2em] text-outline mb-3">Temporary Direct Routes</p>
              <div className="flex gap-2 flex-wrap justify-center">
                <button onClick={() => navigate('/dyslexia')} className="bg-surface-container-highest text-on-surface px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary hover:text-on-primary transition-colors border border-outline-variant/20 cursor-pointer">
                  1. Dyslexia
                </button>
                <button onClick={() => navigate('/physical-disability')} className="bg-surface-container-highest text-on-surface px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary hover:text-on-primary transition-colors border border-outline-variant/20 cursor-pointer">
                  2. Physical Disability
                </button>
                <button onClick={() => navigate('/visual-impairment')} className="bg-surface-container-highest text-on-surface px-4 py-2 rounded-lg text-xs font-bold hover:bg-primary hover:text-on-primary transition-colors border border-outline-variant/20 cursor-pointer">
                  3. Visual Impairment
                </button>
                <button onClick={() => navigate('/adhd')} className="bg-surface-container-highest text-on-surface px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#2b6cb0] hover:text-white transition-colors border border-outline-variant/20 cursor-pointer">
                  4. ADHD
                </button>
                <button onClick={() => navigate('/autism')} className="bg-surface-container-highest text-on-surface px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#2b6cb0] hover:text-white transition-colors border border-outline-variant/20 cursor-pointer">
                  5. Autism
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Overlay UI Assets */}
      <div className="fixed top-8 right-8 z-50 flex gap-4">
        <button
          className="glass-panel p-2.5 rounded-full text-on-surface-variant hover:text-primary transition-colors cursor-pointer border-none shadow-md"
          onClick={() => {
            window.speechSynthesis.cancel();
            applyProfileSettings('none');
            navigate(getRouteForProfile('none'));
          }}
          title="Skip Onboarding"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
    </main>
  );
};

export default Onboarding;
