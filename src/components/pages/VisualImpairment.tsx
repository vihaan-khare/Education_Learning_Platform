/**
 * VisualImpairment.tsx — Voice-First Learning Environment for Visual Impairment
 *
 * FLOW: Routed to when disabilityProfile === 'visual'.
 *
 * ACCESSIBILITY FEATURES:
 *   - Everything spoken aloud via TTS on page load
 *   - Continuous speech-to-text for hands-free AI chat
 *   - High-contrast dark theme (#000 bg, #fff text, large fonts)
 *   - All buttons have aria-labels and keyboard shortcuts
 *   - AI responses spoken back automatically via TTS
 *   - Spacebar = toggle listening, Escape = stop speaking
 *
 * PLACEHOLDER: Feature sections present but marked Coming Soon.
 *              AI chat via Gemini is live.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAdminCourses } from '../../hooks/useAdminCourses';
import type { AdminCourse } from '../../hooks/useAdminCourses';

import { askGemini } from '../../utils/geminiChat';
import type { Message } from '../../utils/geminiChat';

// ─── TTS Helper ───────────────────────────────────────────────────────────────
function speak(text: string, onEnd?: () => void): void {
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.9;
  u.pitch = 1;
  u.volume = 1;
  if (onEnd) u.onend = onEnd;
  synth.speak(u);
}

function stopSpeaking(): void {
  window.speechSynthesis.cancel();
}

const VISUAL_SYSTEM_PROMPT = `You are a compassionate, voice-first AI learning assistant for users with visual impairment. 
Rules:
- Keep responses SHORT (2-3 sentences max) because they will be read aloud.
- Never use bullet points, markdown, or special characters — plain spoken language only.
- Be warm, clear, and encouraging.
- You help users navigate the learning platform, answer questions about their modules, and provide support.
- Available modules on this platform: Audio Stories, Braille Introduction, Screen Reader Training, High Contrast Learning, Voice Navigation.
- All are currently in development. Acknowledge this honestly but positively.`;

interface CourseSectionType {
  id: string;
  title: string;
  content: string;
}

interface CourseType {
  id: string;
  title: string;
  description: string;
  icon: string;
  sections: CourseSectionType[];
  assignments?: string[];
}

const VISUAL_COURSES: CourseType[] = [
  {
    id: 'course-auditory-foundations',
    title: 'Auditory Learning Foundations',
    description: 'How to maximize retention through listening.',
    icon: '🎧',
    sections: [
      {
        id: 'auditory-1',
        title: 'Active Listening Techniques',
        content: 'Active listening requires full concentration, understanding, responding, and remembering what is being said. Focus entirely on the audio stream. By eliminating visual search, your auditory cortex becomes highly sensitized.'
      },
      {
        id: 'auditory-2',
        title: 'Memory Palaces for Audio',
        content: 'Since you cannot easily skim audio, you must build spatial maps in your mind. Assign specific audio facts to physical locations in your house. For example, imagine placing the concept of gravity firmly on your front door.'
      }
    ]
  },
  {
    id: 'course-screen-reader',
    title: 'Screen Reader Mastery',
    description: 'Navigating the digital world accurately and efficiently.',
    icon: '🖥️',
    sections: [
      {
        id: 'sr-1',
        title: 'Navigating by Headings',
        content: 'The fastest way to understand a page is to jump from heading to heading. Most screen readers use the H key to jump to the next heading, and Shift H to go back. This builds a mental structural model of web pages.'
      },
      {
        id: 'sr-2',
        title: 'Forms and Inputs',
        content: 'When you arrive at a form input, your screen reader will typically switch to forms mode or edit mode. Use the Tab key to move through inputs, and listen carefully to the labels.'
      }
    ]
  },
  {
    id: 'course-sensory-lit',
    title: 'Sensory Literature',
    description: 'Descriptive text designed to be highly immersive when read aloud.',
    icon: '📚',
    sections: [
      {
        id: 'lit-1',
        title: 'The Forest at Night',
        content: 'The air turned sharply cold. Crickets chirped in a rhythmic, undulating wave. The scent of damp pine needles filled the lungs with every breath, and the faint rustle of dry leaves gave away the location of unseen creatures scurrying in the dark.'
      }
    ]
  }
];

/** Convert an AdminCourse into a VisualImpairment CourseSectionType for TTS reading. */
function adminItemToVisualSection(item: AdminCourse) {
  const toEmbed = (url: string) =>
    url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/');
  return {
    id: `admin-${item.id}`,
    title: item.title,
    content: item.description || 'No description provided.',
    embedUrl: item.contentType === 'video_url' ? toEmbed(item.url) : undefined,
    url: item.url,
    contentType: item.contentType,
  };
}

// ─── Component ─────────────────────────────────────────────────────────
const VisualImpairment: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [sttSupported, setSttSupported] = useState(true);

  // Catalog State
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const hasGreeted = useRef(false);

  // Admin-uploaded courses from Firestore
  const { courses: adminItems } = useAdminCourses('visual');

  /** Merge static courses with admin-uploaded ones. */
  const allCourses = [
    ...VISUAL_COURSES,
    ...adminItems.map((item): CourseType => ({
      id: `admin-course-${item.id}`,
      title: item.title,
      description: item.description,
      icon: item.contentType === 'video_url' ? '🎥'
          : item.contentType === 'text_content' ? '📝'
          : item.contentType === 'game_url' ? '🎮' : '🔗',
      sections: [adminItemToVisualSection(item)],
      assignments: item.assignments,
    })),
  ];
  
  // Refs to avoid stale closures in voice command handlers
  const stateRef = useRef({
    selectedCourseId,
    activeSectionId,
    allCourses,
    messages
  });

  useEffect(() => {
    stateRef.current = {
      selectedCourseId,
      activeSectionId,
      allCourses,
      messages
    };
  }, [selectedCourseId, activeSectionId, allCourses, messages]);

  // ── Scroll chat to bottom ──────────────────────────────────────────────────
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Greeting on mount ──────────────────────────────────────────────────────
  useEffect(() => {
    if (hasGreeted.current) return;
    hasGreeted.current = true;

    const greeting = "Welcome to your Visual Impairment Learning Space. Press the Spacebar or click the microphone to speak to me out loud. You can say 'Open Sensory Literature' to navigate the catalogue, or simply ask me a question.";

    setTimeout(() => {
      setMessages([{ sender: 'ai', text: greeting }]);
      speak(greeting);
    }, 600);

    // Check STT support
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      setSttSupported(false);
    }
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        stopSpeaking();
        if (listening) stopListening();
      }
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        if (listening) stopListening();
        else startListening();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [listening]);

  // ── STT ───────────────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    stopSpeaking();
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);

    rec.onresult = (event: any) => {
      const result = Array.from(event.results as SpeechRecognitionResultList)
        .map((r: SpeechRecognitionResult) => r[0].transcript)
        .join('');
      setTranscript(result);

      if (event.results[event.results.length - 1].isFinal) {
        handleUserMessage(result.trim());
        setTranscript('');
      }
    };

    rec.onerror = () => setListening(false);

    recognitionRef.current = rec;
    try { rec.start(); } catch (e) {}
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  // ── Local Voice Command Engine ─────────────────────────────────────────
  const processVoiceCommand = (text: string): boolean => {
    const lower = text.toLowerCase();
    
    // Commands: "Stop", "Pause", "Silence"
    if (lower.match(/^(stop|silence|pause|quiet|shut up|hush)$/)) {
      stopSpeaking();
      return true;
    }

    const { selectedCourseId, activeSectionId, allCourses } = stateRef.current;

    // Command: "Go back", "Close", "Home"
    if (lower.includes('go back') || lower.includes('close') || (lower.match(/^(home|back)$/))) {
      if (selectedCourseId) {
        setSelectedCourseId(null);
        setActiveSectionId(null);
        const txt = "Returning to course list.";
        setMessages(prev => [...prev, { sender: 'ai', text: txt }]);
        speak(txt);
        return true;
      }
    }

    // Command: "Open [Course Title]" or "Open course 1"
    if (lower.startsWith('open ') || lower.startsWith('select ')) {
      const targetQuery = lower.replace(/^(open |select )/, '').trim();
      
      let matchedCourse = null;

      // Check for numbered courses first (e.g. "open course 1")
      const matchNumber = targetQuery.match(/course\s+(\d+)/);
      if (matchNumber && allCourses[parseInt(matchNumber[1]) - 1]) {
        matchedCourse = allCourses[parseInt(matchNumber[1]) - 1];
      } else {
        // Fallback to fuzzy keyword matching (e.g. "sensory catalogue" -> matches "Sensory Literature")
        const queryWords = targetQuery.split(/\s+/).filter(w => w.length > 3 || w === 'sr');
        matchedCourse = allCourses.find(course => {
          const title = course.title.toLowerCase();
          // Full partial match
          if (title.includes(targetQuery)) return true;
          // Word-level partial match
          return queryWords.some(word => title.includes(word));
        });
      }

      if (matchedCourse) {
        setSelectedCourseId(matchedCourse.id);
        setActiveSectionId(matchedCourse.sections[0]?.id || null);
        const txt = `Opening ${matchedCourse.title}. It has ${matchedCourse.sections.length} sections.`;
        setMessages(prev => [...prev, { sender: 'ai', text: txt }]);
        speak(txt);
        return true;
      }
    }

    // Command: "Read section" / "Play lesson"
    if (lower.includes('read section') || lower.includes('play lesson') || lower.includes('read lesson')) {
      const { selectedCourseId, activeSectionId, allCourses } = stateRef.current;
      if (selectedCourseId && activeSectionId) {
        const course = allCourses.find(c => c.id === selectedCourseId);
        const section = course?.sections.find(s => s.id === activeSectionId);
        if (section) {
          const txt = `Reading ${section.title}. ${section.content}`;
          setMessages(prev => [...prev, { sender: 'ai', text: txt }]);
          speak(txt);
          return true;
        }
      } else {
        const txt = "You need to open a course first before I can read a section.";
        setMessages(prev => [...prev, { sender: 'ai', text: txt }]);
        speak(txt);
        return true;
      }
    }

    // Command: "Next section"
    if (lower.includes('next section') || lower.includes('next lesson')) {
      const { selectedCourseId, activeSectionId, allCourses } = stateRef.current;
      if (selectedCourseId && activeSectionId) {
        const course = allCourses.find(c => c.id === selectedCourseId);
        const currentIndex = course?.sections.findIndex(s => s.id === activeSectionId) ?? -1;
        if (course && currentIndex !== -1 && currentIndex < course.sections.length - 1) {
          const nextSec = course.sections[currentIndex + 1];
          setActiveSectionId(nextSec.id);
          const txt = `Moved to next section: ${nextSec.title}. Say 'Read section' to play.`;
          setMessages(prev => [...prev, { sender: 'ai', text: txt }]);
          speak(txt);
          return true;
        } else {
          const txt = "You are at the last section of this course.";
          setMessages(prev => [...prev, { sender: 'ai', text: txt }]);
          speak(txt);
          return true;
        }
      }
    }

    return false;
  };

  // ── Handle user message → Local Command OR Gemini → TTS ──────────────────
  const handleUserMessage = async (text: string) => {
    if (!text) return;
    const userMsg: Message = { sender: 'user', text };
    
    // Optimistic UI append
    setMessages(prev => [...prev, userMsg]);

    // 1. Try local voice commands first (navigating UI)
    const handledLocal = processVoiceCommand(text);
    if (handledLocal) return;

    // 2. If it wasn't a local command, pass to Gemini AI for General Chat
    setThinking(true);
    const { messages: currentMessages } = stateRef.current;
    const reply = await askGemini(text, [...currentMessages, userMsg], VISUAL_SYSTEM_PROMPT);
    setThinking(false);
    setMessages(prev2 => [...prev2, { sender: 'ai', text: reply }]);
    speak(reply);
  };

  const handleLogout = async () => {
    stopSpeaking();
    await signOut(auth);
    navigate('/login');
  };

  const activeCourse = allCourses.find(c => c.id === selectedCourseId);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={S.page} role="main" aria-label="Visual Impairment Learning Environment">

      {/* ── HEADER ── */}
      <header style={S.header}>
        <div style={S.headerLeft}>
          <span style={S.headerIcon} aria-hidden="true">👁️</span>
          <div>
            <h1 style={S.headerTitle}>Your Learning Space</h1>
            <p style={S.headerSub}>Visual Impairment Support — Voice-First</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button style={S.homeBtn} onClick={() => { stopSpeaking(); navigate('/home'); }} aria-label="Go to home">
            Home
          </button>
          <button style={S.signOutBtn} onClick={handleLogout} aria-label="Sign out">
            Sign Out
          </button>
        </div>
      </header>

      {/* ── STT NOT SUPPORTED NOTICE ── */}
      {!sttSupported && (
        <div style={S.noticeBanner} role="alert">
          ⚠️ Speech recognition is not available in this browser. Please use Chrome or Edge for the full voice experience.
        </div>
      )}

      <div style={S.body}>

        {/* ── VOICE CHAT PANEL ── */}
        <section style={S.chatPanel} aria-label="Voice chat with AI assistant">
          <div style={S.chatHeader}>
            <h2 style={S.chatTitle}>🎙️ Voice Assistant</h2>
            <p style={S.chatHint}>Press <kbd style={S.kbd}>Spacebar</kbd> to speak · <kbd style={S.kbd}>Esc</kbd> to stop</p>
          </div>

          {/* Messages */}
          <div style={S.messages} aria-live="polite" aria-label="Conversation history">
            {messages.map((m, i) => (
              <div key={i} style={{ ...S.bubble, ...(m.sender === 'user' ? S.userBubble : S.aiBubble) }}>
                <div style={S.bubbleSender}>{m.sender === 'ai' ? '🤖 Assistant' : '🎙️ You'}</div>
                <div style={S.bubbleText}>{m.text}</div>
              </div>
            ))}
            {thinking && (
              <div style={{ ...S.bubble, ...S.aiBubble }}>
                <div style={S.bubbleSender}>🤖 Assistant</div>
                <div style={{ ...S.bubbleText, color: '#94a3b8' }}>Thinking…</div>
              </div>
            )}
            {transcript && (
              <div style={{ ...S.bubble, ...S.userBubble, opacity: 0.6 }}>
                <div style={S.bubbleSender}>🎙️ You (listening…)</div>
                <div style={S.bubbleText}>{transcript}</div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* MIC BUTTON */}
          <div style={S.micRow}>
            <button
              style={{ ...S.micBtn, ...(listening ? S.micActive : {}) }}
              onClick={listening ? stopListening : startListening}
              disabled={!sttSupported}
              aria-label={listening ? 'Stop listening' : 'Start listening — speak to the AI'}
              aria-pressed={listening}
            >
              {listening ? '⏹ Stop' : '🎤 Speak'}
            </button>
            <button
              style={S.stopSpeakBtn}
              onClick={stopSpeaking}
              aria-label="Stop AI from speaking"
            >
              🔇 Silence
            </button>
          </div>
        </section>

        {/* ── MODULES / COURSE VIEW ── */}
        <section style={S.modulesSection} aria-label="Learning modules">
          {!selectedCourseId ? (
            <>
              <h2 style={S.sectionTitle}>Learning Catalogue</h2>
              <p style={S.sectionSub}>Say "Open [Course Title]" to explore.</p>
              <div style={S.modules}>
                {VISUAL_COURSES.map(m => (
                  <div key={m.id} style={S.moduleCard} onClick={() => setSelectedCourseId(m.id)}>
                    <span style={S.moduleIcon} aria-hidden="true">{m.icon}</span>
                    <h3 style={S.moduleTitle}>{m.title}</h3>
                    <p style={S.moduleDesc}>{m.description}</p>
                    <span style={S.voiceHint}>Say "Open {m.title}"</span>
                  </div>
                ))}
              </div>
            </>
          ) : activeCourse ? (
            <div style={S.courseView}>
               <button style={S.backButton} onClick={() => setSelectedCourseId(null)}>← Back to Catalogue</button>
               <h2 style={{...S.sectionTitle, fontSize: '2rem'}}>{activeCourse.icon} {activeCourse.title}</h2>
               <p style={S.sectionSub}>{activeCourse.description}</p>
               
               <div style={S.sectionList}>
                  {activeCourse.sections.map(section => (
                    <div 
                      key={section.id} 
                      style={{
                        ...S.sectionItem, 
                        ...(activeSectionId === section.id ? S.sectionItemActive : {})
                      }}
                      onClick={() => setActiveSectionId(section.id)}
                    >
                      <h4 style={S.sectionItemTitle}>{section.title}</h4>
                      {activeSectionId === section.id && (
                        <div style={S.sectionItemContent}>
                          <p>{section.content}</p>
                          <div style={S.voiceHintInline}>Say "Read section" to listen.</div>
                        </div>
                      )}
                    </div>
                  ))}
               </div>
            </div>
          ) : null}
        </section>

      </div>
    </div>
  );
};

// ─── Styles (High-Contrast, Large Text) ──────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#000000',
    color: '#ffffff',
    fontFamily: "'Inter', system-ui, sans-serif",
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 2rem',
    borderBottom: '2px solid #333',
    backgroundColor: '#0a0a0a',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '1rem' },
  headerIcon: { fontSize: '2.5rem' },
  headerTitle: { fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', margin: 0 },
  headerSub: { fontSize: '1rem', color: '#94a3b8', margin: '0.2rem 0 0' },
  signOutBtn: {
    padding: '0.6rem 1.25rem',
    backgroundColor: 'transparent',
    color: '#f87171',
    border: '2px solid #f87171',
    borderRadius: '0.5rem',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
  },
  homeBtn: {
    padding: '0.6rem 1.25rem',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '0.5rem',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
  },
  noticeBanner: {
    backgroundColor: '#1c0a0a',
    border: '2px solid #dc2626',
    color: '#fca5a5',
    padding: '1rem 2rem',
    fontSize: '1.1rem',
    textAlign: 'center',
  },
  body: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '420px 1fr',
    gap: 0,
  },

  // Voice chat panel
  chatPanel: {
    backgroundColor: '#0d0d0d',
    borderRight: '2px solid #222',
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 100px)',
    position: 'sticky' as const,
    top: 0,
  },
  chatHeader: {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #222',
  },
  chatTitle: { fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.25rem' },
  chatHint: { fontSize: '0.875rem', color: '#64748b', margin: 0 },
  kbd: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '0.3rem',
    padding: '0.1rem 0.4rem',
    fontFamily: 'monospace',
    fontSize: '0.8rem',
    color: '#94a3b8',
  },
  messages: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '1rem 1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  bubble: {
    borderRadius: '0.75rem',
    padding: '0.875rem 1rem',
    maxWidth: '100%',
  },
  aiBubble: {
    backgroundColor: '#0f172a',
    border: '1px solid #1e3a5f',
  },
  userBubble: {
    backgroundColor: '#1a1a2e',
    border: '1px solid #312e81',
    alignSelf: 'flex-end' as const,
  },
  bubbleSender: { fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: '0.35rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  bubbleText: { fontSize: '1.05rem', lineHeight: 1.65, color: '#e2e8f0' },
  micRow: {
    padding: '1rem 1.25rem',
    borderTop: '1px solid #222',
    display: 'flex',
    gap: '0.75rem',
  },
  micBtn: {
    flex: 1,
    padding: '0.875rem',
    backgroundColor: '#1e40af',
    color: '#ffffff',
    border: '2px solid #3b82f6',
    borderRadius: '0.65rem',
    fontWeight: 800,
    fontSize: '1.1rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  micActive: {
    backgroundColor: '#dc2626',
    borderColor: '#ef4444',
    animation: 'pulse 1.5s infinite',
  },
  stopSpeakBtn: {
    padding: '0.875rem 1rem',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    border: '2px solid #334155',
    borderRadius: '0.65rem',
    fontWeight: 700,
    fontSize: '1rem',
    cursor: 'pointer',
  },

  // modules
  modulesSection: {
    padding: '2rem',
    overflowY: 'auto' as const,
    maxHeight: 'calc(100vh - 100px)',
  },
  sectionTitle: { fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.5rem' },
  sectionSub: { fontSize: '1rem', color: '#64748b', margin: '0 0 1.75rem' },
  modules: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '1.25rem',
  },
  moduleCard: {
    backgroundColor: '#0d0d0d',
    border: '2px solid #222',
    borderRadius: '1rem',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    cursor: 'default',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  moduleIcon: { fontSize: '2rem' },
  moduleTitle: { fontSize: '1.15rem', fontWeight: 800, color: '#f1f5f9', margin: 0 },
  moduleDesc: { fontSize: '0.9rem', color: '#64748b', margin: 0, lineHeight: 1.6 },
  voiceHint: {
    display: 'inline-block',
    marginTop: '0.5rem',
    padding: '0.4rem 1rem',
    backgroundColor: '#1e293b',
    color: '#94a3b8',
    borderRadius: '2rem',
    fontSize: '0.8rem',
    fontWeight: 700,
    alignSelf: 'flex-start' as const,
  },
  courseView: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  backButton: {
    alignSelf: 'flex-start',
    background: 'transparent',
    border: '2px solid #333',
    color: '#94a3b8',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginBottom: '1rem',
  },
  sectionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  sectionItem: {
    backgroundColor: '#0d0d0d',
    border: '2px solid #222',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  sectionItemActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#131e36',
  },
  sectionItemTitle: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    margin: 0,
    color: '#fff',
  },
  sectionItemContent: {
    marginTop: '1rem',
    lineHeight: 1.6,
    color: '#cbd5e1',
    fontSize: '1.1rem',
  },
  voiceHintInline: {
    marginTop: '1rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#1e3a5f',
    color: '#93c5fd',
    borderRadius: '0.5rem',
    display: 'inline-block',
    fontSize: '0.9rem',
    fontWeight: 'bold',
  }
};

export default VisualImpairment;
