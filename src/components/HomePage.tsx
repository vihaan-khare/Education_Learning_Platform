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

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { getUserStats, updateLastActive, logActivity, type UserStats } from '../services/activityService';

import { getRouteForProfile } from '../utils/profileRoutes';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      await updateLastActive();
      await logActivity('dashboard', 'Student Portal', 'Home', 'page_visit');
      const data = await getUserStats();
      setStats(data);
      setLoading(false);
    };
    load();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const profileLabel = (p: string | null) => {
    if (!p) return 'Not set';
    const map: Record<string, string> = {
      autism: 'Autism Spectrum',
      adhd: 'ADHD',
      learning: 'Dyslexia & Literacy',
      visual: 'Visual Impairment',
      physical: 'Physical Accessibility',
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
        <p style={{ color: '#718096', marginTop: '1rem' }}>Loading your dashboard...</p>
      </div>
    );
  }

  const name = stats?.name || 'Student';

  return (
    <div style={s.page}>
      {/* TOP BAR */}
      <div style={s.topBar}>
        <div>
          <h1 style={s.welcome}>Welcome back, <span style={s.nameHighlight}>{name}</span> 👋</h1>
          <p style={s.sub}>{stats?.email}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button style={s.auroraBtn} onClick={() => navigate('/onboarding')}>
            💬 Talk to Aurora
          </button>
          <button style={s.logoutBtn} onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </div>

      {/* STATS ROW */}
      <div style={s.statsRow}>
        <div style={s.statCard}>
          <div style={s.statValue}>{stats?.totalActivities || 0}</div>
          <div style={s.statLabel}>Activities Logged</div>
        </div>
        <div style={s.statCard}>
          <div style={s.statValue}>{profileLabel(stats?.disabilityProfile || null)}</div>
          <div style={s.statLabel}>Current Profile</div>
        </div>
      </div>
      {/* DYNAMIC LEARNING BUTTON */}
      <section style={s.section}>
        <div style={s.mainActionCard}>
          <h2 style={s.mainActionTitle}>Ready to continue?</h2>
          <p style={s.mainActionDesc}>Jump right back into your personalized learning space.</p>
          <button 
            style={s.startLearningBtn} 
            onClick={() => {
              const route = getRouteForProfile(stats?.disabilityProfile);
              navigate(route);
            }}
          >
            Start Learning →
          </button>
        </div>
      </section>

      {/* RECENT ACTIVITY */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>📊 Recent Activity</h2>
        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
          <div style={s.activityList}>
            {stats.recentActivity.map((entry, i) => (
              <div key={i} style={s.activityItem}>
                <span style={s.activityAction}>{actionLabel(entry.action)}</span>
                <span style={s.activityCourse}>{entry.courseName} — {entry.section}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={s.emptyState}>
            <p style={s.emptyIcon}>📭</p>
            <p style={s.emptyText}>No activity yet. Start a learning path above to see your progress here!</p>
          </div>
        )}
      </section>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f7fafc',
    fontFamily: "'Inter', system-ui, sans-serif",
    padding: '2rem',
    maxWidth: '1100px',
    margin: '0 auto',
  },
  loadingPage: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7fafc',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  spinner: {
    width: '2.5rem',
    height: '2.5rem',
    border: '3px solid #e2e8f0',
    borderTopColor: '#4299e1',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '1rem',
    marginBottom: '2rem',
    paddingBottom: '1.5rem',
    borderBottom: '1px solid #e2e8f0',
  },
  welcome: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: '#1a202c',
    margin: 0,
  },
  nameHighlight: {
    background: 'linear-gradient(135deg, #4299e1, #9f7aea)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  sub: {
    color: '#a0aec0',
    fontSize: '0.9rem',
    margin: '0.25rem 0 0 0',
  },
  auroraBtn: {
    padding: '0.6rem 1.25rem',
    background: 'linear-gradient(135deg, #4299e1, #9f7aea)',
    color: '#fff',
    border: 'none',
    borderRadius: '2rem',
    fontWeight: 700,
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  logoutBtn: {
    padding: '0.6rem 1.25rem',
    backgroundColor: '#edf2f7',
    color: '#4a5568',
    border: '1px solid #e2e8f0',
    borderRadius: '2rem',
    fontWeight: 600,
    fontSize: '0.875rem',
    cursor: 'pointer',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2.5rem',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: '1rem',
    padding: '1.5rem',
    textAlign: 'center',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  statValue: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#2d3748',
    marginBottom: '0.25rem',
  },
  statLabel: {
    fontSize: '0.8rem',
    color: '#a0aec0',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  section: {
    marginBottom: '2.5rem',
  },
  sectionTitle: {
    fontSize: '1.35rem',
    fontWeight: 700,
    color: '#1a202c',
    margin: '0 0 0.25rem 0',
  },
  sectionSub: {
    color: '#a0aec0',
    fontSize: '0.9rem',
    margin: '0 0 1.25rem 0',
  },
  mainActionCard: {
    backgroundColor: '#fff',
    borderRadius: '1.25rem',
    padding: '3rem 2rem',
    textAlign: 'center',
    border: '2px dashed #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  mainActionTitle: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: '#2d3748',
    margin: 0,
  },
  mainActionDesc: {
    fontSize: '1rem',
    color: '#718096',
    margin: 0,
  },
  startLearningBtn: {
    padding: '1rem 2.5rem',
    background: '#48bb78',
    color: '#fff',
    border: 'none',
    borderRadius: '2rem',
    fontWeight: 800,
    fontSize: '1.2rem',
    cursor: 'pointer',
    marginTop: '1rem',
    boxShadow: '0 4px 14px rgba(72,187,120,0.3)',
    transition: 'transform 0.2s',
  },
  activityList: {
    backgroundColor: '#fff',
    borderRadius: '1rem',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  activityItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.25rem',
    borderBottom: '1px solid #f7fafc',
    gap: '1rem',
    flexWrap: 'wrap' as const,
  },
  activityAction: {
    fontWeight: 700,
    fontSize: '0.9rem',
    color: '#2d3748',
  },
  activityCourse: {
    fontSize: '0.85rem',
    color: '#718096',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '3rem 2rem',
    backgroundColor: '#fff',
    borderRadius: '1rem',
    border: '1px solid #e2e8f0',
  },
  emptyIcon: { fontSize: '2.5rem', margin: '0 0 0.5rem 0' },
  emptyText: { color: '#a0aec0', fontSize: '0.95rem', margin: 0 },
};

export default HomePage;
