import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccessibility } from '../context/AccessibilityContext';
import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

// TensorFlow.js Imports
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

const Onboarding: React.FC = () => {
  const { applyProfileSettings } = useAccessibility();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<{sender: 'ai' | 'user', text: string}[]>([]);
  const [isScanning, setIsScanning] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [liveRatio, setLiveRatio] = useState(0);
  const [debugMsg, setDebugMsg] = useState('Initializing ML...');
  const [liveGaze, setLiveGaze] = useState(0);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  
  const isAnalyzing = useRef(true);
  const headPositions = useRef<{x: number, y: number}[]>([]);
  const faceRatios = useRef<number[]>([]);
  const headTurnRatios = useRef<number[]>([]);

  // Helper to make the AI speak
  const speakMessage = (text: string) => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    synth.speak(utterance);
  };

  const addAiMessage = (text: string) => {
    setMessages(prev => [...prev, { sender: 'ai', text }]);
    speakMessage(text);
  };

  // Setup camera & ML Model
  useEffect(() => {
    let stream: MediaStream | null = null;
    let detector: any = null;
    let animationFrameId: number;

    const setupCameraAndML = async () => {
      try {
        // 1. Setup Camera
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for video to load metadata to get true width/height
          await new Promise((resolve) => {
            videoRef.current!.onloadedmetadata = () => {
              if (videoRef.current) {
                 videoRef.current.width = videoRef.current.videoWidth;
                 videoRef.current.height = videoRef.current.videoHeight;
              }
              resolve(true);
            };
          });
        }

        // 2. Load TFJS Face Landmarks Model
        setDebugMsg('Initializing TFJS...');
        await tf.setBackend('webgl');
        await tf.ready();

        setDebugMsg('Loading Model...');
        const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
        const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshTfjsModelConfig = {
          runtime: 'tfjs',
          refineLandmarks: false
        };
        
        // Prevent indefinite hanging by wrapping in a Promise.race with a 30s timeout
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Model download timeout")), 30000));
        detector = await Promise.race([
           faceLandmarksDetection.createDetector(model, detectorConfig),
           timeoutPromise
        ]);

        setDebugMsg('Model Loaded. Detecting...');

        // Initial greeting
        addAiMessage("Hi! I'm Aurora, your AI assistant. I am currently using computer vision to analyze your facial geometry, distance, and movement to customize your learning experience.");

        // 3. Start Analysis Loop
        const analyzeFrame = async () => {
          const visualSource = imageRef.current && uploadedImageUrl ? imageRef.current : videoRef.current;

          if (visualSource && detector && isAnalyzing.current) {
            try {
              const faces = await detector.estimateFaces(visualSource);
              if (faces.length > 0) {
                const face = faces[0];
                
                // Track Face Distance Ratio (width of bounding box relative to video/image)
                const boxWidth = face.box.width;
                const sourceWidth = uploadedImageUrl ? imageRef.current!.width : videoRef.current!.videoWidth;
                const ratio = boxWidth / sourceWidth;
                faceRatios.current.push(ratio);
                setLiveRatio(ratio);
                
                // Track Head Position Variance (using nose tip approx. keypoint 1)
                const nose = face.keypoints[1];
                const leftCheek = face.keypoints[234];
                const rightCheek = face.keypoints[454];

                if (nose) {
                  headPositions.current.push({x: nose.x, y: nose.y});
                }

                // Track Gaze Aversion (Autism Proxy) - Nose offset relative to face center
                if (nose && leftCheek && rightCheek) {
                  const faceCenterX = (leftCheek.x + rightCheek.x) / 2;
                  const faceWidth = Math.abs(rightCheek.x - leftCheek.x);
                  if (faceWidth > 0) {
                    const noseOffset = Math.abs(nose.x - faceCenterX);
                    const turnRatio = noseOffset / faceWidth;
                    headTurnRatios.current.push(turnRatio);
                    setLiveGaze(turnRatio);
                  }
                }
              } else {
                setDebugMsg('No face detected in frame.');
              }
            } catch(e: any) {
               console.error("TFJS Prediction Error", e);
               setDebugMsg(`Error: ${e.message}`);
            }
          }
          if (isAnalyzing.current) {
             animationFrameId = requestAnimationFrame(analyzeFrame);
          }
        };
        analyzeFrame();

        // 4. Finish scanning after 8 seconds and compute heuristics
        setTimeout(() => {
          isAnalyzing.current = false;
          setIsScanning(false);
          setIsTyping(true);

          setTimeout(() => {
            setIsTyping(false);
            processMLResults();
          }, 2000);

        }, 8000);

      } catch (err) {
        console.error("Camera/ML Setup Error", err);
        setIsScanning(false);
        addAiMessage("I'm sorry, I couldn't access your camera or load the AI model. Let's proceed manually. Are you experiencing visual impairment, ADHD, or learning difficulties?");
      }
    };

    setupCameraAndML();

    return () => {
      isAnalyzing.current = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.speechSynthesis.cancel();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Handle Image Upload Fallback
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedImageUrl(url);
    }
  };

  const processMLResults = () => {
    let finalProfile: 'visual' | 'adhd' | 'autism' | 'learning' = 'learning';
    let analysisText = "";

    // Calculate heuristics
    let maxRatio = 0;
    if (faceRatios.current.length > 0) {
      // Use the maximum ratio detected during the scan rather than the average,
      // so if they lean in at any point, we catch it.
      maxRatio = Math.max(...faceRatios.current);
    }

    let movementVariance = 0;
    if (headPositions.current.length > 1) {
      let dx = 0;
      for(let i=1; i<headPositions.current.length; i++) {
         dx += Math.abs(headPositions.current[i].x - headPositions.current[i-1].x);
      }
      movementVariance = dx / headPositions.current.length;
    }

    let avgHeadTurn = 0;
    if (headTurnRatios.current.length > 0) {
      avgHeadTurn = headTurnRatios.current.reduce((a, b) => a + b, 0) / headTurnRatios.current.length;
    }

    console.log("ML Heuristics -> Max Face Ratio:", maxRatio, "Movement Variance:", movementVariance, "Gaze Aversion:", avgHeadTurn);

    // Thresholds
    // If face takes up > 18% of the frame at any point, user is extremely close -> Visual Impairment
    if (maxRatio > 0.18) {
       finalProfile = 'visual';
       analysisText = "My computer vision analysis detected that you are positioned very close to the screen. This often indicates a visual impairment. I recommend applying the High-Contrast and Audio Support profile. Do you agree?";
    } 
    // Gaze Aversion (Autism Proxy) -> Consistently looking away from the screen center
    else if (avgHeadTurn > 0.15) {
       finalProfile = 'autism';
       analysisText = "My analysis detected frequent gaze aversion (looking away from the screen). To provide a calmer, low-stimulation environment, I recommend the Sensory Focus profile. Do you agree?";
    }
    // If movement variance is very high across frames -> Fidgeting/ADHD
    else if (movementVariance > 2.0) {
       finalProfile = 'adhd';
       analysisText = "My analysis detected high variance in your head movement and visual focus. To reduce sensory overload and distraction, I recommend applying the Sensory Focus (ADHD) profile. Do you agree?";
    } 
    // Fallback -> Learning Profile
    else {
       finalProfile = 'learning';
       analysisText = "My analysis shows stable focus and typical screen distance. I recommend starting with the standard Learning profile, which includes dyslexia-friendly fonts. Does that sound good?";
    }

    addAiMessage(analysisText);
    // Store the recommended profile in state temporarily in case user just says "Yes"
    (window as any)._recommendedProfile = finalProfile;
  };

  // Auto-scroll chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!userInput.trim()) return;
    
    const currentInput = userInput;
    setMessages(prev => [...prev, { sender: 'user', text: currentInput }]);
    setUserInput('');
    setIsTyping(true);
    
    // Check if user agreed or explicitly stated a profile
    const inputLower = currentInput.toLowerCase();
    const isYes = inputLower.includes('yes') || inputLower.includes('agree') || inputLower.includes('ok') || inputLower.includes('sure');
    const isBlind = inputLower.includes('blind') || inputLower.includes('visual');
    const isADHD = inputLower.includes('adhd') || inputLower.includes('focus');
    const isAutism = inputLower.includes('autism') || inputLower.includes('sensory');
    
    let profileToApply: 'visual' | 'learning' | 'adhd' | 'autism' = (window as any)._recommendedProfile || 'learning';
    let responseMsg = "Applying the profile now. Stand by...";

    if (isBlind) {
      profileToApply = 'visual';
      responseMsg = "Understood. Applying High Contrast mode and Text-to-Speech support. Stand by...";
    } else if (isADHD) {
      profileToApply = 'adhd';
      responseMsg = "Got it. Applying the Sensory Focus profile to reduce distractions. Stand by...";
    } else if (isAutism) {
      profileToApply = 'autism';
      responseMsg = "Got it. Applying the low-stimulation Sensory Profile. Stand by...";
    } else if (isYes) {
       responseMsg = "Excellent! Applying the recommended profile. Stand by...";
    }

    setTimeout(async () => {
      setIsTyping(false);
      addAiMessage(responseMsg);
      
      setTimeout(async () => {
        // Stop camera
        isAnalyzing.current = false;
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
        applyProfileSettings(profileToApply);

        // Save to Firestore if user is logged in
        if (auth.currentUser) {
          try {
            await updateDoc(doc(db, 'users', auth.currentUser.uid), {
              disabilityProfile: profileToApply
            });
          } catch (error) {
            console.error("Failed to save profile to Firestore", error);
          }
        }

        navigate('/dashboard');
      }, 5000); // Wait for the TTS
    }, 1500);
  };

  return (
    <main className="flex h-screen w-full bg-surface text-on-surface font-body overflow-hidden">
      {/* Left Side: Visual Scan */}
      <section className="relative w-1/2 h-full overflow-hidden bg-surface-container-lowest flex flex-col items-center justify-center">
        {/* Camera or Image Feed */}
        <div className="absolute inset-0 z-0">
          {uploadedImageUrl ? (
            <img 
              ref={imageRef}
              src={uploadedImageUrl}
              className="w-full h-full object-cover opacity-60 grayscale-[0.3]"
              alt="Uploaded scan source"
            />
          ) : (
            <video 
              ref={videoRef}
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover opacity-60 grayscale-[0.3]" 
              style={{ transform: 'scaleX(-1)' }} // Mirror the video
            />
          )}
        </div>

        {/* Scanning Elements */}
        {isScanning && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
            {/* Targeting Frame */}
            <div className="w-2/3 h-2/3 border-[1px] border-primary/20 relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary"></div>
              <div className="scanning-line"></div>
            </div>

            {/* Overlay Labels */}
            <div className="absolute bottom-12 left-12 space-y-3">
              <div className="glass-panel px-4 py-2 rounded-lg flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-sm" style={{fontVariationSettings: "'FILL' 1"}}>sensors</span>
                <p className="font-label text-xs tracking-wider uppercase text-on-surface-variant">Running TF.js FaceMesh Model...</p>
              </div>
              <div className="glass-panel px-4 py-2 rounded-lg flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-sm" style={{fontVariationSettings: "'FILL' 1"}}>visibility</span>
                <p className="font-label text-xs tracking-wider uppercase text-on-surface-variant">Live Face Ratio: {(liveRatio * 100).toFixed(1)}%</p>
              </div>
              <div className="glass-panel px-4 py-2 rounded-lg flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-sm" style={{fontVariationSettings: "'FILL' 1"}}>neurology</span>
                <p className="font-label text-xs tracking-wider uppercase text-on-surface-variant">Live Gaze Aversion (Autism): {(liveGaze * 100).toFixed(1)}%</p>
              </div>
              <div className="glass-panel px-4 py-2 rounded-lg flex items-center gap-3 bg-red-500/10 border border-red-500/20">
                <span className="material-symbols-outlined text-red-400 text-sm" style={{fontVariationSettings: "'FILL' 1"}}>bug_report</span>
                <p className="font-label text-[10px] uppercase text-red-400">Debug: {debugMsg}</p>
              </div>
            </div>
          </div>
        )}

        <div className="absolute top-8 left-8 flex flex-col gap-2 z-10">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-headline font-bold tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#df6eff]">AURORA</span>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="glass-panel text-[10px] font-label uppercase px-3 py-1 rounded hover:text-primary transition-colors cursor-pointer w-fit"
          >
            Upload Photo Instead
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 via-transparent to-surface-container-lowest/40 z-5"></div>
      </section>

      {/* Right Side: AI Interaction */}
      <section className="w-1/2 h-full bg-gradient-to-br from-surface-container-low to-surface flex flex-col z-10 relative">
        <div className="p-12 pb-6">
          <h1 className="font-headline text-4xl font-bold tracking-tight text-on-surface mb-2">
            Visual Scan {isScanning ? <span className="text-primary">Active</span> : <span className="text-secondary">Complete</span>}
          </h1>
          <p className="text-on-surface-variant max-w-md">
            We are analyzing physical distance and posture metrics in real-time to infer accessibility needs.
          </p>
        </div>

        {/* Chat Interface */}
        <div ref={scrollRef} className="flex-grow overflow-y-auto px-12 py-4 space-y-6 flex flex-col justify-start pb-20">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 max-w-[85%] animate-fade-in ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              {msg.sender === 'ai' && (
                <div className="w-10 h-10 rounded-full intelligence-gradient flex items-center justify-center shrink-0 glow-soft">
                  <span className="material-symbols-outlined text-on-primary text-xl" style={{fontVariationSettings: "'FILL' 1"}}>psychology</span>
                </div>
              )}
              <div className={`rounded-xl p-5 text-on-surface ${msg.sender === 'ai' ? 'bg-surface-container border-l-2 border-primary/30' : 'bg-surface-container-high'}`}>
                {msg.sender === 'ai' && idx === 0 && <p className="font-label text-[10px] uppercase tracking-widest text-primary mb-1">Aurora AI</p>}
                <p className="leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-4 items-center pl-14">
              <div className="flex gap-1.5 px-3 py-2 bg-surface-container-high rounded-full w-fit">
                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></div>
                <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{animationDelay: "0.4s"}}></div>
              </div>
              <span className="text-xs font-label text-outline uppercase tracking-tighter">Aurora is typing</span>
            </div>
          )}
        </div>

        {/* Interaction Bar */}
        <div className="p-12 pt-6 shrink-0 bg-surface">
          <div className="relative">
            <div className="absolute -top-12 left-0 w-full h-12 bg-gradient-to-t from-surface to-transparent pointer-events-none"></div>
            <div className="flex items-center gap-4 bg-surface-container-high p-2 rounded-2xl border border-outline-variant/10 shadow-lg relative z-10">
              <input 
                className="flex-grow bg-transparent border-none focus:ring-0 px-4 py-3 text-on-surface placeholder-on-surface-variant/50 outline-none" 
                placeholder="Type your response or use voice dictation..." 
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend}
                className="intelligence-gradient text-on-primary font-label font-bold px-6 py-3 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer border-none"
              >
                <span>SEND</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
            <div className="mt-6 flex justify-between items-center text-[10px] font-label uppercase tracking-[0.2em] text-outline">
              <div className="flex gap-4">
                <span className="hover:text-primary cursor-pointer transition-colors">Privacy Policy</span>
                <span className="hover:text-primary cursor-pointer transition-colors">Accessibility Statement</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                Neural Sync: {isScanning ? 'TF.js Running...' : 'Analysis Complete'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Overlay UI Assets */}
      <div className="fixed top-8 right-8 z-50 flex gap-4">
        <button 
          className="glass-panel p-2.5 rounded-full text-on-surface-variant hover:text-primary transition-colors cursor-pointer border-none"
          onClick={() => { 
            isAnalyzing.current = false;
            window.speechSynthesis.cancel();
            if (videoRef.current && videoRef.current.srcObject) {
              const stream = videoRef.current.srcObject as MediaStream;
              stream.getTracks().forEach(track => track.stop());
            }
            applyProfileSettings('none'); 
            navigate('/dashboard'); 
          }}
          title="Skip AI Onboarding"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
    </main>
  );
};

export default Onboarding;
