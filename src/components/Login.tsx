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
import { useNavigate, Link } from 'react-router-dom';
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Step 1: Authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Step 2: Go to the student home dashboard
      navigate('/home');
    } catch (err: any) {
      setError(err.message);
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
