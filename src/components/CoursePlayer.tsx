import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, VolumeX, FileText, Image as ImageIcon, LayoutList } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

const courseData = {
  astronomy: {
    title: 'Introduction to Astronomy',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', // sample video
    content: `Astronomy is the study of everything in the universe beyond Earth's atmosphere. That includes objects we can see with our naked eyes, like the Sun, the Moon, the planets, and the stars. It also includes objects we can only see with telescopes or other instruments, like faraway galaxies and tiny particles. And it even includes questions about things we can't see at all, like dark matter and dark energy.`,
    simplifiedContent: `Astronomy is the study of space. It looks at the Sun, Moon, planets, and stars. We use telescopes to see things that are far away. We also study things we cannot see, like dark matter.`,
    transcript: `[00:00] Welcome to Astronomy. [00:05] Today we will look at the stars. [00:10] The universe is vast and expanding. [00:15] Let's begin our journey.`,
  },
  math: {
    title: 'Everyday Mathematics',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    content: `Mathematics is essential for daily life. Budgeting, cooking, and even planning a trip require basic arithmetic. Understanding percentages helps with discounts during shopping, while fractions are crucial when following a recipe.`,
    simplifiedContent: `Math helps us every day. We use it for money, cooking, and travel. Percentages help with shopping sales. Fractions help us follow recipes.`,
    transcript: `[00:00] Math is everywhere. [00:03] Let's learn how to budget. [00:08] We will start with addition and subtraction.`,
  }
};

const CoursePlayer: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { ttsEnabled, profile } = useAccessibility();
  
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showSimplified, setShowSimplified] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'transcript'>('content');
  
  const course = courseData[(courseId as keyof typeof courseData) || 'astronomy'];
  const textRef = useRef<HTMLParagraphElement>(null);
  
  // TTS Logic
  useEffect(() => {
    const synth = window.speechSynthesis;
    
    if (!ttsEnabled && isPlayingAudio) {
      synth.cancel();
      setIsPlayingAudio(false);
    }
    
    return () => {
      synth.cancel();
    };
  }, [ttsEnabled, isPlayingAudio]);

  const toggleAudio = () => {
    const synth = window.speechSynthesis;
    
    if (isPlayingAudio) {
      synth.cancel();
      setIsPlayingAudio(false);
      
      // Remove highlight
      if (textRef.current) {
        textRef.current.innerHTML = showSimplified ? course.simplifiedContent : course.content;
      }
    } else {
      const textToSpeak = showSimplified ? course.simplifiedContent : course.content;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      // Attempt to highlight text (simplified version for MVP)
      if (textRef.current) {
        textRef.current.classList.add('tts-highlight');
      }

      utterance.onend = () => {
        setIsPlayingAudio(false);
        if (textRef.current) {
          textRef.current.classList.remove('tts-highlight');
        }
      };
      
      synth.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  if (!course) return <div>Course not found</div>;

  return (
    <div className="container focus-container mt-4">
      <button 
        className="btn btn-outline mb-6" 
        onClick={() => {
          window.speechSynthesis.cancel();
          navigate('/dashboard');
        }}
        style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="card hide-on-focus mb-6" style={{ padding: '1rem', backgroundColor: 'var(--bg-color)' }}>
        <h1 className="text-2xl font-bold">{course.title}</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* Left Column: Media */}
        <div>
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 'var(--radius-base)' }}>
            <video 
              controls 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: '#000' }}
              // In a real app, track elements for captions would be here
            >
              <source src={course.videoUrl} type="video/mp4" />
              <track kind="captions" srcLang="en" label="English" default={profile === 'hearing'} />
              Your browser does not support the video tag.
            </video>
          </div>
          
          {profile === 'hearing' && (
            <div className="mt-4 p-4 card" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--accent-color)' }}>
              <h3 className="font-bold flex items-center gap-2 mb-2"><LayoutList size={18} /> Visual Diagram</h3>
              <div style={{ height: '100px', background: 'var(--border-color)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImageIcon color="var(--text-color)" opacity={0.5} size={32} />
                <span className="ml-2" style={{ opacity: 0.7 }}>Infographic representation</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Text Content & Accessibility tools */}
        <div>
          {/* Tabs */}
          <div className="flex border-b mb-4 hide-on-focus" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <button 
              className={`pb-2 px-4 font-bold ${activeTab === 'content' ? 'border-b-2 border-blue-500' : 'opacity-60'}`}
              style={{ borderBottom: activeTab === 'content' ? '2px solid var(--accent-color)' : 'none', background: 'none', color: 'var(--text-color)', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}
              onClick={() => setActiveTab('content')}
            >
              Lesson Content
            </button>
            <button 
              className={`pb-2 px-4 font-bold ${activeTab === 'transcript' ? 'border-b-2 border-blue-500' : 'opacity-60'}`}
              style={{ borderBottom: activeTab === 'transcript' ? '2px solid var(--accent-color)' : 'none', background: 'none', color: 'var(--text-color)', borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}
              onClick={() => setActiveTab('transcript')}
            >
              Transcript
            </button>
          </div>

          {activeTab === 'content' ? (
            <div className="card">
              {/* Content Toolbar */}
              <div className="flex justify-between items-center mb-6 pb-4 hide-on-focus" style={{ borderBottom: '1px solid var(--border-color)' }}>
                {ttsEnabled && (
                  <button 
                    onClick={toggleAudio}
                    className="flex items-center gap-2"
                    style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    {isPlayingAudio ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    {isPlayingAudio ? 'Stop Audio' : 'Read Aloud'}
                  </button>
                )}
                
                {(profile === 'learning' || profile === 'adhd') && (
                  <button 
                    onClick={() => setShowSimplified(!showSimplified)}
                    className="flex items-center gap-2"
                    style={{ background: 'none', border: 'none', color: 'var(--text-color)', cursor: 'pointer', opacity: 0.8 }}
                  >
                    <FileText size={18} />
                    {showSimplified ? 'Show Full Text' : 'Simplify Text'}
                  </button>
                )}
              </div>

              {/* Actual Content */}
              <div style={{ fontSize: '1.125rem' }}>
                <p ref={textRef} style={{ padding: '0.5rem', transition: 'background-color 0.3s' }}>
                  {showSimplified ? course.simplifiedContent : course.content}
                </p>
              </div>
            </div>
          ) : (
            <div className="card">
              <h3 className="font-bold mb-4">Video Transcript</h3>
              <p style={{ whiteSpace: 'pre-line', opacity: 0.9, lineHeight: 1.6 }}>
                {course.transcript}
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;
