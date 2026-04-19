import { useContext } from 'react';
import { AccessibilityContext } from '../context/AccessibilityContextCore';

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
