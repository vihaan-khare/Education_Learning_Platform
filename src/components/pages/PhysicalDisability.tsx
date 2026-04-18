/**
 * PhysicalDisability.tsx
 * 
 * FLOW: This page is shown to users whose detected disability profile
 * is 'physical'. The user is automatically routed here after login
 * (via profileRoutes.ts) or after onboarding detection.
 * 
 * The user does NOT know they are on a "Physical Disability" page —
 * it simply appears as their personalized learning environment.
 * 
 * STATUS: Placeholder — features to be implemented later.
 */

import React from 'react';

const PhysicalDisability: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Coming Soon!</h1>
    </div>
  );
};

export default PhysicalDisability;
