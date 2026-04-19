import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, Settings, UserCircle, Play, Scan, Volume2 } from 'lucide-react';
import { useVoiceCommands, type VoiceCommand } from '../../hooks/useVoiceCommands';
import { useSwitchScanner } from '../../hooks/useSwitchScanner';
import { MotorAccessibilityProvider, useMotorAccessibility } from '../../context/MotorAccessibilityContext';

// Quiz Question Data
const MOCK_LEVELS = [
  {
    id: 1,
    title: "Level 1: Basic Switch Scanning",
    questions: [
      {
        id: 1,
        text: "Which of the following describes Single-Switch Scanning?",
        options: [
          { label: "A", text: "Using a mouse with a single click" },
          { label: "B", text: "A highlight cycles through items until a switch is pressed" },
          { label: "C", text: "Speaking commands to navigate" }
        ],
        correctLabel: "B"
      },
      {
        id: 2,
        text: "What is the primary benefit of adjustable scan speeds?",
        options: [
          { label: "A", text: "It allows users to match the interface to their reaction time" },
          { label: "B", text: "It saves battery life on the device" },
          { label: "C", text: "It makes the highlight look cooler" }
        ],
        correctLabel: "A"
      },
      {
        id: 3,
        text: "Which of these can be used as a physical switch?",
        options: [
          { label: "A", text: "Spacebar" },
          { label: "B", text: "A Sip-and-Puff tube" },
          { label: "C", text: "All of the above" }
        ],
        correctLabel: "C"
      }
    ]
  },
  {
    id: 2,
    title: "Level 2: Voice Navigation Mastery",
    questions: [
      {
        id: 1,
        text: "What is a major advantage of voice-driven navigation for quadriplegic users?",
        options: [
          { label: "A", text: "It requires precise fine motor control" },
          { label: "B", text: "It works completely hands-free" },
          { label: "C", text: "It requires a specialized physical keyboard" }
        ],
        correctLabel: "B"
      },
      {
        id: 2,
        text: "Why is substring matching preferred over strict matching for voice commands?",
        options: [
          { label: "A", text: "It handles extra words like 'please' naturally" },
          { label: "B", text: "It executes much faster in the browser" },
          { label: "C", text: "It prevents the microphone from hearing background noise" }
        ],
        correctLabel: "A"
      },
      {
        id: 3,
        text: "What does 'continuous mode' do in the Web Speech API?",
        options: [
          { label: "A", text: "It prevents the microphone from ever turning off" },
          { label: "B", text: "It keeps listening and returning results until manually stopped" },
          { label: "C", text: "It constantly records audio to the cloud" }
        ],
        correctLabel: "B"
      }
    ]
  }
];

const QuadriplegiaLabContent: React.FC = () => {
  const navigate = useNavigate();
  const { isVoiceActive, setIsVoiceActive, isScannerActive, setIsScannerActive, scanSpeed, setScanSpeed } = useMotorAccessibility();
  
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);

  const currentLevel = MOCK_LEVELS.find(l => l.id === selectedLevelId);
  const question = currentLevel?.questions[currentQuestionIndex];

  // Helper for voice feedback
  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleSelectLevel = (levelId: number) => {
    if (selectedLevelId !== null) return;
    setSelectedLevelId(levelId);
    speakText(`Starting Level ${levelId}`);
  };

  // Switch Scanner Hook
  const { refreshTargets } = useSwitchScanner({
    isActive: isScannerActive,
    scanSpeedMs: scanSpeed,
    targetClass: 'scan-target'
  });

  // Re-index scan targets whenever DOM changes
  useEffect(() => {
    if (isScannerActive) {
      setTimeout(refreshTargets, 100);
    }
  }, [selectedLevelId, currentQuestionIndex, isSubmitted, isScannerActive, refreshTargets, quizComplete]);

  // Handle Option Selection
  const handleSelectOption = (label: string) => {
    if (isSubmitted) return;
    setSelectedAnswer(label);
    speakText(`Selected option ${label}`);
  };

  const handleSubmit = () => {
    if (!selectedAnswer || !question) return;
    setIsSubmitted(true);
    if (selectedAnswer === question.correctLabel) {
      speakText("Correct answer!");
    } else {
      speakText("Incorrect answer.");
    }
  };

  const handleNext = () => {
    if (!currentLevel) return;
    if (currentQuestionIndex < currentLevel.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsSubmitted(false);
      speakText("Moving to next question");
    } else {
      setQuizComplete(true);
      speakText(`Level ${currentLevel.id} completed. Returning to level selector.`);
      setTimeout(() => {
        setSelectedLevelId(null);
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setIsSubmitted(false);
        setQuizComplete(false);
      }, 3000);
    }
  };

  // Voice Commands Configuration
  const voiceCommands: VoiceCommand[] = React.useMemo(() => {
    const cmds: VoiceCommand[] = [];

    if (selectedLevelId === null) {
      MOCK_LEVELS.forEach(level => {
        cmds.push({
          id: `select_level_${level.id}`,
          phrases: [`select level ${level.id}`, `level ${level.id}`, `open level ${level.id}`, `start level ${level.id}`],
          action: () => handleSelectLevel(level.id),
          description: `Select Level ${level.id}`
        });
      });
    } else {
      cmds.push(
        {
          id: 'select_a',
          phrases: ['select a', 'select answer a', 'choose a', 'option a', 'select option a', 'answer a'],
          action: () => handleSelectOption('A'),
          description: 'Select option A'
        },
        {
          id: 'select_b',
          phrases: ['select b', 'select answer b', 'choose b', 'option b', 'select option b', 'answer b'],
          action: () => handleSelectOption('B'),
          description: 'Select option B'
        },
        {
          id: 'select_c',
          phrases: ['select c', 'select answer c', 'choose c', 'option c', 'select option c', 'answer c'],
          action: () => handleSelectOption('C'),
          description: 'Select option C'
        },
        {
          id: 'submit',
          phrases: ['submit quiz', 'submit', 'check answer', 'confirm', 'submit answer'],
          action: () => handleSubmit(),
          description: 'Submit your answer'
        },
        {
          id: 'next',
          phrases: ['next question', 'next lesson', 'go forward', 'move on', 'finish level', 'finish'],
          action: () => handleNext(),
          description: 'Go to the next question or finish level'
        },
        {
          id: 'read_question',
          phrases: ['read question', 'read question again', 'repeat that', 'what is the question'],
          action: () => question && speakText(question.text),
          description: 'Read the question aloud'
        }
      );
    }

    cmds.push({
      id: 'go_home',
      phrases: ['go home', 'return home', 'exit quiz', 'quit', 'dashboard', 'home dashboard', 'return to the dashboard', 'go to dashboard', 'go back'],
      action: () => {
         if (selectedLevelId !== null && !quizComplete) {
            setSelectedLevelId(null);
            setCurrentQuestionIndex(0);
            setSelectedAnswer(null);
            setIsSubmitted(false);
            speakText("Returning to level selector.");
         } else {
            navigate('/home');
         }
      },
      description: 'Go back or return to dashboard'
    });

    return cmds;
  }, [selectedLevelId, currentQuestionIndex, isSubmitted, selectedAnswer, quizComplete, question, navigate]);

  // Initialize Voice Commands Hook
  const { isListening, lastHeard } = useVoiceCommands(voiceCommands, isVoiceActive);

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body overflow-x-hidden">
      {/* Header */}
      <header className="p-6 flex justify-between items-center glass-panel border-b border-outline-variant sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/physical-disability')}
            className="p-2 hover:bg-surface-variant rounded-full transition-colors scan-target"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-headline font-bold">Motor Skills & Quadriplegia Lab</h1>
            <p className="text-xs text-on-surface-variant tracking-widest uppercase mt-1">Hands-Free Accessibility</p>
          </div>
        </div>
        
        {/* Settings & Status */}
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${isListening ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-variant border-outline-variant text-on-surface-variant'}`}>
            <Mic className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`} />
            <span>{isListening ? 'Voice Active' : 'Voice Off'}</span>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${isScannerActive ? 'bg-[#df6eff]/10 border-[#df6eff] text-[#df6eff]' : 'bg-surface-variant border-outline-variant text-on-surface-variant'}`}>
            <Scan className={`w-4 h-4 ${isScannerActive ? 'animate-pulse' : ''}`} />
            <span>{isScannerActive ? 'Scanner Active' : 'Scanner Off'}</span>
          </div>
        </div>
      </header>

      <main className="p-8 max-w-5xl mx-auto flex gap-8">
        
        {/* Control Panel (Left Side) */}
        <aside className="w-80 flex flex-col gap-6">
          <div className="glass-card p-6 rounded-[2rem] border border-outline-variant">
            <h3 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Accessibility Controls
            </h3>
            
            <div className="space-y-6">
              {/* Voice Control Toggle */}
              <div>
                <label className="flex items-center justify-between cursor-pointer mb-2 scan-target p-2 rounded-xl hover:bg-surface-variant" onClick={() => setIsVoiceActive(!isVoiceActive)}>
                  <span className="font-bold flex items-center gap-2">
                    <Mic className="w-4 h-4" /> Voice Control
                  </span>
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isVoiceActive ? 'bg-primary' : 'bg-outline-variant'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isVoiceActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
                </label>
                <p className="text-xs text-on-surface-variant pl-2">Try saying "Select Answer A" or "Read Question".</p>
              </div>

              <hr className="border-outline-variant/30" />

              {/* Switch Scanning Toggle */}
              <div>
                <label className="flex items-center justify-between cursor-pointer mb-2 scan-target p-2 rounded-xl hover:bg-surface-variant" onClick={() => setIsScannerActive(!isScannerActive)}>
                  <span className="font-bold flex items-center gap-2">
                    <Scan className="w-4 h-4" /> Switch Scanning
                  </span>
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isScannerActive ? 'bg-[#df6eff]' : 'bg-outline-variant'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isScannerActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </div>
                </label>
                <p className="text-xs text-on-surface-variant pl-2 mb-4">Uses Spacebar, Enter, or Blink detection to select highlighted items.</p>
                
                {/* Speed Slider */}
                <div className="pl-2">
                  <div className="flex justify-between text-xs font-bold text-on-surface-variant mb-2">
                    <span>Scan Speed</span>
                    <span>{(scanSpeed / 1000).toFixed(1)}s</span>
                  </div>
                  <input 
                    type="range" 
                    min="500" 
                    max="5000" 
                    step="500"
                    value={scanSpeed}
                    onChange={(e) => setScanSpeed(Number(e.target.value))}
                    className="w-full accent-[#df6eff] scan-target"
                    disabled={!isScannerActive}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Transcript / Debugging Display */}
          {isVoiceActive && (
            <div className="glass-card p-4 rounded-2xl border border-outline-variant animate-in fade-in slide-in-from-bottom-4">
              <h4 className="text-xs font-bold text-outline uppercase tracking-widest mb-2 flex items-center gap-2">
                <Mic className="w-3 h-3" /> Voice Engine Hears:
              </h4>
              <p className="text-sm font-medium text-primary bg-surface-variant p-3 rounded-xl italic break-words min-h-[44px]">
                {lastHeard ? `"${lastHeard}"` : 'Listening...'}
              </p>
            </div>
          )}
        </aside>

        {/* Main Content Area (Right Side) */}
        <section className="flex-1 flex flex-col gap-6">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-xl font-headline font-bold text-primary">Chapter 3: Introduction to Adaptive Interfaces</h2>
            <span className="text-sm font-bold text-outline">
              {selectedLevelId === null ? 'Select a Level' : `Question ${currentQuestionIndex + 1} of ${currentLevel?.questions.length}`}
            </span>
          </div>

          <div className="glass-card p-10 rounded-[2.5rem] border border-outline-variant shadow-lg relative overflow-hidden">
            
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

            {selectedLevelId === null ? (
              // LEVEL SELECTOR
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-6">Available Levels</h3>
                <div className="space-y-4">
                  {MOCK_LEVELS.map((level) => (
                    <button 
                      key={level.id}
                      onClick={() => handleSelectLevel(level.id)}
                      className="w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center gap-6 scan-target bg-surface-container-high border-outline-variant hover:border-primary/50 hover:bg-primary/10"
                    >
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-headline font-bold text-2xl bg-surface-variant text-primary border border-primary/20 shadow-inner">
                        {level.id}
                      </div>
                      <div>
                        <span className="text-xl font-bold block mb-1">{level.title}</span>
                        <span className="text-sm font-medium text-on-surface-variant flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-[#df6eff]"></span>
                           {level.questions.length} Questions
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : !quizComplete && question ? (
              // QUIZ AREA
              <>
                <div className="flex justify-between items-start mb-8 relative z-10">
                  <h3 className="text-2xl font-bold leading-tight max-w-xl">{question.text}</h3>
                  <button 
                    onClick={() => speakText(question.text)}
                    className="p-3 bg-surface-variant rounded-full text-on-surface hover:bg-primary hover:text-on-primary transition-colors scan-target"
                    aria-label="Read Question Aloud"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 relative z-10">
                  {question.options.map((opt) => {
                    const isSelected = selectedAnswer === opt.label;
                    const isCorrect = isSubmitted && opt.label === question.correctLabel;
                    const isWrong = isSubmitted && isSelected && opt.label !== question.correctLabel;
                    
                    let bgStyle = 'bg-surface-container-high border-outline-variant hover:border-primary/50';
                    if (isSelected && !isSubmitted) bgStyle = 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(143,245,255,0.2)]';
                    if (isCorrect) bgStyle = 'bg-green-500/20 border-green-500 text-green-100';
                    if (isWrong) bgStyle = 'bg-red-500/20 border-red-500 text-red-100';

                    return (
                      <button 
                        key={opt.label}
                        onClick={() => handleSelectOption(opt.label)}
                        disabled={isSubmitted}
                        className={`w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center gap-4 scan-target ${bgStyle}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${isSelected ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface'}`}>
                          {opt.label}
                        </div>
                        <span className="text-lg font-medium">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-10 flex justify-end gap-4 relative z-10">
                  {!isSubmitted ? (
                    <button 
                      onClick={handleSubmit}
                      disabled={!selectedAnswer}
                      className={`px-8 py-4 rounded-xl font-bold text-lg transition-all scan-target ${selectedAnswer ? 'bg-primary text-on-primary hover:scale-105 shadow-lg' : 'bg-surface-variant text-outline cursor-not-allowed'}`}
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <button 
                      onClick={handleNext}
                      className="px-8 py-4 rounded-xl font-bold text-lg bg-[#df6eff] text-white hover:scale-105 transition-all shadow-lg scan-target"
                    >
                      {currentQuestionIndex < currentLevel.questions.length - 1 ? 'Next Question' : 'Finish Level'}
                    </button>
                  )}
                </div>
              </>
            ) : (
              // COMPLETION SCREEN
              <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                  <Play className="w-10 h-10 text-green-400 ml-2" />
                </div>
                <h3 className="text-3xl font-headline font-bold mb-4">Level Complete!</h3>
                <p className="text-on-surface-variant max-w-md mx-auto mb-8">
                  You successfully navigated the entire level using hands-free accessibility controls.
                </p>
                <button 
                  onClick={() => {
                     setSelectedLevelId(null);
                     setCurrentQuestionIndex(0);
                     setSelectedAnswer(null);
                     setIsSubmitted(false);
                     setQuizComplete(false);
                  }}
                  className="px-8 py-4 rounded-xl font-bold bg-primary text-on-primary hover:scale-105 transition-all scan-target"
                >
                  Return to Level Selector
                </button>
              </div>
            )}
            
          </div>
        </section>
      </main>

      <style>{`
        .glass-panel {
          background: rgba(11, 14, 20, 0.8);
          backdrop-filter: blur(20px);
        }
        .glass-card {
          background: rgba(28, 32, 40, 0.4);
          backdrop-filter: blur(20px);
        }
      `}</style>
    </div>
  );
};

// Wrap the component with the Provider so it only affects this route
const QuadriplegiaLab: React.FC = () => {
  return (
    <MotorAccessibilityProvider>
      <QuadriplegiaLabContent />
    </MotorAccessibilityProvider>
  );
};

export default QuadriplegiaLab;
