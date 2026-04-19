/**
 * AutismPage.tsx — Neurodivergent learning library
 * 
 * Includes the Course Catalog, the rigid PredictabilityEngine,
 * and the Instruction Clarifier AI feature.
 */

import React, { useState, useEffect } from 'react';
import PredictabilityEngine from './PredictabilityEngine';
import InstructionClarifier from './InstructionClarifier';
import StepExpectationCard from './StepExpectation';
import { useAdminCourses } from '../../hooks/useAdminCourses';
import type { AdminCourse } from '../../hooks/useAdminCourses';
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

interface CourseSectionType {
  id: string;
  title: string;
  type: 'video' | 'article';
  embedUrl?: string;
  sourceLink: string;
  sourceLinkLabel: string;
  content: string;
  usePredictabilityEngine?: boolean;
}

interface CourseType {
  id: string;
  title: string;
  description: string;
  icon: string;
  sections: CourseSectionType[];
  assignments?: string[];
}

interface AutismPageProps {
  onBack?: () => void;
}

const SAMPLE_NEURO_TRANSCRIPT = `Neurodiversity refers to the variation in the human brain regarding sociability, learning, attention, mood, and other mental functions. It is a concept where neurological differences are recognized and respected as any other human variation. Conditions like ADHD, Autism, Dyspraxia, and Dyslexia are natural variations. Embracing neurodiversity means understanding these differences.`;

// We inject the fetched Wikipedia content into this in the useEffect
export const INITIAL_SECTIONS: CourseSectionType[] = [
  {
    id: 'video-neuro-overview',
    title: '📺 Video: Understanding Neurodiversity',
    type: 'video',
    embedUrl: 'https://www.youtube.com/embed/YtvP5A5OHpU',
    sourceLink: 'https://www.youtube.com/watch?v=YtvP5A5OHpU',
    sourceLinkLabel: 'Watch on YouTube ↗',
    content: SAMPLE_NEURO_TRANSCRIPT,
    usePredictabilityEngine: true,
  },
  {
    id: 'article-neuro-wiki',
    title: '📄 Article: Understanding Neurodiversity',
    type: 'article',
    sourceLink: 'https://en.wikipedia.org/wiki/Neurodiversity',
    sourceLinkLabel: 'Read full article on Wikipedia ↗',
    content: '', // Fetched dynamically
    usePredictabilityEngine: true,
  }
];

const WRITING_VIDEO: CourseSectionType = {
  id: 'video-writing-essay',
  title: '📺 Video: Structuring an Essay',
  type: 'video',
  embedUrl: 'https://www.youtube.com/embed/1vRzTzLdGFA',
  sourceLink: 'https://www.youtube.com/watch?v=1vRzTzLdGFA',
  sourceLinkLabel: 'Watch on YouTube ↗',
  content: 'Learn how to construct a well-flowing essay, from thesis statement to an engaging conclusion.',
  usePredictabilityEngine: true,
};

const WRITING_ARTICLE: CourseSectionType = {
  id: 'article-writing-tips',
  title: '📄 Article: Descriptive Language',
  type: 'article',
  sourceLink: 'https://en.wikipedia.org/wiki/Creative_writing',
  sourceLinkLabel: 'Read about Creative Writing ↗',
  content: 'Descriptive writing involves using sensory details and vivid vocabulary to paint a conceptual picture in the reader\'s mind. It moves beyond standard technical descriptions by engaging the emotions and senses.',
  usePredictabilityEngine: false,
};

const MATH_VIDEO: CourseSectionType = {
  id: 'video-math-logic',
  title: '📺 Video: Intro to Logic',
  type: 'video',
  embedUrl: 'https://www.youtube.com/embed/kIf_mE01Bpw',
  sourceLink: 'https://www.youtube.com/watch?v=kIf_mE01Bpw',
  sourceLinkLabel: 'Watch on YouTube ↗',
  content: 'An introduction to logic, truth tables, and fundamental proof structures in discrete mathematics.',
  usePredictabilityEngine: true,
};

const MATH_SECTION: CourseSectionType = {
  id: 'article-math-logic',
  title: '📄 Article: Logical Proofs and Sets',
  type: 'article',
  sourceLink: 'https://en.wikipedia.org/wiki/Mathematical_logic',
  sourceLinkLabel: 'Read about Mathematical Logic ↗',
  content: 'Mathematical logic is the study of formal logic within mathematics. Major subareas include model theory, proof theory, set theory, and recursion theory. Research in mathematical logic commonly addresses the mathematical properties of formal systems of logic such as their expressive or deductive power.',
  usePredictabilityEngine: false,
};

const SCIENCE_VIDEO: CourseSectionType = {
  id: 'video-science-thermo',
  title: '📺 Video: Laws of Thermodynamics',
  type: 'video',
  embedUrl: 'https://www.youtube.com/embed/8N1BxHgsoOw',
  sourceLink: 'https://www.youtube.com/watch?v=8N1BxHgsoOw',
  sourceLinkLabel: 'Watch on YouTube ↗',
  content: 'Exploring the standard laws of thermodynamics and how entropy fundamentally drives the behavior of the universe.',
  usePredictabilityEngine: true,
};

const SCIENCE_SECTION: CourseSectionType = {
  id: 'article-science-thermo',
  title: '📄 Article: Thermodynamics',
  type: 'article',
  sourceLink: 'https://en.wikipedia.org/wiki/Thermodynamics',
  sourceLinkLabel: 'Read about Thermodynamics ↗',
  content: 'Thermodynamics is a branch of physics that deals with heat, work, and temperature, and their relation to energy, entropy, and the physical properties of matter and radiation. The behavior of these quantities is governed by the four laws of thermodynamics.',
  usePredictabilityEngine: false,
};

const LEARNING_COURSES: CourseType[] = [
  {
    id: 'course-foundations',
    title: 'Foundations of Learning',
    description: 'A comprehensive introduction to cognitive styles.',
    icon: '🧩',
    sections: INITIAL_SECTIONS,
    assignments: [
      "Leverage your creative instincts to synthesize a comprehensive overview of how neurodiversity impacts daily functioning, making sure to weave in personal reflections.",
      "Ensure a cohesive flow in your presentation by outlining the historical context of neurodiversity without being rigidly tied to exact dates."
    ]
  },
  {
    id: 'course-creative-writing',
    title: 'Creative Writing Workshop',
    description: 'Practice translating teacher instructions and breaking down writing assignments.',
    icon: '📝',
    sections: [WRITING_VIDEO, WRITING_ARTICLE],
    assignments: [
      "Draft a compelling narrative discussing your summer experiences; feel free to elaborate extensively on any emotional journeys you undertook.",
      "Refine the structural logic of your previous essay to ensure that the concluding paragraph dramatically impacts the reader's broader understanding."
    ]
  },
  {
    id: 'course-maths',
    title: 'Mathematics: Discrete Logic',
    description: 'Explore the foundations of logic, sets, and rigorous mathematical proofs.',
    icon: '📐',
    sections: [MATH_VIDEO, MATH_SECTION],
    assignments: [
      "Develop a fluid and intuitive explanation of how set theory naturally extends into abstract algebra, keeping your definitions broad.",
      "Provide sufficient detail when explaining Gödel's incompleteness theorems such that a layperson can grasp the philosophical implications."
    ]
  },
  {
    id: 'course-science',
    title: 'Science: Thermodynamics',
    description: 'Focuses on the laws governing heat, energy, and entropy.',
    icon: '🔬',
    sections: [SCIENCE_VIDEO, SCIENCE_SECTION],
    assignments: [
      "Create an engaging visual representation of entropy's role in the universe, focusing more on the conceptual beauty rather than strict equations.",
      "Write an exploratory paper debating the practical limitations of the second law of thermodynamics in a hypothetical closed system."
    ]
  }
];

/** Map an AdminCourse from Firestore to a CourseSectionType the existing UI understands. */
function adminCourseToSection(item: AdminCourse): CourseSectionType {
  const isVideo = item.contentType === 'video_url';
  const isText  = item.contentType === 'text_content';

  // Convert a bare YouTube watch URL → embed URL
  const toEmbed = (url: string) =>
    url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/');

  return {
    id: `admin-${item.id}`,
    title: isVideo ? `📺 ${item.title}` : isText ? `📄 ${item.title}` : `🔗 ${item.title}`,
    type: isVideo ? 'video' : 'article',
    embedUrl: isVideo ? toEmbed(item.url) : undefined,
    sourceLink: item.url || '#',
    sourceLinkLabel: isVideo ? 'Watch on YouTube ↗' : 'Open resource ↗',
    content: item.description || '',
    usePredictabilityEngine: isVideo || isText,
  };
}

const AutismPage: React.FC<AutismPageProps> = ({ onBack }) => {
  const [sections, setSections] = useState<CourseSectionType[]>(INITIAL_SECTIONS);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>(INITIAL_SECTIONS[0].id);
  const [completedCourses, setCompletedCourses] = useState<Set<string>>(new Set());
  const [wikiContent, setWikiContent] = useState<string>('');
  
  // Explicit Progress Tracking
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  // Content Expectation Setting
  const [confirmedItems, setConfirmedItems] = useState<Set<string>>(new Set());
  // Focus Mode — reduces visual distractions
  const [isFocusMode, setIsFocusMode] = useState(false);

  // ── Admin-uploaded content from Firestore ────────────────────────────────
  const { courses: adminItems, loading: adminLoading } = useAdminCourses('autism');

  /** Merge static hardcoded courses + one dynamic card per admin upload. */
  const allCourses: CourseType[] = [
    ...LEARNING_COURSES,
    ...adminItems.map((item): CourseType => ({
      id: `admin-course-${item.id}`,
      title: item.title,
      description: item.description,
      icon: item.contentType === 'video_url' ? '🎬'
          : item.contentType === 'text_content' ? '📝'
          : item.contentType === 'game_url' ? '🎮' : '🔗',
      sections: [adminCourseToSection(item)],
      assignments: item.assignments,
    })),
  ];

  const confirmExpectation = (itemId: string) => {
    setConfirmedItems(prev => new Set(prev).add(itemId));
  };

  const handleLessonComplete = (courseId: string) => {
    setCompletedCourses(prev => new Set(prev).add(courseId));
  };
  
  const markItemComplete = (itemId: string) => {
    setCompletedItems(prev => new Set(prev).add(itemId));
  };

  // Pre-calculate progress for the auto-complete hook
  const activeCourse = allCourses.find(c => c.id === selectedCourseId) || allCourses[0];
  const totalCourseItems = activeCourse.sections.length + (activeCourse.assignments?.length || 0);
  const completedCount = activeCourse.sections.filter(s => completedItems.has(`${activeCourse.id}-${s.id}`)).length +
      (activeCourse.assignments?.filter((_, i) => completedItems.has(`${activeCourse.id}-assignment-${i}`)).length || 0);

  useEffect(() => {
    if (selectedCourseId && totalCourseItems > 0 && completedCount === totalCourseItems) {
       handleLessonComplete(selectedCourseId);
    }
  }, [completedCount, totalCourseItems, selectedCourseId]);

  // ── Voice Assistant State & Logic ──
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = React.useRef<any>(null);
  const chatBottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isVoiceMode) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isVoiceMode]);

  const stateRef = React.useRef({ selectedCourseId, activeSection, allCourses, messages });
  React.useEffect(() => {
    stateRef.current = { selectedCourseId, activeSection, allCourses, messages };
  }, [selectedCourseId, activeSection, allCourses, messages]);

  const startListening = React.useCallback(() => {
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
      const result = Array.from(event.results as SpeechRecognitionResultList).map((r: any) => r[0].transcript).join('');
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

  const stopListening = React.useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const processVoiceCommand = (text: string): boolean => {
    const lower = text.toLowerCase();
    if (lower.match(/^(stop|silence|pause|quiet|shut up|hush)$/)) {
      stopSpeaking();
      return true;
    }

    const { selectedCourseId, activeSection, allCourses } = stateRef.current;

    if (lower.includes('go back') || lower.includes('close') || (lower.match(/^(home|back)$/))) {
      if (selectedCourseId) {
        setSelectedCourseId(null);
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
        const txt = `Opening ${matchedCourse.title}.`;
        setMessages(prev => [...prev, { sender: 'ai', text: txt }]);
        speak(txt);
        return true;
      }
    }

    if (lower.includes('read section')) {
      const { selectedCourseId, activeSection, allCourses } = stateRef.current;
      if (selectedCourseId && activeSection) {
        const course = allCourses.find(c => c.id === selectedCourseId);
        const section = course?.sections.find(s => s.id === activeSection);
        if (section && section.content) {
          const txt = `Reading ${section.title}. ${section.content}`;
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

  const renderVoicePanel = () => {
    if (!isVoiceMode) return null;
    return (
      <aside style={{ width: '340px', backgroundColor: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0, height: 'calc(100vh - 150px)', position: 'sticky', top: '2rem' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
            <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800 }}>🎙️ Voice Assistant</h2>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ padding: '0.75rem', borderRadius: '0.75rem', maxWidth: '90%', fontSize: '0.95rem', lineHeight: 1.5, ...(m.sender === 'user' ? { backgroundColor: '#3b82f6', color: '#fff', alignSelf: 'flex-end' } : { backgroundColor: '#fff', border: '1px solid #e2e8f0', alignSelf: 'flex-start' }) }}>
                {m.text}
              </div>
            ))}
            {thinking && <div style={{ padding: '0.75rem', borderRadius: '0.75rem', maxWidth: '90%', fontSize: '0.95rem', lineHeight: 1.5, backgroundColor: '#fff', border: '1px solid #e2e8f0', alignSelf: 'flex-start' }}>Thinking...</div>}
            {transcript && <div style={{ padding: '0.75rem', borderRadius: '0.75rem', maxWidth: '90%', fontSize: '0.95rem', lineHeight: 1.5, backgroundColor: '#3b82f6', color: '#fff', alignSelf: 'flex-end', opacity: 0.6 }}>{transcript}</div>}
            <div ref={chatBottomRef} />
        </div>
        <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem', backgroundColor: '#fff' }}>
            <button style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', transition: '0.2s', ...(listening ? { backgroundColor: '#ef4444', animation: 'pulse 1.5s infinite' } : { backgroundColor: '#3b82f6' }) }} onClick={listening ? stopListening : startListening}>
              {listening ? '⏹ Stop' : '🎤 Speak'}
            </button>
            <button style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 600 }} onClick={stopSpeaking}>🔇 Silence</button>
        </div>
      </aside>
    );
  };

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/Neurodiversity');
        const data = await res.json();
        const articleText = data.extract || 'Could not load article content.';
        setWikiContent(articleText);

        setSections(prev =>
          prev.map(s =>
            s.id === 'article-neuro-wiki' ? { ...s, content: articleText } : s
          )
        );
      } catch (err) {
        console.error('[AutismPage] Failed to fetch Wikipedia article:', err);
      }
    };
    fetchArticle();
  }, []);

  if (!selectedCourseId) {
    return (
      <div style={isFocusMode ? focusStyles.page : styles.page}>
        <header style={isFocusMode ? focusStyles.header : styles.header}>
          {onBack && (
            <button style={styles.backButton} onClick={onBack}>
              ⬅ Back to Learning Paths
            </button>
          )}
          <h1 style={styles.courseTitle}>Learning Library</h1>
          {!isFocusMode && <p style={styles.courseSubtitle}>Select a module to begin</p>}

          {/* VOICE TOGGLE */}
          <button 
             style={{ ...styles.toggleBtn, marginRight: '1rem', backgroundColor: isVoiceMode ? '#3b82f6' : '#edf2f7', color: isVoiceMode ? '#fff' : '#000' }}
             onClick={() => setIsVoiceMode(!isVoiceMode)}
          >
             🎙️ Voice Assistant
          </button>
          
          {/* FOCUS MODE TOGGLE */}
          <button
            onClick={() => setIsFocusMode(f => !f)}
            style={isFocusMode ? focusStyles.toggleBtn : styles.toggleBtn}
          >
            {isFocusMode ? '💡 Exit Focus Mode' : '🎯 Enter Focus Mode'}
          </button>
        </header>
        <div style={{ display: 'flex', gap: '2rem' }}>
          <div style={{ flex: 1 }}>
            <div style={styles.catalogGrid}>
              {allCourses.map(course => {
                const hasSections = course.sections.length > 0;
                const hasAssignments = course.assignments && course.assignments.length > 0;
                
                const totalCourseItems = course.sections.length + (course.assignments?.length || 0);
                const courseCompletedCount = course.sections.filter(s => completedItems.has(`${course.id}-${s.id}`)).length +
                    (course.assignments?.filter((_, i) => completedItems.has(`${course.id}-assignment-${i}`)).length || 0);
                const progressPct = totalCourseItems > 0 ? Math.round((courseCompletedCount / totalCourseItems) * 100) : 0;
                const isAdminItem = course.id.startsWith('admin-course-');

                return (
                  <div 
                    key={course.id} 
                    style={{
                      ...styles.courseCardOverview,
                      ...(isAdminItem ? { borderColor: '#4f46e5', borderWidth: 2 } : {})
                    }}
                    onClick={() => {
                      if (hasSections || hasAssignments) {
                        setSelectedCourseId(course.id);
                        if (hasSections) {
                          const mergedSections = course.sections.map(sec => 
                            sec.id === 'article-neuro-wiki' && wikiContent
                              ? { ...sec, content: wikiContent }
                              : sec
                          );
                          setSections(mergedSections);
                          setActiveSection(mergedSections[0].id);
                        }
                      } else {
                        alert('This course module is coming soon!');
                      }
                    }}
                  >
                    {isAdminItem && (
                      <span style={{
                        position: 'absolute', top: '0.75rem', left: '0.75rem',
                        backgroundColor: '#4f46e5', color: '#fff',
                        fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem',
                        borderRadius: '2rem', letterSpacing: '0.05em', textTransform: 'uppercase'
                      }}>Admin</span>
                    )}
                    <div style={styles.courseIcon}>{course.icon}</div>
                    <h2 style={styles.courseCardTitle}>{course.title}</h2>
                    <p style={styles.courseCardDesc}>{course.description}</p>
                    
                    {(hasSections || hasAssignments) && !completedCourses.has(course.id) && (
                      <div style={{ width: '100%', marginTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#718096', marginBottom: '0.25rem', fontWeight: 600 }}>
                          <span>Step {courseCompletedCount} of {totalCourseItems}</span>
                          <span>{progressPct}%</span>
                        </div>
                        <div style={{ backgroundColor: '#e2e8f0', borderRadius: '1rem', height: '0.5rem', width: '100%', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${progressPct}%`, backgroundColor: '#4299e1', transition: 'width 0.3s ease' }} />
                        </div>
                      </div>
                    )}

                    {completedCourses.has(course.id) && (
                      <div style={styles.completedTag}>✓ Completed ({totalCourseItems}/{totalCourseItems} Steps)</div>
                    )}

                    {course.sections.length === 0 && (!course.assignments || course.assignments.length === 0) && (
                      <span style={styles.comingSoonBadge}>Coming Soon</span>
                    )}
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

  const hasSections = activeCourse.sections.length > 0;
  const hasAssignments = activeCourse.assignments && activeCourse.assignments.length > 0;

  const progressPct = totalCourseItems > 0 ? Math.round((completedCount / totalCourseItems) * 100) : 0;

  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
    <div style={{ flex: 1, ...(isFocusMode ? focusStyles.page : styles.page) }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <button style={styles.backButton} onClick={() => setSelectedCourseId(null)}>
          ⬅ Home
        </button>
        {/* VOICE TOGGLE inside course */}
        <button 
           style={{ ...styles.toggleBtn, marginRight: '1rem', backgroundColor: isVoiceMode ? '#3b82f6' : '#edf2f7', color: isVoiceMode ? '#fff' : '#000' }}
           onClick={() => setIsVoiceMode(!isVoiceMode)}
        >
           🎙️ Voice Assistant
        </button>

        {/* FOCUS MODE TOGGLE inside course */}
        <button
          onClick={() => setIsFocusMode(f => !f)}
          style={isFocusMode ? focusStyles.toggleBtn : styles.toggleBtn}
        >
          {isFocusMode ? '💡 Exit Focus Mode' : '🎯 Enter Focus Mode'}
        </button>
      </div>

      <header style={isFocusMode ? focusStyles.header : styles.header}>
        <h1 style={styles.courseTitle}>{activeCourse.title}</h1>
        {!isFocusMode && (
          <p style={styles.courseSubtitle}>A structured learning experience.</p>
        )}

        {/* EXPLICIT PROGRESS MAPPING */}
        <div style={{ marginTop: '1.5rem', backgroundColor: '#e2e8f0', borderRadius: '1rem', height: '1.25rem', overflow: 'hidden', width: '100%', maxWidth: '600px', margin: '1.5rem auto 0 auto' }}>
           <div style={{ height: '100%', width: `${progressPct}%`, backgroundColor: '#38a169', transition: 'width 0.3s ease' }} />
        </div>
        <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#4a5568', fontWeight: 600 }}>
          Course Progress: Step {completedCount} of {totalCourseItems} completed
        </p>
      </header>

      {hasSections && (
        <>
          {/* Hide tab bar in focus mode */}
          {!isFocusMode && (
            <div style={styles.tabBar}>
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  style={{
                    ...styles.tab,
                    ...(activeSection === section.id ? styles.tabActive : {}),
                  }}
                >
                  {section.title}
                </button>
              ))}
            </div>
          )}

          {sections.map(section => {
            if (section.id !== activeSection) return null;
            const itemKey = `${activeCourse.id}-${section.id}`;
            const isConfirmed = confirmedItems.has(itemKey);

            return (
              <div key={section.id} style={styles.sectionContainer}>
               
                {/* CONTENT EXPECTATION CARD — shown first */}
                {!isConfirmed && (
                  <StepExpectationCard
                    type="lesson"
                    title={section.title}
                    contentSnippet={section.content}
                    onBegin={() => confirmExpectation(itemKey)}
                  />
                )}

                {/* ACTUAL LESSON CONTENT — shown after expectation confirmed */}
                {isConfirmed && (
                  section.usePredictabilityEngine ? (
                    <PredictabilityEngine 
                      sectionId={section.id}
                      title={section.title}
                      type={section.type}
                      content={section.content}
                      embedUrl={section.embedUrl}
                      sourceLink={section.sourceLink}
                      sourceLinkLabel={section.sourceLinkLabel}
                      onComplete={() => markItemComplete(itemKey)}
                      onBackToLibrary={() => setSelectedCourseId(null)}
                    />
                  ) : (
                    <div style={styles.contentCard}>
                      {section.type === 'video' && section.embedUrl ? (
                        <div style={styles.videoWrapper}>
                          <iframe
                            src={section.embedUrl}
                            title={section.title}
                            style={styles.videoIframe}
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <div style={styles.articleContent}>
                          {section.content ? <p style={styles.articleText}>{section.content}</p> : <p>Loading...</p>}
                        </div>
                      )}
                      
                      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                         {!completedItems.has(itemKey) ? (
                           <button style={styles.primaryButton} onClick={() => markItemComplete(itemKey)}>
                             Mark Lesson Complete ✓
                           </button>
                         ) : (
                           <span style={{ color: '#38a169', fontWeight: 'bold' }}>✓ Lesson Completed</span>
                         )}
                      </div>
                    </div>
                  )
                )}
              </div>
            );
          })}
        </>
      )}

      {/* Render raw teacher assignments with the new Clarifier component */}
      {hasAssignments && (
        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#2d3748' }}>
            Course Assignments
          </h2>
          {activeCourse.assignments!.map((instruction, idx) => {
            const itemKey = `${activeCourse.id}-assignment-${idx}`;
            const isConfirmed = confirmedItems.has(itemKey);
            const label = `Assignment ${idx + 1}`;

            return (
              <div key={idx} style={{ marginBottom: '1.5rem' }}>
                {/* CONTENT EXPECTATION CARD — shown first */}
                {!isConfirmed && (
                  <StepExpectationCard
                    type="assignment"
                    title={label}
                    contentSnippet={instruction}
                    onBegin={() => confirmExpectation(itemKey)}
                  />
                )}

                {/* ACTUAL ASSIGNMENT CONTENT — shown after expectation confirmed */}
                {isConfirmed && (
                  <div style={{ ...styles.contentCard, padding: '1.5rem' }}>
                    <InstructionClarifier rawInstruction={instruction} />
                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                       {!completedItems.has(itemKey) ? (
                         <button style={styles.primaryButton} onClick={() => markItemComplete(itemKey)}>
                           Mark Assignment Complete ✓
                         </button>
                       ) : (
                         <span style={{ color: '#38a169', fontWeight: 'bold' }}>✓ Assignment Completed</span>
                       )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
    {renderVoicePanel()}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f0f4f8',
    fontFamily: "'Inter', system-ui, sans-serif",
    color: '#2d3748',
    padding: '2rem',
    maxWidth: '900px',
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '2rem',
    paddingBottom: '1.5rem',
    borderBottom: '2px solid #e2e8f0',
  },
  courseTitle: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#1a202c',
    margin: '0 0 0.5rem 0',
  },
  courseSubtitle: {
    fontSize: '1rem',
    color: '#718096',
    margin: 0,
  },
  catalogGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1.5rem',
    marginTop: '2rem'
  },
  courseCardOverview: {
    backgroundColor: '#ffffff',
    borderRadius: '1rem',
    padding: '2rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative'
  },
  courseIcon: {
    fontSize: '3rem',
    marginBottom: '1rem'
  },
  courseCardTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#2d3748',
    marginBottom: '0.5rem',
    marginTop: 0
  },
  courseCardDesc: {
    fontSize: '0.95rem',
    color: '#718096',
    flex: 1
  },
  completedTag: {
    marginTop: '0.5rem',
    color: '#38a169',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    backgroundColor: '#f0fff4',
    padding: '0.25rem 0.75rem',
    borderRadius: '1rem'
  },
  comingSoonBadge: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    backgroundColor: '#edf2f7',
    color: '#718096',
    padding: '0.25rem 0.75rem',
    borderRadius: '1rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase'
  },
  toggleContainer: {
    marginTop: '1.5rem',
    display: 'inline-block',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#ebf8ff',
    borderRadius: '2rem',
    border: '1px solid #90cdf4',
  },
  toggleLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    gap: '0.75rem',
  },
  toggleInput: {
    width: '1.2rem',
    height: '1.2rem',
    cursor: 'pointer',
  },
  toggleText: {
    fontWeight: 600,
    color: '#2b6cb0',
    fontSize: '0.95rem'
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: '#4299e1',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: '1.5rem',
    padding: 0,
    fontSize: '1rem'
  },
  tabBar: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.5rem',
  },
  tab: {
    flex: 1,
    padding: '0.85rem 1rem',
    borderRadius: '0.5rem',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    color: '#4a5568',
    fontWeight: 500,
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'background-color 0.15s, border-color 0.15s',
  },
  tabActive: {
    backgroundColor: '#ebf4ff',
    borderColor: '#90cdf4',
    color: '#2b6cb0',
    fontWeight: 600,
  },
  sectionContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  contentCard: {
    backgroundColor: '#ffffff',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  videoWrapper: {
    position: 'relative',
    paddingBottom: '56.25%',
    height: 0,
  },
  videoIframe: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    border: 'none',
  },
  articleContent: {
    padding: '1.5rem',
  },
  articleText: {
    lineHeight: 1.8,
    fontSize: '1.05rem',
    color: '#2d3748',
    margin: 0,
  },
  primaryButton: {
    padding: '0.85rem 2rem',
    backgroundColor: '#3182ce',
    color: '#ffffff',
    border: 'none',
    borderRadius: '0.5rem',
    fontWeight: 'bold',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  toggleBtn: {
    marginTop: '1rem',
    padding: '0.5rem 1.25rem',
    backgroundColor: '#edf2f7',
    color: '#4a5568',
    border: '1.5px solid #cbd5e0',
    borderRadius: '2rem',
    fontWeight: 600,
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

// Overrides applied when Focus Mode is ON
const focusStyles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#fafaf8',   // warm off-white — less glare
    fontFamily: "'Inter', system-ui, sans-serif",
    color: '#2d3748',
    padding: '2rem',
    maxWidth: '680px',             // narrower column = less to scan
    margin: '0 auto',
    transition: 'all 0.3s ease',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #e2e8f0',  // thinner divider
  },
  toggleBtn: {
    marginTop: '1rem',
    padding: '0.5rem 1.25rem',
    backgroundColor: '#2d3748',
    color: '#f7fafc',
    border: 'none',
    borderRadius: '2rem',
    fontWeight: 600,
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default AutismPage;
