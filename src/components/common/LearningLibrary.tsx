import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAdminCourses } from '../../hooks/useAdminCourses';
import type { AdminCourse } from '../../hooks/useAdminCourses';
import StepExpectationCard from '../adhd/StepExpectation';
import InstructionClarifier from '../adhd/InstructionClarifier';
import GamePlayer from './GamePlayer';
import { askGemini } from '../../utils/geminiChat';
import type { Message } from '../../utils/geminiChat';

// TTS Helpers
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

export interface CourseSectionType {
  id: string;
  title: string;
  type: 'video' | 'article' | 'game' | 'external';
  embedUrl?: string;
  sourceLink?: string;
  sourceLinkLabel?: string;
  content: string;
  usePredictabilityEngine?: boolean;
}

export interface CourseType {
  id: string;
  title: string;
  description: string;
  icon: string;
  sections: CourseSectionType[];
  assignments?: string[];
  isGame?: boolean; // If true, clicking this card opens a GamePlayer instead of a section list
}

interface LearningLibraryProps {
  profile: 'adhd' | 'autism' | 'learning' | 'physical';
  title: string;
  subtitle: string;
  coreCourses: CourseType[];
  onBack: () => void;
  accentColor?: string;
  isEmbedded?: boolean;
}

const LearningLibrary: React.FC<LearningLibraryProps> = ({
  profile,
  title,
  subtitle,
  coreCourses,
  onBack,
  accentColor = '#4299e1',
  isEmbedded = false
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [confirmedItems, setConfirmedItems] = useState<Set<string>>(new Set());
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [isFocusMode, setIsFocusMode] = useState(false);

  // ── Voice Assistant State ──
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [sttSupported, setSttSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      setSttSupported(false);
    }
  }, []);

  useEffect(() => {
    if (isVoiceMode) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isVoiceMode]);

  // Admin items from Firestore
  const { courses: adminItems } = useAdminCourses(profile);

  // Merge static core items with admin uploads
  const allCourses: CourseType[] = [
    ...coreCourses,
    ...adminItems.map((item): CourseType => ({
      id: `admin-course-${item.id}`,
      title: item.title,
      description: item.description,
      icon: item.contentType === 'video_url' ? '🎥' : '📝',
      sections: [{
        id: 'sec-1',
        title: item.title,
        type: item.contentType === 'video_url' ? 'video' : 'article',
        embedUrl: item.url,
        content: item.description,
        sourceLink: item.url,
        sourceLinkLabel: 'View Source'
      }],
      assignments: item.assignments
    }))
  ];

  const activeCourse = allCourses.find(c => c.id === selectedCourseId);
  const activeSection = activeCourse?.sections.find(s => s.id === activeSectionId);

  // ── Voice Assistant Logic ──
  const stateRef = useRef({
    selectedCourseId,
    activeSectionId,
    allCourses,
    messages
  });

  useEffect(() => {
    stateRef.current = { selectedCourseId, activeSectionId, allCourses, messages };
  }, [selectedCourseId, activeSectionId, allCourses, messages]);

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

  const processVoiceCommand = (text: string): boolean => {
    const lower = text.toLowerCase();
    
    if (lower.match(/^(stop|silence|pause|quiet|shut up|hush)$/)) {
      stopSpeaking();
      return true;
    }

    const { selectedCourseId, activeSectionId, allCourses } = stateRef.current;

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

    if (lower.startsWith('open ') || lower.startsWith('select ')) {
      const targetQuery = lower.replace(/^(open |select )/, '').trim();
      let matchedCourse = null;
      const matchNumber = targetQuery.match(/course\s+(\d+)/);
      if (matchNumber && allCourses[parseInt(matchNumber[1]) - 1]) {
        matchedCourse = allCourses[parseInt(matchNumber[1]) - 1];
      } else {
        const queryWords = targetQuery.split(/\s+/).filter(w => w.length > 3 || w === 'sr');
        matchedCourse = allCourses.find(course => {
          const title = course.title.toLowerCase();
          if (title.includes(targetQuery)) return true;
          return queryWords.some(word => title.includes(word));
        });
      }

      if (matchedCourse) {
        setSelectedCourseId(matchedCourse.id);
        setActiveSectionId(matchedCourse.sections[0]?.id || null);
        const txt = `Opening ${matchedCourse.title}.`;
        setMessages(prev => [...prev, { sender: 'ai', text: txt }]);
        speak(txt);
        return true;
      }
    }

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

  const handleUserMessage = async (text: string) => {
    if (!text) return;
    const userMsg: Message = { sender: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    
    const handledLocal = processVoiceCommand(text);
    if (handledLocal) return;

    setThinking(true);
    const { messages: currentMessages } = stateRef.current;
    const reply = await askGemini(text, [...currentMessages, userMsg]);
    setThinking(false);
    setMessages(prev2 => [...prev2, { sender: 'ai', text: reply }]);
    speak(reply);
  };

  // Helper: confirm "What to expect"
  const confirmExpectation = (key: string) => {
    setConfirmedItems(prev => new Set(prev).add(key));
  };

  const markComplete = (key: string) => {
    setCompletedItems(prev => new Set(prev).add(key));
  };

  // ── Render Voice Panel (Shared) ─────────────────────────────────────────
  const renderVoicePanel = () => {
    if (!isVoiceMode) return null;
    return (
      <aside style={styles.voicePanel}>
        <div style={styles.voiceHeader}>
            <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800 }}>🎙️ Voice Assistant</h2>
        </div>
        <div style={styles.messages}>
            {messages.map((m, i) => (
              <div key={i} style={{ ...styles.bubble, ...(m.sender === 'user' ? styles.userBubble : styles.aiBubble) }}>
                <div style={styles.bubbleText}>{m.text}</div>
              </div>
            ))}
            {thinking && <div style={{ ...styles.bubble, ...styles.aiBubble }}>Thinking...</div>}
            {transcript && <div style={{ ...styles.bubble, ...styles.userBubble, opacity: 0.6 }}>{transcript}</div>}
            <div ref={chatBottomRef} />
        </div>
        <div style={styles.voiceControls}>
            <button style={{ ...styles.micBtn, ...(listening ? styles.micActive : {}) }} 
              onClick={listening ? stopListening : startListening}>
              {listening ? '⏹ Stop' : '🎤 Speak'}
            </button>
            <button style={styles.stopBtn} onClick={stopSpeaking}>🔇 Silence</button>
        </div>
      </aside>
    );
  };

  // ── Render Catalogue View ──────────────────────────────────────────────
  if (!selectedCourseId) {
    return (
      <div style={{ ...styles.container, ...(isEmbedded ? { padding: 0 } : {}) }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: isEmbedded ? '1rem' : 0 }}>
          <button 
            style={{ ...styles.focusToggle, backgroundColor: isVoiceMode ? '#3b82f6' : '#edf2f7', color: isVoiceMode ? '#fff' : '#000' }}
            onClick={() => setIsVoiceMode(!isVoiceMode)}
          >
            🎙️ Voice Assistant
          </button>
        </div>

        {!isEmbedded && (
          <header style={styles.header}>
            <button style={styles.backBtn} onClick={onBack}>← Back</button>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <h1 style={styles.title}>{title}</h1>
              <p style={styles.subtitle}>{subtitle}</p>
            </div>
            <div style={{ width: 80 }} /> {/* Spacer */}
          </header>
        )}

        <div style={{ display: 'flex', gap: '2rem' }}>
          <div style={{ flex: 1 }}>
            <div style={styles.grid}>
              {allCourses.map(course => {
                const isAdmin = course.id.startsWith('admin-course-');
                return (
                  <div 
                    key={course.id} 
                    style={{ ...styles.card, borderColor: isAdmin ? accentColor : '#e2e8f0' }}
                    onClick={() => {
                      setSelectedCourseId(course.id);
                      if (course.sections.length > 0) setActiveSectionId(course.sections[0].id);
                    }}
                  >
                    {isAdmin && <span style={{ ...styles.adminTag, backgroundColor: accentColor }}>Admin Upload</span>}
                    <div style={styles.cardIcon}>{course.icon}</div>
                    <h2 style={styles.cardTitle}>{course.title}</h2>
                    <p style={styles.cardDesc}>{course.description}</p>
                    <div style={styles.cardFooter}>
                      <span>{course.sections.length} Module{course.sections.length !== 1 ? 's' : ''}</span>
                      {course.assignments && <span> • {course.assignments.length} Assignments</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {renderVoicePanel()}
        </div>
      </div>
    );
  }

  // ── Render Game Mode ───────────────────────────────────────────────────
  if (activeCourse?.isGame) {
    return (
      <GamePlayer 
        mode={profile === 'learning' ? 'dyslexia' : 'adhd'} 
        title={activeCourse.title} 
        onBack={() => setSelectedCourseId(null)} 
      />
    );
  }

  // ── Render Content View ────────────────────────────────────────────────
  return (
    <div style={{ ...styles.container, ...(isFocusMode ? styles.focusPage : {}) }}>
      <header style={styles.contentHeader}>
        <button style={styles.backBtn} onClick={() => setSelectedCourseId(null)}>← Library</button>
        <h2 style={styles.courseTitle}>{activeCourse?.title}</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            style={{ ...styles.focusToggle, backgroundColor: isVoiceMode ? '#3b82f6' : '#edf2f7', color: isVoiceMode ? '#fff' : '#000' }}
            onClick={() => setIsVoiceMode(!isVoiceMode)}
          >
            🎙️ Voice Assistant
          </button>
          <button 
            style={{ ...styles.focusToggle, backgroundColor: isFocusMode ? '#ffd700' : '#edf2f7' }}
            onClick={() => setIsFocusMode(!isFocusMode)}
          >
            {isFocusMode ? '💡 Exit Focus' : '🎯 Focus Mode'}
          </button>
        </div>
      </header>

      <div style={styles.contentLayout}>
        {/* Sidebar */}
        {!isFocusMode && (
          <aside style={styles.sidebar}>
            {activeCourse?.sections.map(sec => (
              <button 
                key={sec.id}
                onClick={() => setActiveSectionId(sec.id)}
                style={{ ...styles.sidebarItem, ...(activeSectionId === sec.id ? styles.sidebarItemActive : {}) }}
              >
                {sec.title}
              </button>
            ))}
            {activeCourse?.assignments && (
              <div style={styles.assignmentHeader}>📝 Assignments</div>
            )}
          </aside>
        )}

        {/* Main Content */}
        <main style={styles.mainContent}>
          {activeSection && (
            <div style={styles.sectionArea}>
              {!confirmedItems.has(`${selectedCourseId}-${activeSectionId}`) ? (
                <StepExpectationCard 
                  type="lesson" 
                  title={activeSection.title} 
                  contentSnippet={activeSection.content}
                  onBegin={() => confirmExpectation(`${selectedCourseId}-${activeSectionId}`)}
                />
              ) : (
                <div style={styles.lessonCard}>
                  {activeSection.type === 'video' && activeSection.embedUrl ? (
                    <div style={styles.videoBox}>
                      <iframe src={activeSection.embedUrl} title={activeSection.title} style={styles.iframe} allowFullScreen />
                    </div>
                  ) : (
                    <div style={styles.articleBox}>
                      <p>{activeSection.content}</p>
                    </div>
                  )}
                  <div style={styles.clarifierBox}>
                     <InstructionClarifier rawInstruction={`Study this ${activeSection.type} and take notes for your assignment.`} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Render Assignments at the bottom */}
          {activeCourse?.assignments?.map((asn, idx) => (
             <div key={idx} style={styles.assignmentBox}>
                <InstructionClarifier rawInstruction={asn} />
             </div>
          ))}
        </main>
        
        {renderVoicePanel()}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif" },
  header: { display: 'flex', alignItems: 'center', marginBottom: '3rem' },
  title: { margin: 0, fontSize: '2.5rem', fontWeight: 900, color: '#1a202c' },
  subtitle: { color: '#718096', fontSize: '1.1rem', marginTop: '0.5rem' },
  backBtn: { padding: '0.75rem 1.5rem', borderRadius: '50px', border: '2px solid #e2e8f0', background: 'none', cursor: 'pointer', fontWeight: 700 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' },
  card: { 
    padding: '2rem', borderRadius: '1.5rem', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', transition: 'all 0.2s',
    position: 'relative', display: 'flex', flexDirection: 'column'
  },
  adminTag: { position: 'absolute', top: '1rem', right: '1rem', color: '#fff', fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontWeight: 800 },
  cardIcon: { fontSize: '3rem', marginBottom: '1rem' },
  cardTitle: { margin: '0 0 0.5rem 0', fontSize: '1.35rem', fontWeight: 800 },
  cardDesc: { color: '#4a5568', fontSize: '0.95rem', lineHeight: 1.5, flex: 1 },
  cardFooter: { marginTop: '1.5rem', fontSize: '0.85rem', color: '#a0aec0', fontWeight: 600 },
  
  contentHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' },
  courseTitle: { margin: 0, fontSize: '1.5rem', fontWeight: 800 },
  focusToggle: { padding: '0.6rem 1.2rem', borderRadius: '1rem', border: 'none', fontWeight: 700, cursor: 'pointer' },
  contentLayout: { display: 'flex', gap: '2rem' },
  sidebar: { width: '280px', flexShrink: 0 },
  sidebarItem: { width: '100%', textAlign: 'left', padding: '1rem', marginBottom: '0.5rem', borderRadius: '0.75rem', border: 'none', background: '#f8fafc', cursor: 'pointer', fontWeight: 600 },
  sidebarItemActive: { backgroundColor: '#ebf8ff', color: '#3182ce', borderLeft: '4px solid #3182ce' },
  mainContent: { flex: 1 },
  lessonCard: { backgroundColor: '#fff', borderRadius: '1.5rem', border: '1px solid #e2e8f0', overflow: 'hidden' },
  videoBox: { position: 'relative', paddingBottom: '56.25%', height: 0 },
  iframe: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' },
  articleBox: { padding: '2rem', fontSize: '1.1rem', lineHeight: 1.6, color: '#2d3748' },
  clarifierBox: { padding: '1.5rem', backgroundColor: '#f9fafb', borderTop: '1px solid #f1f5f9' },
  assignmentHeader: { marginTop: '2rem', marginBottom: '1rem', fontWeight: 800, fontSize: '0.9rem', color: '#718096', textTransform: 'uppercase' },
  assignmentBox: { marginBottom: '1.5rem' },
  focusPage: { backgroundColor: '#fff', minHeight: '100vh', padding: '4rem' },
  
  // Voice Panel Styles
  voicePanel: { width: '340px', backgroundColor: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0, height: 'calc(100vh - 150px)', position: 'sticky', top: '2rem' },
  voiceHeader: { padding: '1rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff' },
  messages: { flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  bubble: { padding: '0.75rem', borderRadius: '0.75rem', maxWidth: '90%', fontSize: '0.95rem', lineHeight: 1.5 },
  aiBubble: { backgroundColor: '#fff', border: '1px solid #e2e8f0', alignSelf: 'flex-start' },
  userBubble: { backgroundColor: '#3b82f6', color: '#fff', alignSelf: 'flex-end' },
  bubbleText: {},
  voiceControls: { padding: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem', backgroundColor: '#fff' },
  micBtn: { flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontWeight: 700, cursor: 'pointer', transition: '0.2s' },
  micActive: { backgroundColor: '#ef4444', animation: 'pulse 1.5s infinite' },
  stopBtn: { padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 600 }
};

export default LearningLibrary;
