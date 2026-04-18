/**
 * AdhdAutism.tsx — Sub-section selector for ADHD/Autism route
 *
 * Shows a selector to choose between ADHD sub-section (Coming Soon)
 * and the Autism Learning Library (full catalog experience).
 *
 * In production this will auto-select based on the user's Firestore
 * disabilityProfile. For now it provides a manual selector for development.
 */

import React, { useEffect, useState } from 'react';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import AdhdPage from '../adhd/AdhdPage';
import AutismPage from '../adhd/AutismPage';

type SubSection = 'adhd' | 'autism' | null;

const AdhdAutism: React.FC = () => {
  const [selected, setSelected] = useState<SubSection>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const profile = userDoc.data()?.disabilityProfile;
          if (profile === 'autism') setSelected('autism');
          else if (profile === 'adhd') setSelected('adhd');
        }
        // If no user, stay on null so subsection selector shows
      } catch (err) {
        console.error('[AdhdAutism] Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <p>Loading your learning experience...</p>
      </div>
    );
  }

  // Logged in user auto-routed — just render their page
  if (selected === 'autism') {
    return <AutismPage onBack={() => setSelected(null)} />;
  }
  if (selected === 'adhd') {
    return <AdhdPage />;
  }

  // No profile set (dev / unauthenticated) — show the sub-section selector
  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Choose Your Learning Path</h1>
        <p style={styles.subtitle}>Select the section that applies to you</p>
      </header>

      <div style={styles.grid}>
        {/* ADHD Card */}
        <div style={styles.card} onClick={() => setSelected('adhd')}>
          <div style={styles.cardIcon}>🧠</div>
          <h2 style={styles.cardTitle}>ADHD</h2>
          <p style={styles.cardDesc}>
            Structured learning with automatic task breakdown and step-by-step guidance.
          </p>
          <span style={styles.selectBtn}>Go to ADHD →</span>
        </div>

        {/* Autism Card */}
        <div style={{...styles.card, ...styles.cardHighlight}} onClick={() => setSelected('autism')}>
          <div style={styles.cardIcon}>✨</div>
          <h2 style={styles.cardTitle}>Autism</h2>
          <p style={styles.cardDesc}>
            Explore a structured course library with AI-powered clarity tools and knowledge checks.
          </p>
          <span style={{...styles.selectBtn, ...styles.selectBtnHighlight}}>Go to Library →</span>
        </div>
      </div>

      {/* Dev note */}
      <p style={styles.devNote}>
        ℹ️ In production, this page will automatically route based on your profile.
      </p>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  loadingScreen: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f4f8',
    fontFamily: "'Inter', system-ui, sans-serif",
    color: '#718096',
  },
  page: {
    minHeight: '100vh',
    backgroundColor: '#f0f4f8',
    fontFamily: "'Inter', system-ui, sans-serif",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
  },
  header: {
    textAlign: 'center',
    marginBottom: '3rem',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 800,
    color: '#1a202c',
    margin: '0 0 0.5rem 0',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#718096',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '2rem',
    width: '100%',
    maxWidth: '700px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '1.25rem',
    padding: '2.5rem 2rem',
    border: '2px solid #e2e8f0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '0.75rem',
  },
  cardHighlight: {
    borderColor: '#4299e1',
    boxShadow: '0 4px 20px rgba(66,153,225,0.15)',
  },
  cardIcon: {
    fontSize: '3rem',
  },
  cardTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#2d3748',
    margin: 0,
  },
  cardDesc: {
    fontSize: '0.95rem',
    color: '#718096',
    lineHeight: 1.6,
    margin: 0,
  },
  selectBtn: {
    marginTop: '0.5rem',
    padding: '0.6rem 1.5rem',
    backgroundColor: '#edf2f7',
    color: '#4a5568',
    borderRadius: '2rem',
    fontWeight: 600,
    fontSize: '0.9rem',
  },
  selectBtnHighlight: {
    backgroundColor: '#4299e1',
    color: '#ffffff',
  },
  devNote: {
    marginTop: '3rem',
    fontSize: '0.85rem',
    color: '#a0aec0',
  }
};

export default AdhdAutism;
