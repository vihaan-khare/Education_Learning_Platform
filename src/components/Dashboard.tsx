import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Flame, Clock, CheckCircle } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAccessibility();

  const courses = [
    {
      id: 'astronomy',
      title: 'Introduction to Astronomy',
      description: 'Explore the stars, planets, and galaxies in our universe.',
      progress: 30,
      estimatedTime: '15 mins left',
    },
    {
      id: 'math',
      title: 'Everyday Mathematics',
      description: 'Practical math skills for everyday situations and problem solving.',
      progress: 0,
      estimatedTime: '20 mins total',
    }
  ];

  return (
    <div className="container focus-container mt-8">
      
      {/* Header section */}
      <div className="flex justify-between items-center mb-8 flex-col md:flex-row gap-4">
        <div>
          <h1 className="text-3xl mb-2">Welcome back, Student!</h1>
          <p className="text-lg opacity-80" style={{ opacity: 0.8 }}>Ready to learn something new today?</p>
        </div>
        
        {/* Streak Counter - great for ADHD gamification */}
        <div className="card flex items-center gap-4" style={{ padding: '1rem' }}>
          <div style={{ background: 'rgba(251, 191, 36, 0.2)', padding: '0.75rem', borderRadius: '50%' }}>
            <Flame color="#fbbf24" size={28} />
          </div>
          <div>
            <p className="font-bold text-xl">5 Day Streak!</p>
            <p style={{ fontSize: '0.875rem', opacity: 0.8 }}>Keep it up!</p>
          </div>
        </div>
      </div>

      <h2 className="text-2xl mb-4 font-bold">Your Courses</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {courses.map(course => (
          <div key={course.id} className="card flex flex-col justify-between" style={{ transition: 'transform 0.2s' }}>
            <div>
              <h3 className="text-xl mb-2 font-bold">{course.title}</h3>
              <p className="mb-4" style={{ opacity: 0.8, minHeight: '3rem' }}>{course.description}</p>
              
              <div className="flex items-center gap-2 mb-4" style={{ fontSize: '0.875rem', opacity: 0.7 }}>
                <Clock size={16} />
                <span>{profile === 'physical' || profile === 'learning' ? 'Untimed (Self-paced)' : course.estimatedTime}</span>
              </div>

              {/* Progress bar */}
              {course.progress > 0 && (
                <div className="mb-6">
                  <div className="flex justify-between mb-1" style={{ fontSize: '0.875rem' }}>
                    <span>Progress</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${course.progress}%`, height: '100%', background: 'var(--accent-color)', borderRadius: '4px' }}></div>
                  </div>
                </div>
              )}
            </div>

            <button 
              className="btn" 
              onClick={() => navigate(`/course/${course.id}`)}
              style={{ width: '100%' }}
            >
              {course.progress > 0 ? (
                <>Resume Course <PlayCircle size={18} /></>
              ) : (
                <>Start Course <PlayCircle size={18} /></>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Suggested next steps / bite-sized task */}
      <div className="card mt-8 hide-on-focus">
        <h2 className="text-xl mb-4 font-bold flex items-center gap-2">
          <CheckCircle color="var(--accent-color)" /> Daily Bite-Sized Goal
        </h2>
        <p className="mb-4">Review 3 key terms from Astronomy chapter 1.</p>
        <button className="btn btn-outline text-sm" style={{ padding: '0.5rem 1rem' }}>Start 2-min review</button>
      </div>

    </div>
  );
};

export default Dashboard;
