/**
 * HomePage.tsx — Student Home Dashboard
 *
 * Central hub after login. Shows:
 * - Welcome header with user name
 * - Quick stats (activities, profile)
 * - Learning path cards to freely navigate
 * - Recent activity feed from Firestore
 * - "Talk to Aurora" button for re-assessment
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { getUserStats, updateLastActive, logActivity, type UserStats } from '../services/activityService';
import { getRouteForProfile } from '../utils/profileRoutes';
import { askGemini } from '../utils/geminiChat';
import type { Message } from '../utils/geminiChat';

// ── TTS Helpers ───────────────────────────────────────────────────────────────
function speak(text: string, onEnd?: () => void): void {
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.9; u.pitch = 1; u.volume = 1;
  if (onEnd) u.onend = onEnd;
  synth.speak(u);
}
function stopSpeaking(): void { window.speechSynthesis.cancel(); }

const LEARNING_PATHS = [
  { key: 'learning',  label: 'Dyslexia',              icon: '📖', color: '#38bdf8', route: '/dyslexia',             desc: 'Phonics, fluency & reading strategies' },
  { key: 'visual',    label: 'Visual Impairment',      icon: '👁️', color: '#a78bfa', route: '/visual-impairment',    desc: 'Voice-first, high contrast environment' },
  { key: 'adhd',      label: 'ADHD',                   icon: '🎯', color: '#f97316', route: '/adhd',                desc: 'Focus tools, timers & organisation' },
  { key: 'autism',    label: 'Autism Spectrum',        icon: '🌿', color: '#34d399', route: '/autism',              desc: 'Predictable, calm structured learning' },
  { key: 'physical',  label: 'Physical Accessibility', icon: '🦾', color: '#f87171', route: '/physical-disability', desc: 'Adaptive input & video captioning' },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // ── Voice Assistant State ──────────────────────────────────────────────────
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceMessages, setVoiceMessages] = useState<Message[]>([]);
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(voiceMessages);
  const statsRef = useRef(stats);
  useEffect(() => { messagesRef.current = voiceMessages; }, [voiceMessages]);
  useEffect(() => { statsRef.current = stats; }, [stats]);
  useEffect(() => { if (isVoiceMode) chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [voiceMessages, isVoiceMode]);

  // Greet on first open
  useEffect(() => {
    if (isVoiceMode && voiceMessages.length === 0) {
      const name = statsRef.current?.name || 'Student';
      const profile = statsRef.current?.disabilityProfile;
      const profileName = profile ? ({ autism: 'Autism Spectrum', adhd: 'ADHD', learning: 'Dyslexia', visual: 'Visual Impairment', physical: 'Physical Accessibility' }[profile] || profile) : null;
      const greeting = profileName
        ? `Hi ${name}! I can help you navigate. You're on the ${profileName} learning path. Say "start learning" to continue, or ask me anything.`
        : `Hi ${name}! I'm your voice assistant. Say "start learning", "talk to Aurora", or ask me about any of the learning paths.`;
      setVoiceMessages([{ sender: 'ai', text: greeting }]);
      speak(greeting);
    }
  }, [isVoiceMode]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const load = async () => {
          try {
            await updateLastActive();
            await logActivity('dashboard', 'Student Portal', 'Home', 'page_visit');
            const data = await getUserStats();
            if (!data) setDbError('Firestore connectivity issue. Ensure your rules allow read/write.');
            setStats(data);
          } catch (e: any) {
            setDbError(e.message || 'Failed to connect to Firebase.');
          }
          setLoading(false);
        };
        load();
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  // ── Voice: STT ────────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    stopSpeaking();
    const rec = new SR();
    rec.continuous = false; rec.interimResults = true; rec.lang = 'en-US';
    rec.onstart = () => setListening(true);
    rec.onend   = () => setListening(false);
    rec.onresult = (event: any) => {
      const result = Array.from(event.results as SpeechRecognitionResultList).map((r: any) => r[0].transcript).join('');
      setTranscript(result);
      if (event.results[event.results.length - 1].isFinal) {
        handleVoiceMessage(result.trim());
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

  // ── Voice: Command processor ───────────────────────────────────────────────
  const processHomeCommand = (text: string): boolean => {
    const lower = text.toLowerCase();

    if (lower.match(/^(stop|silence|quiet|hush|shut up)$/)) { stopSpeaking(); return true; }

    // Navigation commands
    const navMap: [RegExp, string, string][] = [
      [/\b(start learning|continue|my path|my page|my profile)\b/, getRouteForProfile(statsRef.current?.disabilityProfile), `Opening your learning environment.`],
      [/\b(aurora|re-assess|reassess|change profile|onboarding)\b/, '/onboarding', 'Taking you to Aurora.'],
      [/\b(dyslexia|reading|literacy)\b/, '/dyslexia', 'Opening the Dyslexia learning center.'],
      [/\b(visual|blind|sight|impairment)\b/, '/visual-impairment', 'Opening the Visual Impairment environment.'],
      [/\b(adhd|attention|focus)\b/, '/adhd', 'Opening the ADHD learning center.'],
      [/\b(autism|spectrum|sensory)\b/, '/autism', 'Opening the Autism learning center.'],
      [/\b(physical|deaf|hearing|adaptive)\b/, '/physical-disability', 'Opening the Physical Accessibility center.'],
    ];

    for (const [regex, route, msg] of navMap) {
      if (regex.test(lower)) {
        setVoiceMessages(prev => [...prev, { sender: 'ai', text: msg }]);
        speak(msg, () => navigate(route));
        return true;
      }
    }

    // Stats readout
    if (lower.match(/\b(my stats|how many|activities|lessons|progress)\b/)) {
      const s = statsRef.current;
      const completed = s?.recentActivity?.filter(a => a.action === 'lesson_complete').length || 0;
      const total = s?.totalActivities || 0;
      const profile = s?.disabilityProfile ? ({ autism: 'Autism Spectrum', adhd: 'ADHD', learning: 'Dyslexia', visual: 'Visual Impairment', physical: 'Physical Accessibility' }[s.disabilityProfile] || s.disabilityProfile) : 'not set';
      const msg = `You have logged ${total} activities and completed ${completed} lessons. Your current learning profile is ${profile}.`;
      setVoiceMessages(prev => [...prev, { sender: 'ai', text: msg }]);
      speak(msg);
      return true;
    }

    // Sign out
    if (lower.match(/\b(sign out|log out|logout|signout|exit)\b/)) {
      const msg = 'Signing you out now. Goodbye!';
      setVoiceMessages(prev => [...prev, { sender: 'ai', text: msg }]);
      speak(msg, () => handleLogout());
      return true;
    }

    return false;
  };

  const handleVoiceMessage = async (text: string) => {
    if (!text) return;
    const userMsg: Message = { sender: 'user', text };
    setVoiceMessages(prev => [...prev, userMsg]);
    if (processHomeCommand(text)) return;
    setThinking(true);
    const reply = await askGemini(text, [...messagesRef.current, userMsg]);
    setThinking(false);
    setVoiceMessages(prev => [...prev, { sender: 'ai', text: reply }]);
    speak(reply);
  };

  // ── Voice Panel ────────────────────────────────────────────────────────────
  const renderVoicePanel = () => {
    if (!isVoiceMode) return null;
    return (
      <aside style={vp.panel}>
        <div style={vp.header}>
          <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 800 }}>🎙️ Voice Assistant</h2>
          <span style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: '0.2rem' }}>Say "start learning", "my stats", or ask anything</span>
        </div>
        <div style={vp.messages}>
          {voiceMessages.map((m, i) => (
            <div key={i} style={{ ...vp.bubble, ...(m.sender === 'user' ? vp.userBubble : vp.aiBubble) }}>{m.text}</div>
          ))}
          {thinking && <div style={{ ...vp.bubble, ...vp.aiBubble }}>Thinking...</div>}
          {transcript && <div style={{ ...vp.bubble, ...vp.userBubble, opacity: 0.6 }}>{transcript}</div>}
          <div ref={chatBottomRef} />
        </div>
        <div style={vp.controls}>
          <button style={{ ...vp.micBtn, ...(listening ? vp.micActive : {}) }} onClick={listening ? stopListening : startListening}>
            {listening ? '⏹ Stop' : '🎤 Speak'}
          </button>
          <button style={vp.silenceBtn} onClick={stopSpeaking}>🔇 Silence</button>
        </div>
      </aside>
    );
  };

  const profileLabel = (p: string | null) => {
    if (!p) return 'Not set';
    const map: Record<string, string> = {
      autism: 'Autism Spectrum', adhd: 'ADHD', learning: 'Dyslexia',
      visual: 'Visual Impairment', physical: 'Physical Accessibility',
    };
    return map[p] || p;
  };

  const actionLabel = (a: string) => {
    const map: Record<string, string> = {
      lesson_complete: '📗 Completed Lesson',
      assignment_complete: '✏️ Completed Assignment',
      course_complete: '🎉 Finished Course',
      page_visit: '👀 Visited',
    };
    return map[a] || a;
  };

  if (loading) {
    return (
      <div style={s.loadingPage}>
        <div style={s.spinner} />
        <p style={{ color: '#718096', marginTop: '1rem', fontFamily: "'Inter', sans-serif" }}>Loading your dashboard...</p>
      </div>
    );
  }

  const name = stats?.name || 'Student';
  const currentProfile = stats?.disabilityProfile || null;
  const currentRoute = getRouteForProfile(currentProfile);
  const activePathInfo = LEARNING_PATHS.find(p => p.key === currentProfile);

  const lessonsCompleted = stats?.recentActivity?.filter(a => a.action === 'lesson_complete').length || 0;

  return (
    <div style={s.page}>
      {/* ── HERO HEADER ─────────────────────────────────────────────── */}
      <header style={s.hero}>
        <div style={s.heroGradient} />
        <div style={s.heroContent}>
          <div>
            <p style={s.greeting}>Welcome back 👋</p>
            <h1 style={s.heroName}>{name}</h1>
            <p style={s.heroEmail}>{stats?.email}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              style={{ ...s.voiceToggleBtn, ...(isVoiceMode ? s.voiceToggleActive : {}) }}
              onClick={() => setIsVoiceMode(!isVoiceMode)}
            >
              🎙️ Voice Assistant
            </button>
            <button style={s.auroraBtn} onClick={() => navigate('/onboarding')}>
              <span>✨</span> Talk to Aurora
            </button>
            <button style={s.logoutBtn} onClick={handleLogout}>Sign Out</button>
          </div>
        </div>
      </header>

      <div style={s.bodyFlex}>
      <div style={s.body}>
        {dbError && (
          <div style={s.errorBanner}>
            <strong>Database Error:</strong> {dbError}
          </div>
        )}

        {/* ── STATS ROW ────────────────────────────────────────────── */}
        <div style={s.statsRow}>
          {[
            { icon: '📚', value: stats?.totalActivities || 0,  label: 'Activities Logged' },
            { icon: '🔥', value: lessonsCompleted,               label: 'Lessons Completed' },
            { icon: '🎓', value: profileLabel(currentProfile),   label: 'Learning Profile' },
          ].map((stat, i) => (
            <div key={i} style={s.statCard}>
              <span style={s.statIcon}>{stat.icon}</span>
              <span style={s.statValue}>{stat.value}</span>
              <span style={s.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* ── MAIN CTA CARD ─────────────────────────────────────────── */}
        <section style={s.section}>
          <div style={{
            ...s.ctaCard,
            borderLeft: `5px solid ${activePathInfo?.color || '#4299e1'}`,
          }}>
            <div style={s.ctaLeft}>
              <span style={{ fontSize: '3rem', lineHeight: 1 }}>{activePathInfo?.icon || '🚀'}</span>
              <div>
                <h2 style={s.ctaTitle}>
                  {activePathInfo ? `Continue ${activePathInfo.label}` : 'Ready to start learning?'}
                </h2>
                <p style={s.ctaDesc}>
                  {activePathInfo?.desc || 'Talk to Aurora above to set up your personalized learning path.'}
                </p>
              </div>
            </div>
            <button
              style={{ ...s.ctaBtn, background: `linear-gradient(135deg, ${activePathInfo?.color || '#4299e1'}, ${activePathInfo?.color || '#9f7aea'}cc)` }}
              onClick={() => navigate(currentRoute)}
            >
              Continue Learning →
            </button>
          </div>
        </section>

        {/* ── ALL LEARNING PATHS ───────────────────────────────────── */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>All Learning Environments</h2>
          <p style={s.sectionSub}>Explore any path — your progress is saved across all of them.</p>
          <div style={s.pathGrid}>
            {LEARNING_PATHS.map((path) => {
              const isActive = path.key === currentProfile;
              return (
                <div
                  key={path.key}
                  style={{
                    ...s.pathCard,
                    borderTop: `4px solid ${path.color}`,
                    boxShadow: isActive ? `0 4px 20px ${path.color}30` : '0 1px 4px rgba(0,0,0,0.06)',
                  }}
                  onClick={() => navigate(path.route)}
                >
                  {isActive && <span style={s.activeBadge}>Current</span>}
                  <span style={{ fontSize: '2.25rem', lineHeight: 1, marginBottom: '0.75rem', display: 'block' }}>{path.icon}</span>
                  <h3 style={s.pathTitle}>{path.label}</h3>
                  <p style={s.pathDesc}>{path.desc}</p>
                  <span style={{ ...s.pathLink, color: path.color }}>Open →</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── RECENT ACTIVITY ──────────────────────────────────────── */}
        <section style={s.section}>
          <h2 style={s.sectionTitle}>Recent Activity</h2>
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div style={s.activityList}>
              {stats.recentActivity.map((entry, i) => (
                <div key={i} style={{ ...s.activityItem, borderBottom: i < stats.recentActivity!.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                  <span style={s.activityAction}>{actionLabel(entry.action)}</span>
                  <span style={s.activityCourse}>{entry.courseName} — {entry.section}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={s.emptyState}>
              <p style={{ fontSize: '2.5rem', margin: '0 0 0.75rem 0' }}>📭</p>
              <p style={s.emptyText}>No activity yet. Start a learning path above to track your progress!</p>
            </div>
          )}
        </section>
      </div>
      {renderVoicePanel()}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
      `}</style>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f7fafc',
    fontFamily: "'Inter', system-ui, sans-serif",
  },

  loadingPage: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#f7fafc',
  },
  spinner: {
    width: '2.5rem', height: '2.5rem', border: '3px solid #e2e8f0',
    borderTopColor: '#4299e1', borderRadius: '50%', animation: 'spin 0.8s linear infinite',
  },

  // Hero
  hero: {
    position: 'relative', overflow: 'hidden',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #1a1035 100%)',
    padding: '3rem 2rem',
  },
  heroGradient: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    background: 'radial-gradient(ellipse at 80% 50%, rgba(99,102,241,0.18) 0%, transparent 65%), radial-gradient(ellipse at 20% 80%, rgba(56,189,248,0.12) 0%, transparent 60%)',
  },
  heroContent: {
    position: 'relative', maxWidth: '1200px', margin: '0 auto',
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    flexWrap: 'wrap', gap: '1.5rem',
  },
  greeting: { color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600, margin: '0 0 0.25rem 0', letterSpacing: '0.04em', textTransform: 'uppercase' },
  heroName: { color: '#fff', fontSize: '2.25rem', fontWeight: 900, margin: '0 0 0.4rem 0', letterSpacing: '-0.02em' },
  heroEmail: { color: '#64748b', fontSize: '0.9rem', margin: 0 },

  auroraBtn: {
    padding: '0.7rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: '#fff', border: 'none', borderRadius: '2rem',
    fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(99,102,241,0.4)', transition: 'transform 0.2s, opacity 0.2s',
  },
  voiceToggleBtn: {
    padding: '0.7rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
    backgroundColor: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(8px)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '2rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
    transition: 'all 0.2s',
  },
  voiceToggleActive: {
    backgroundColor: '#3b82f6', color: '#fff', border: '1px solid #60a5fa',
  },
  logoutBtn: {
    padding: '0.7rem 1.25rem', backgroundColor: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(8px)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '2rem', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
  },

  bodyFlex: { maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '2rem', padding: '2.5rem 2rem' },
  body: { flex: 1, minWidth: 0 },

  errorBanner: {
    backgroundColor: '#fed7d7', color: '#c53030', padding: '1rem',
    borderRadius: '0.75rem', marginBottom: '2rem', border: '1px solid #f56565',
    fontSize: '0.9rem',
  },

  // Stats
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem', marginBottom: '2.5rem',
  },
  statCard: {
    backgroundColor: '#fff', borderRadius: '1.25rem', padding: '1.75rem 1.5rem',
    border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
  },
  statIcon: { fontSize: '1.75rem', lineHeight: 1 },
  statValue: { fontSize: '1.4rem', fontWeight: 800, color: '#1a202c' },
  statLabel: { fontSize: '0.75rem', color: '#a0aec0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' },

  // CTA
  ctaCard: {
    backgroundColor: '#fff', borderRadius: '1.5rem', padding: '2rem 2.5rem',
    border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    gap: '2rem', flexWrap: 'wrap',
  },
  ctaLeft: { display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1, minWidth: '220px' },
  ctaTitle: { fontSize: '1.35rem', fontWeight: 800, color: '#1a202c', margin: '0 0 0.25rem 0' },
  ctaDesc: { fontSize: '0.95rem', color: '#718096', margin: 0 },
  ctaBtn: {
    padding: '0.9rem 2.25rem', color: '#fff', border: 'none',
    borderRadius: '2rem', fontWeight: 800, fontSize: '1rem',
    cursor: 'pointer', whiteSpace: 'nowrap',
    boxShadow: '0 4px 14px rgba(0,0,0,0.15)', transition: 'transform 0.2s, opacity 0.2s',
  },

  section: { marginBottom: '2.5rem' },
  sectionTitle: { fontSize: '1.35rem', fontWeight: 800, color: '#1a202c', margin: '0 0 0.3rem 0' },
  sectionSub: { color: '#a0aec0', fontSize: '0.9rem', margin: '0 0 1.25rem 0' },

  // Path grid
  pathGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '1.25rem',
  },
  pathCard: {
    backgroundColor: '#fff', borderRadius: '1.5rem', padding: '1.75rem',
    border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
    position: 'relative', display: 'flex', flexDirection: 'column',
  },
  activeBadge: {
    position: 'absolute', top: '1rem', right: '1rem', fontSize: '0.65rem',
    fontWeight: 800, backgroundColor: '#1a202c', color: '#fff',
    padding: '0.2rem 0.6rem', borderRadius: '2rem', textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  pathTitle: { fontSize: '1rem', fontWeight: 800, color: '#1a202c', margin: '0 0 0.35rem 0' },
  pathDesc: { fontSize: '0.85rem', color: '#718096', lineHeight: 1.5, flex: 1, margin: '0 0 1rem 0' },
  pathLink: { fontSize: '0.875rem', fontWeight: 700, marginTop: 'auto' },

  // Activity
  activityList: {
    backgroundColor: '#fff', borderRadius: '1.25rem', border: '1px solid #e2e8f0',
    overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  activityItem: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1rem 1.5rem', gap: '1rem', flexWrap: 'wrap',
  },
  activityAction: { fontWeight: 700, fontSize: '0.9rem', color: '#1a202c' },
  activityCourse: { fontSize: '0.85rem', color: '#718096' },
  emptyState: {
    textAlign: 'center', padding: '3.5rem 2rem', backgroundColor: '#fff',
    borderRadius: '1.25rem', border: '1px solid #e2e8f0',
  },
  emptyText: { color: '#a0aec0', fontSize: '0.95rem', margin: 0 },
};

const vp: Record<string, React.CSSProperties> = {
  panel: { width: '340px', backgroundColor: '#fff', borderRadius: '1.25rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0, height: 'calc(100vh - 350px)', position: 'sticky', top: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
  header: { padding: '1.25rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' },
  messages: { flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' },
  bubble: { padding: '0.85rem', borderRadius: '0.85rem', maxWidth: '90%', fontSize: '0.95rem', lineHeight: 1.5 },
  aiBubble: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', alignSelf: 'flex-start', color: '#1a202c' },
  userBubble: { backgroundColor: '#3182ce', color: '#fff', alignSelf: 'flex-end' },
  controls: { padding: '1.25rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.75rem', backgroundColor: '#f8fafc' },
  micBtn: { flex: 1, padding: '0.85rem', borderRadius: '0.75rem', border: 'none', backgroundColor: '#3182ce', color: '#fff', fontWeight: 700, cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' },
  micActive: { backgroundColor: '#e53e3e', animation: 'pulse 1.5s infinite' },
  silenceBtn: { padding: '0.85rem', borderRadius: '0.75rem', border: '1px solid #cbd5e0', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 600, color: '#4a5568', display: 'flex', alignItems: 'center', justifyContent: 'center' }
};

export default HomePage;
