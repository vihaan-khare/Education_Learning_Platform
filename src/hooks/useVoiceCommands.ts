import { useEffect, useState, useRef, useCallback } from 'react';
import Fuse from 'fuse.js';

export interface VoiceCommand {
  id: string;
  phrases: string[]; // Variations of the command
  action: () => void;
  description: string;
}

export const useVoiceCommands = (
  commands: VoiceCommand[],
  isActive: boolean = true
) => {
  const [isListening, setIsListening] = useState(false);
  const [lastHeard, setLastHeard] = useState('');
  const recognitionRef = useRef<any>(null);
  const hasSpokenHintRef = useRef(false);
  
  // Flatten commands for fuse.js to match against individual phrases
  const flatCommandList = commands.flatMap(cmd => 
    cmd.phrases.map(phrase => ({ ...cmd, phrase }))
  );

  const fuseRef = useRef(new Fuse(flatCommandList, {
    keys: ['phrase'],
    threshold: 0.4, // Relaxed threshold for better recognition
    includeScore: true
  }));

  // Update fuse instance if commands change
  useEffect(() => {
    fuseRef.current = new Fuse(flatCommandList, {
      keys: ['phrase'],
      threshold: 0.4,
      includeScore: true
    });
  }, [commands]);

  const speakFallback = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    if (!isActive) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true; // Process interim results for faster detection
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      // Accumulate the transcript just like in VisualImpairment
      const result = Array.from(event.results as SpeechRecognitionResultList)
        .map((r: SpeechRecognitionResult) => r[0].transcript)
        .join('');
      
      // Strip punctuation so things like "submit answer." match "submit answer"
      const transcript = result.trim().toLowerCase().replace(/[.,!?]/g, '');
      if (!transcript) return;
      
      setLastHeard(transcript);

      // Prevent the microphone from hearing the computer's own Text-To-Speech voice
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
         return;
      }

      // Only process the command when the user has finished speaking (isFinal)
      if (event.results[event.results.length - 1].isFinal) {
        
        let bestMatch = null;

        // 1. Robust Substring Matching
        // Web Speech API spells words perfectly, so the main issue is extra words (e.g., "please select option c")
        const directMatch = flatCommandList.find(cmd => transcript.includes(cmd.phrase.toLowerCase()));
        
        if (directMatch) {
          bestMatch = directMatch;
        } else {
          // 2. Fallback to Fuzzy Match for actual misrecognitions
          const results = fuseRef.current.search(transcript);
          if (results.length > 0 && results[0].score !== undefined && results[0].score <= 0.5) {
            bestMatch = results[0].item;
          }
        }

        if (bestMatch) {
          console.log(`[Voice Command Match]: Matched "${bestMatch.id}" from "${transcript}"`);
          bestMatch.action();
        } else {
          console.log(`[Voice Command Unrecognized]: "${transcript}"`);
          if (!hasSpokenHintRef.current) {
            const availableList = commands.map(c => c.description).join(", ");
            speakFallback(`Command not recognized. You can say things like: ${availableList}`);
            hasSpokenHintRef.current = true;
          } else {
            speakFallback(`Command not recognized.`);
          }
        }
        
        // Optionally abort to restart cleanly for the next phrase
        recognition.abort();
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech Recognition Error:', event.error);
      if (event.error === 'not-allowed') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Auto-restart if it stops but should be active (continuous listener)
      if (isActive && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch(e) {
          console.error('Failed to restart recognition', e);
        }
      } else {
        setIsListening(false);
      }
    };

    try {
      recognition.start();
    } catch(e) {
      console.error('Failed to start recognition', e);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null; // Prevent restart loop on cleanup
        recognitionRef.current.stop();
      }
    };
  }, [isActive, commands, speakFallback]);

  return { isListening, lastHeard };
};
