import React, { createContext, useState, useContext, type ReactNode } from 'react';

interface MotorAccessibilityState {
  isVoiceActive: boolean;
  setIsVoiceActive: (active: boolean) => void;
  isScannerActive: boolean;
  setIsScannerActive: (active: boolean) => void;
  scanSpeed: number;
  setScanSpeed: (speed: number) => void;
}

export const MotorAccessibilityContext = createContext<MotorAccessibilityState | undefined>(undefined);

export const MotorAccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scanSpeed, setScanSpeed] = useState(2000); // Default 2 seconds

  return (
    <MotorAccessibilityContext.Provider
      value={{
        isVoiceActive,
        setIsVoiceActive,
        isScannerActive,
        setIsScannerActive,
        scanSpeed,
        setScanSpeed
      }}
    >
      {children}
    </MotorAccessibilityContext.Provider>
  );
};

export const useMotorAccessibility = () => {
  const context = useContext(MotorAccessibilityContext);
  if (context === undefined) {
    throw new Error('useMotorAccessibility must be used within a MotorAccessibilityProvider');
  }
  return context;
};
