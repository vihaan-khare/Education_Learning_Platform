/**
 * PhysicalDisability.tsx — Physical Disability learning environment
 *
 * FLOW: Routed to when the user's Firestore disabilityProfile === 'physical'.
 *
 * STATUS: Placeholder — features to be built in a future sprint.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

const PhysicalDisability: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <button style={styles.backBtn} onClick={() => navigate('/home')}>← Back to Home</button>
      <div style={styles.card}>
        <div style={styles.icon}>♿</div>
        <h1 style={styles.title}>Your Learning Space</h1>
        <p style={styles.desc}>
          We are building an accessible learning environment with keyboard-first navigation,
          voice controls, and adaptive input options.
        </p>
        <div style={styles.badge}>Coming Soon</div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  backBtn: {
    padding: '0.6rem 1.25rem',
    backgroundColor: '#ffffff',
    color: '#4a5568',
    border: '1px solid #e2e8f0',
    borderRadius: '2rem',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    position: 'absolute',
    top: '2rem',
    left: '2rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f4f8',
    fontFamily: "'Inter', system-ui, sans-serif",
    padding: '2rem',
  },
  card: {
    textAlign: 'center',
    padding: '3rem 2.5rem',
    backgroundColor: '#ffffff',
    borderRadius: '1.25rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
    maxWidth: '480px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  icon: { fontSize: '4rem' },
  title: {
    fontSize: '2rem',
    fontWeight: 800,
    color: '#1a202c',
    margin: 0,
  },
  desc: {
    color: '#718096',
    fontSize: '1rem',
    lineHeight: 1.7,
    margin: 0,
  },
  badge: {
    marginTop: '0.5rem',
    padding: '0.4rem 1.25rem',
    backgroundColor: '#edf2f7',
    color: '#4a5568',
    borderRadius: '2rem',
    fontWeight: 700,
    fontSize: '0.85rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
};

export default PhysicalDisability;
