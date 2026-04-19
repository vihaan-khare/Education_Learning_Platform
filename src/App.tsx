import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AccessibilityProvider } from './context/AccessibilityContext';
import WelcomeGate from './components/WelcomeGate';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import CoursePlayer from './components/CoursePlayer';
import AccessibilityFAB from './components/AccessibilityFAB';
import Login from './components/Login';
import Register from './components/Register';
import HomePage from './components/HomePage';

// Disability-specific pages (user doesn't know which one they are on)
import Dyslexia from './components/pages/Dyslexia';
import PhysicalDisability from './components/pages/PhysicalDisability';
import QuadriplegiaLab from './components/pages/QuadriplegiaLab';
import VisualImpairment from './components/pages/VisualImpairment';
import AdhdPage from './components/adhd/AdhdPage';
import AutismPage from './components/adhd/AutismPage';
import AdminDashboard from './components/admin/AdminDashboard';
import SignConnect from './modules/signconnect/pages/SignConnect.jsx';

function App() {
  return (
    <AccessibilityProvider>
      <Router>
        <Routes>
          {/* Auth routes */}
          <Route path="/" element={<WelcomeGate />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* AI detection/onboarding — saves profile to Firestore */}
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Student Home Dashboard */}
          <Route path="/home" element={<HomePage />} />

          {/* Disability-specific pages — routed automatically after login */}
          <Route path="/dyslexia" element={<Dyslexia />} />
          <Route path="/physical-disability" element={<PhysicalDisability />} />
          <Route path="/physical-disability/quadriplegia" element={<QuadriplegiaLab />} />
          <Route path="/visual-impairment" element={<VisualImpairment />} />
          <Route path="/adhd" element={<AdhdPage onBack={() => window.location.href = '/home'} />} />
          <Route path="/autism" element={<AutismPage onBack={() => window.location.href = '/home'} />} />
          <Route path="/physical-disability/signconnect" element={<SignConnect />} />

          {/* Admin route */}
          <Route path="/admin" element={<AdminDashboard />} />

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
