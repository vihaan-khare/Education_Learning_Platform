const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'components', 'pages', 'QuadriplegiaLab.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// Replace everything from `// Quiz Question Data` up to `// Initialize Voice Commands Hook`
const replace1_start = content.indexOf('// Quiz Question Data');
const replace1_end = content.indexOf('  // Initialize Voice Commands Hook');

const replacement1 = `// Quiz Question Data
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
    speakText(\`Starting Level \${levelId}\`);
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
    speakText(\`Selected option \${label}\`);
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
      speakText(\`Level \${currentLevel.id} completed. Returning to level selector.\`);
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
          id: \`select_level_\${level.id}\`,
          phrases: [\`select level \${level.id}\`, \`level \${level.id}\`, \`open level \${level.id}\`, \`start level \${level.id}\`],
          action: () => handleSelectLevel(level.id),
          description: \`Select Level \${level.id}\`
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
          phrases: ['next question', 'next lesson', 'go forward', 'move on'],
          action: () => handleNext(),
          description: 'Go to the next question'
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

`;

content = content.substring(0, replace1_start) + replacement1 + content.substring(replace1_end);

const replace2_start = content.indexOf('{/* Quiz Area (Right Side) */}');
const replace2_end = content.indexOf('</section>', replace2_start);

const replacement2 = `{/* Main Content Area (Right Side) */}
        <section className="flex-1 flex flex-col gap-6">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-xl font-headline font-bold text-primary">Chapter 3: Introduction to Adaptive Interfaces</h2>
            <span className="text-sm font-bold text-outline">
              {selectedLevelId === null ? 'Select a Level' : \`Question \${currentQuestionIndex + 1} of \${currentLevel?.questions.length}\`}
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
                        className={\`w-full text-left p-6 rounded-2xl border-2 transition-all flex items-center gap-4 scan-target \${bgStyle}\`}
                      >
                        <div className={\`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg \${isSelected ? 'bg-primary text-on-primary' : 'bg-surface-variant text-on-surface'}\`}>
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
                      className={\`px-8 py-4 rounded-xl font-bold text-lg transition-all scan-target \${selectedAnswer ? 'bg-primary text-on-primary hover:scale-105 shadow-lg' : 'bg-surface-variant text-outline cursor-not-allowed'}\`}
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
        `;

content = content.substring(0, replace2_start) + replacement2 + content.substring(replace2_end);

fs.writeFileSync(targetPath, content);
console.log('Done!');
