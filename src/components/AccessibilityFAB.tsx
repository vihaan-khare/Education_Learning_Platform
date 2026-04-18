import React, { useState } from 'react';
import { Settings, Eye, EyeOff, Type, Volume2, Maximize } from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';

const AccessibilityFAB: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    theme, setTheme, 
    distractionFree, setDistractionFree,
    ttsEnabled, setTtsEnabled
  } = useAccessibility();

  return (
    <div className="hide-on-focus" style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000 }}>
      {isOpen && (
        <div 
          className="card" 
          style={{ 
            position: 'absolute', 
            bottom: '4rem', 
            right: '0', 
            width: '250px', 
            padding: '1rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <h3 className="font-bold mb-3 pb-2 border-b" style={{ borderBottom: '1px solid var(--border-color)' }}>
            Accessibility Options
          </h3>
          
          <div className="flex flex-col gap-3">
            {/* Theme Toggle */}
            <div className="flex flex-col gap-1">
              <span style={{ fontSize: '0.875rem', opacity: 0.8 }}>Visual Theme</span>
              <select 
                value={theme} 
                onChange={(e) => setTheme(e.target.value as any)}
                style={{ 
                  padding: '0.5rem', 
                  borderRadius: '4px', 
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-color)',
                  color: 'var(--text-color)'
                }}
              >
                <option value="default">Default</option>
                <option value="dyslexia">Dyslexia Friendly</option>
                <option value="sensory">Sensory (Soft Colors)</option>
                <option value="high-contrast">High Contrast</option>
              </select>
            </div>

            {/* Distraction Free Toggle */}
            <label className="flex items-center justify-between mt-2" style={{ cursor: 'pointer' }}>
              <span className="flex items-center gap-2 text-sm">
                {distractionFree ? <EyeOff size={16} /> : <Eye size={16} />}
                Distraction Free
              </span>
              <input 
                type="checkbox" 
                checked={distractionFree} 
                onChange={(e) => setDistractionFree(e.target.checked)}
                style={{ transform: 'scale(1.2)' }}
              />
            </label>

            {/* TTS Toggle */}
            <label className="flex items-center justify-between" style={{ cursor: 'pointer' }}>
              <span className="flex items-center gap-2 text-sm">
                <Volume2 size={16} />
                Text to Speech
              </span>
              <input 
                type="checkbox" 
                checked={ttsEnabled} 
                onChange={(e) => setTtsEnabled(e.target.checked)}
                style={{ transform: 'scale(1.2)' }}
              />
            </label>
            
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          width: '56px', 
          height: '56px', 
          borderRadius: '50%', 
          backgroundColor: 'var(--accent-color)', 
          color: '#fff',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        aria-label="Accessibility Settings"
      >
        <Settings size={24} />
      </button>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AccessibilityFAB;
