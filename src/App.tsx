/**
 * App.tsx — Root application component
 * 
 * ROUTING FLOW:
 *   / (root)            → Redirects to /login
 *   /login              → Login page
 *   /register           → Registration page
 *   /onboarding         → AI disability detection (camera + ML)
 *   
 *   After detection/login, the user is routed to ONE of these pages
 *   based on their stored 'disabilityProfile' in Firestore:
 *     /learning-disability  → For 'learning' profile
 *     /physical-disability  → For 'physical' profile
 *     /visual-impairment    → For 'visual' profile
 *     /adhd-autism           → For 'adhd' or 'autism' profile
 * 
 *   /dashboard          → Legacy dashboard (Coming Soon placeholder)
 *   /course/:courseId    → Legacy course player
 * 
 * The user does NOT see which disability page they are on.
 * The redirect is automatic and seamless via profileRoutes.ts.
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AccessibilityProvider } from './context/AccessibilityContext';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import CoursePlayer from './components/CoursePlayer';
import AccessibilityFAB from './components/AccessibilityFAB';
import Login from './components/Login';
import Register from './components/Register';

// Disability-specific pages (user doesn't know which one they are on)
import LearningDisability from './components/pages/LearningDisability';
import PhysicalDisability from './components/pages/PhysicalDisability';
import VisualImpairment from './components/pages/VisualImpairment';
import AdhdAutism from './components/pages/AdhdAutism';

function App() {
  return (
    <AccessibilityProvider>
      <Router>
        <Routes>
          {/* Auth routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* AI detection/onboarding — saves profile to Firestore */}
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Disability-specific pages — routed automatically after login */}
          <Route path="/learning-disability" element={<LearningDisability />} />
          <Route path="/physical-disability" element={<PhysicalDisability />} />
          <Route path="/visual-impairment" element={<VisualImpairment />} />
          <Route path="/adhd-autism" element={<AdhdAutism />} />

          {/* Legacy routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/course/:courseId" element={<CoursePlayer />} />
        </Routes>
        <AccessibilityFAB />
      </Router>
    </AccessibilityProvider>
  );
}

export default App;
