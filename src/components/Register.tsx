import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    age: '',
    guardianPhone: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('audio') === 'true') {
      const synth = window.speechSynthesis;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(
        "You are on the Registration page. Please press Tab to enter your Name. Press Tab again for Email. Then Password, Phone Number, and Age. Then press Enter to create your account."
      );
      utterance.rate = 0.9;
      synth.speak(utterance);
    }
  }, [location]);

  const isMinor = parseInt(formData.age, 10) < 18;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');

    if (isMinor && !formData.guardianPhone) {
      setError("Guardian's phone number is required for users under 18.");
      setIsSubmitting(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        age: parseInt(formData.age, 10),
        guardianPhone: isMinor ? formData.guardianPhone : null,
        disabilityProfile: null
      });

      if (location.search.includes('audio=true')) {
        navigate('/onboarding?audio=true');
      } else {
        navigate('/onboarding');
      }
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login instead.');
      } else {
        setError(err.message || 'An error occurred during registration.');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container focus-container mt-8 flex flex-col items-center justify-center">
      <div className="card w-full" style={{ maxWidth: '500px' }}>
        <h2 className="text-3xl mb-8 text-center font-bold">Register</h2>
        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="font-medium">Name</span>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="card" style={{ padding: '0.75rem', width: '100%' }} />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-medium">Email</span>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="card" style={{ padding: '0.75rem', width: '100%' }} />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-medium">Password</span>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required className="card" style={{ padding: '0.75rem', width: '100%' }} />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-medium">Phone Number</span>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="card" style={{ padding: '0.75rem', width: '100%' }} />
          </label>
          <label className="flex flex-col gap-2">
            <span className="font-medium">Age</span>
            <input type="number" name="age" value={formData.age} onChange={handleChange} required className="card" style={{ padding: '0.75rem', width: '100%' }} />
          </label>
          {isMinor && formData.age !== '' && (
            <label className="flex flex-col gap-2 animate-fade-in">
              <span className="font-medium">Guardian's Phone Number</span>
              <input type="tel" name="guardianPhone" value={formData.guardianPhone} onChange={handleChange} required className="card" style={{ padding: '0.75rem', width: '100%' }} />
            </label>
          )}
          <button type="submit" disabled={isSubmitting} className="btn mt-4 flex justify-center items-center gap-2">
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-center">
          Already have an account? <Link to="/login" style={{ color: 'var(--accent-color)' }}>Login here</Link>.
        </p>
      </div>
    </div>
  );
};

export default Register;
