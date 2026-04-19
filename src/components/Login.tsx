/**
 * Login.tsx
 * 
 * FLOW:
 * 1. User enters email + password
 * 2. Firebase Auth validates credentials
 * 3. On success, we fetch the user's Firestore document to read their
 *    stored 'disabilityProfile' — this was set during onboarding detection
 * 4. We use profileRoutes.ts to determine which page to redirect to
 * 5. The user is seamlessly taken to their personalized learning page
 *    (they never see which "disability page" they are on)
 * 
 * If no profile exists yet (e.g., old user), they are sent to /onboarding.
 */

import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getRouteForProfile } from '../utils/profileRoutes';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('audio') === 'true') {
      const synth = window.speechSynthesis;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(
        "You are on the Login page. Please press the Tab key to focus on the Email field. Type your email. Press Tab again to enter your password. Then press Enter to log in."
      );
      utterance.rate = 0.9;
      synth.speak(utterance);
    }
  }, [location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Step 1: Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Step 2: Fetch user document
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const data = userDoc.exists() ? userDoc.data() : null;

      // Step 3: Admin check FIRST — admins never go to disability pages
      if (data?.role === 'admin') {
        navigate('/admin');
        return;
      }

      // Step 4: Regular student — route by disability profile
      const profile = data?.disabilityProfile ?? null;
      let route = getRouteForProfile(profile);
      if (route === '/onboarding' && location.search.includes('audio=true')) {
        route += '?audio=true';
      }
      navigate(route);
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Incorrect email or password. Please check your credentials and try again.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please wait a few minutes before trying again.');
      } else if (code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container focus-container mt-8 flex flex-col items-center justify-center">
      <div className="card w-full max-w-md" style={{ maxWidth: '400px' }}>
        <h2 className="text-3xl mb-8 text-center font-bold">Login</h2>
        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="font-medium">Email</span>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required
              className="card"
              style={{ padding: '0.75rem', width: '100%' }}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-medium">Password</span>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required
              className="card"
              style={{ padding: '0.75rem', width: '100%' }}
            />
          </label>
          <button type="submit" className="btn mt-4" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="mt-4 text-center">
          Don't have an account? <Link to="/register" style={{ color: 'var(--accent-color)' }}>Register here</Link>.
        </p>


      </div>
    </div>
  );
};

export default Login;
