import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'default' | 'dyslexia' | 'sensory' | 'high-contrast';
type DisabilityProfile = 'none' | 'learning' | 'hearing' | 'physical' | 'adhd' | 'visual' | 'autism';

interface AccessibilityState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  distractionFree: boolean;
  setDistractionFree: (value: boolean) => void;
  ttsEnabled: boolean;
  setTtsEnabled: (value: boolean) => void;
  profile: DisabilityProfile;
  setProfile: (profile: DisabilityProfile) => void;
  applyProfileSettings: (profile: DisabilityProfile) => void;
}

const AccessibilityContext = createContext<AccessibilityState | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('default');
  const [distractionFree, setDistractionFree] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [profile, setProfile] = useState<DisabilityProfile>('none');

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Apply distraction free mode to document
  useEffect(() => {
    document.documentElement.setAttribute('data-distraction-free', distractionFree.toString());
  }, [distractionFree]);

  const applyProfileSettings = (newProfile: DisabilityProfile) => {
    setProfile(newProfile);
    
    switch (newProfile) {
      case 'learning':
        setTheme('dyslexia');
        setTtsEnabled(true);
        setDistractionFree(false);
        break;
      case 'hearing':
        setTheme('default');
        setTtsEnabled(false);
        setDistractionFree(false);
        break;
      case 'physical':
        setTheme('default'); // Focus more on keyboard nav, handled by CSS and semantics
        setTtsEnabled(false);
        setDistractionFree(false);
        break;
      case 'adhd':
      case 'autism':
        setTheme('sensory');
        setTtsEnabled(false);
        setDistractionFree(true);
        break;
      case 'visual':
        setTheme('high-contrast');
        setTtsEnabled(true);
        setDistractionFree(false);
        break;
      default:
        setTheme('default');
        setTtsEnabled(false);
        setDistractionFree(false);
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        theme,
        setTheme,
        distractionFree,
        setDistractionFree,
        ttsEnabled,
        setTtsEnabled,
        profile,
        setProfile,
        applyProfileSettings
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
