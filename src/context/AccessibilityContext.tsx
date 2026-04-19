import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
export type Theme = 'default' | 'dyslexia' | 'sensory' | 'high-contrast';
export type DisabilityProfile = 'none' | 'learning' | 'hearing' | 'physical' | 'adhd' | 'visual' | 'autism';

export interface AccessibilityState {
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

// ── Context ───────────────────────────────────────────────────────────────────
const AccessibilityCtx = createContext<AccessibilityState | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────
export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('default');
  const [distractionFree, setDistractionFree] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [profile, setProfile] = useState<DisabilityProfile>('none');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-distraction-free', distractionFree.toString());
  }, [distractionFree]);

  const applyProfileSettings = (newProfile: DisabilityProfile) => {
    setProfile(newProfile);
    switch (newProfile) {
      case 'learning':
        setTheme('dyslexia'); setTtsEnabled(true); setDistractionFree(false); break;
      case 'hearing':
        setTheme('default'); setTtsEnabled(false); setDistractionFree(false); break;
      case 'physical':
        setTheme('default'); setTtsEnabled(false); setDistractionFree(false); break;
      case 'adhd':
      case 'autism':
        setTheme('sensory'); setTtsEnabled(false); setDistractionFree(true); break;
      case 'visual':
        setTheme('high-contrast'); setTtsEnabled(true); setDistractionFree(false); break;
      default:
        setTheme('default'); setTtsEnabled(false); setDistractionFree(false);
    }
  };

  return (
    <AccessibilityCtx.Provider
      value={{ theme, setTheme, distractionFree, setDistractionFree, ttsEnabled, setTtsEnabled, profile, setProfile, applyProfileSettings }}
    >
      {children}
    </AccessibilityCtx.Provider>
  );
};

// ── Hook ──────────────────────────────────────────────────────────────────────
export const useAccessibility = () => {
  const context = useContext(AccessibilityCtx);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

// ── Re-export for backward compat with AccessibilityContextCore imports ───────
export { AccessibilityCtx as AccessibilityContext };
