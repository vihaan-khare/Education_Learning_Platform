import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AccessibilityProvider } from './context/AccessibilityContext';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import CoursePlayer from './components/CoursePlayer';
import AccessibilityFAB from './components/AccessibilityFAB';

function App() {
  return (
    <AccessibilityProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/onboarding" replace />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/course/:courseId" element={<CoursePlayer />} />
        </Routes>
        <AccessibilityFAB />
      </Router>
    </AccessibilityProvider>
  );
}

export default App;
