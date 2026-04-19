import { useEffect, useState, useCallback, useRef } from 'react';

interface SwitchScannerOptions {
  isActive: boolean;
  scanSpeedMs: number; // e.g., 2000 for 2 seconds
  targetClass?: string; // default: 'scan-target'
}

export const useSwitchScanner = ({
  isActive,
  scanSpeedMs,
  targetClass = 'scan-target'
}: SwitchScannerOptions) => {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const elementsRef = useRef<HTMLElement[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Refresh the list of scan targets
  const refreshTargets = useCallback(() => {
    const els = Array.from(document.querySelectorAll(`.${targetClass}`)) as HTMLElement[];
    elementsRef.current = els;
  }, [targetClass]);

  // Advance to the next element
  const advanceScan = useCallback(() => {
    if (!isActive || elementsRef.current.length === 0) return;
    
    setCurrentIndex(prev => {
      const nextIndex = (prev + 1) % elementsRef.current.length;
      return nextIndex;
    });
  }, [isActive]);

  // Apply the highlight class directly to DOM for performance
  useEffect(() => {
    if (!isActive) {
      elementsRef.current.forEach(el => el.classList.remove('scan-highlight'));
      return;
    }

    elementsRef.current.forEach((el, idx) => {
      if (idx === currentIndex) {
        el.classList.add('scan-highlight');
        // Ensure element is visible in scroll view
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        el.classList.remove('scan-highlight');
      }
    });

  }, [currentIndex, isActive]);

  // Handle auto-scanning interval
  useEffect(() => {
    if (isActive) {
      refreshTargets();
      setCurrentIndex(0);
      intervalRef.current = setInterval(advanceScan, scanSpeedMs);
    } else {
      setCurrentIndex(-1);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, scanSpeedMs, advanceScan, refreshTargets]);

  // Expose a manual trigger function (for Voice, Spacebar, or Blink detection)
  const triggerSelect = useCallback(() => {
    if (!isActive || currentIndex === -1 || elementsRef.current.length === 0) return;
    const target = elementsRef.current[currentIndex];
    if (target) {
      // Provide visual feedback for selection
      target.classList.add('scan-selected');
      setTimeout(() => target.classList.remove('scan-selected'), 300);
      
      console.log('Switch triggered click on:', target);
      target.click();
      
      // Optionally reset scan to 0 after selection
      // setCurrentIndex(0);
    }
  }, [isActive, currentIndex]);

  // Keyboard Switch Binding (Spacebar / Enter)
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default scrolling for Spacebar when scanning is active
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        triggerSelect();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, triggerSelect]);

  return {
    currentIndex,
    triggerSelect, // Can be called externally by a "Blink Detector" component
    refreshTargets
  };
};
