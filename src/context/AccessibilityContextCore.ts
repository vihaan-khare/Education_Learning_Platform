import { createContext } from 'react';

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

export const AccessibilityContext = createContext<AccessibilityState | undefined>(undefined);
