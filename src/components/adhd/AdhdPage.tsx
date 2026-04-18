/**
 * AdhdPage.tsx — ADHD learning page (sub-page of /adhd-autism)
 *
 * Currently a placeholder. The Predictability Engine and course catalog
 * features are implemented under the Autism sub-section. ADHD-specific
 * features will be added here in a future sprint.
 */

import React from 'react';

const AdhdPage: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f0f4f8',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{
        textAlign: 'center',
        padding: '3rem',
        backgroundColor: '#ffffff',
        borderRadius: '1.25rem',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
        maxWidth: '480px',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🧠</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1a202c', marginBottom: '0.75rem' }}>
          Coming Soon
        </h1>
        <p style={{ color: '#718096', fontSize: '1rem', lineHeight: 1.7, margin: 0 }}>
          We are building a dedicated ADHD learning experience with automatic
          task breakdown and focus tools. Check back soon!
        </p>
      </div>
    </div>
  );
};

export default AdhdPage;
