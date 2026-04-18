import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  const navigate = useNavigate();

  const isMinor = parseInt(formData.age, 10) < 18;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isMinor && !formData.guardianPhone) {
      setError("Guardian's phone number is required for users under 18.");
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

      navigate('/onboarding');
    } catch (err: any) {
      setError(err.message);
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
          <button type="submit" className="btn mt-4">Register</button>
        </form>
        <p className="mt-4 text-center">
          Already have an account? <Link to="/login" style={{ color: 'var(--accent-color)' }}>Login here</Link>.
        </p>
      </div>
    </div>
  );
};

export default Register;
