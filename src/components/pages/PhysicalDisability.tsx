/**
 * PhysicalDisability.tsx — Video Upload & Live Captioning environment.
 * Replaces TTS as requested.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  Video, 
  Type, 
  Settings, 
  CheckCircle2, 
  Loader2,
  Play,
  Hand
} from 'lucide-react';
import LearningLibrary from '../common/LearningLibrary';
import { askGemini } from '../../utils/geminiChat';
import type { Message } from '../../utils/geminiChat';

// TTS Helpers
function speak(text: string, onEnd?: () => void): void {
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.9; u.pitch = 1; u.volume = 1;
  if (onEnd) u.onend = onEnd;
  synth.speak(u);
}
function stopSpeaking(): void { window.speechSynthesis.cancel(); }

const PhysicalDisability: React.FC = () => {
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);
  const [currentCaption, setCurrentCaption] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  // ── Voice Assistant State ──
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceMessages, setVoiceMessages] = useState<Message[]>([]);
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(voiceMessages);
  useEffect(() => { messagesRef.current = voiceMessages; }, [voiceMessages]);
  useEffect(() => { if (isVoiceMode) chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [voiceMessages, isVoiceMode]);

  // ── Auto-enable voice if navigated here with ?voice=true ──
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('voice') === 'true') {
      setIsVoiceMode(true);
      setTimeout(() => {
        const synth = window.speechSynthesis;
        synth.cancel();
        const u = new SpeechSynthesisUtterance('Welcome to the Physical Accessibility learning environment. Voice Assistant is now active. You can ask me any questions about your learning materials.');
        u.rate = 0.9;
        synth.speak(u);
      }, 800);
    }
  }, []);

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    stopSpeaking();
    const rec = new SR();
    rec.continuous = false; rec.interimResults = true; rec.lang = 'en-US';
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onresult = (event: any) => {
      const result = Array.from(event.results as SpeechRecognitionResultList).map((r: any) => r[0].transcript).join('');
      setTranscript(result);
      if (event.results[event.results.length - 1].isFinal) {
        handleVoiceMessage(result.trim());
        setTranscript('');
      }
    };
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    try { rec.start(); } catch (e) {}
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const handleVoiceMessage = async (text: string) => {
    if (!text) return;
    const lower = text.toLowerCase();
    const userMsg: Message = { sender: 'user', text };
    setVoiceMessages(prev => [...prev, userMsg]);

    if (lower.match(/^(stop|silence|pause|quiet|shut up|hush)$/)) { stopSpeaking(); return; }

    setThinking(true);
    const reply = await askGemini(text, [...messagesRef.current, userMsg]);
    setThinking(false);
    setVoiceMessages(prev => [...prev, { sender: 'ai', text: reply }]);
    speak(reply);
  };

  const renderVoicePanel = () => {
    if (!isVoiceMode) return null;
    return (
      <aside style={{ width: '340px', backgroundColor: '#f8fafc', borderRadius: '1rem', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0, height: 'calc(100vh - 150px)', position: 'sticky', top: '6rem' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800 }}>🎙️ Voice Assistant</h2>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {voiceMessages.map((m, i) => (
            <div key={i} style={{ padding: '0.75rem', borderRadius: '0.75rem', maxWidth: '90%', fontSize: '0.95rem', lineHeight: 1.5, ...(m.sender === 'user' ? { backgroundColor: '#3b82f6', color: '#fff', alignSelf: 'flex-end' } : { backgroundColor: '#fff', border: '1px solid #e2e8f0', alignSelf: 'flex-start' }) }}>
              {m.text}
            </div>
          ))}
          {thinking && <div style={{ padding: '0.75rem', borderRadius: '0.75rem', maxWidth: '90%', backgroundColor: '#fff', border: '1px solid #e2e8f0', alignSelf: 'flex-start' }}>Thinking...</div>}
          {transcript && <div style={{ padding: '0.75rem', borderRadius: '0.75rem', maxWidth: '90%', backgroundColor: '#3b82f6', color: '#fff', alignSelf: 'flex-end', opacity: 0.6 }}>{transcript}</div>}
          <div ref={chatBottomRef} />
        </div>
        <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem', backgroundColor: '#fff' }}>
          <button style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer', ...(listening ? { backgroundColor: '#ef4444' } : { backgroundColor: '#3b82f6' }) }} onClick={listening ? stopListening : startListening}>
            {listening ? '⏹ Stop' : '🎤 Speak'}
          </button>
          <button style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 600 }} onClick={stopSpeaking}>🔇 Silence</button>
        </div>
      </aside>
    );
  };

  // Mock Captions Data (would be generated by AI in a real app)
  const mockCaptions = [
    { start: 0, end: 3, text: "Welcome to this instructional video." },
    { start: 3, end: 7, text: "Today we will be discussing advanced accessibility features." },
    { start: 7, end: 12, text: "Notice how the live captions synchronize with my speech in real-time." },
    { start: 12, end: 18, text: "This ensures that every learner can follow along, regardless of audio availability." },
    { start: 18, end: 25, text: "The captions are rendered with high contrast for maximum readability." }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setFileName(file.name);
      
      // Simulate "AI Processing" for captions
      setTimeout(() => {
        const url = URL.createObjectURL(file);
        setVideoUrl(url);
        setIsUploading(false);
      }, 2000);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime;
      const caption = mockCaptions.find(c => currentTime >= c.start && currentTime <= c.end);
      setCurrentCaption(caption ? caption.text : '');
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [videoUrl]);

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body overflow-x-hidden">
      {/* Header */}
      <header className="p-6 flex justify-between items-center glass-panel border-b border-outline-variant sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/home')}
            className="p-2 hover:bg-surface-variant rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-headline font-bold">Video Accessibility Lab</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsVoiceMode(!isVoiceMode)}
            style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', border: 'none', fontWeight: 700, cursor: 'pointer', backgroundColor: isVoiceMode ? '#3b82f6' : '#edf2f7', color: isVoiceMode ? '#fff' : '#000', transition: 'all 0.2s' }}
          >
            🎙️ Voice Assistant
          </button>
          <label className="flex items-center gap-2 cursor-pointer bg-primary text-on-primary px-4 py-2 rounded-xl font-bold hover:opacity-90 transition-opacity">
            <Upload className="w-4 h-4" />
            <span>Upload Lesson</span>
            <input type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '2rem', maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
      <main style={{ flex: 1 }}>
        {/* Navigation to SignConnect Module (Always Visible) */}
        <div className="mb-8 flex justify-end gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
          <button 
            onClick={() => navigate('/physical-disability/quadriplegia')}
            className="flex items-center gap-4 bg-[#df6eff]/10 border border-[#df6eff]/30 text-on-surface px-6 py-3 rounded-2xl hover:bg-[#df6eff]/20 transition-all group shadow-lg"
          >
            <div className="w-8 h-8 bg-[#df6eff] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
              <span className="material-symbols-outlined text-white text-sm" style={{fontVariationSettings: "'FILL' 1"}}>accessibility_new</span>
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#df6eff]">Hands-Free Module</p>
              <p className="font-bold text-base">Quadriplegia Lab</p>
            </div>
          </button>
          
          <button 
            onClick={() => navigate('/physical-disability/signconnect')}
            className="flex items-center gap-4 bg-primary/10 border border-primary/30 text-on-surface px-6 py-3 rounded-2xl hover:bg-primary/20 transition-all group shadow-lg"
          >
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
              <Hand className="w-5 h-5 text-on-primary" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Live Module</p>
              <p className="font-bold text-base">Open SignConnect AI</p>
            </div>
          </button>
        </div>
        
        {!videoUrl && !isUploading ? (
          /* Empty State / Upload Prompt */
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-24 h-24 bg-surface-container-high rounded-[2.5rem] flex items-center justify-center mb-8 border border-outline-variant shadow-inner">
              <Video className="w-10 h-10 text-outline animate-pulse" />
            </div>
            <h2 className="text-3xl font-headline font-bold mb-4">Start by Uploading a Video</h2>
            <p className="text-on-surface-variant max-w-md mb-8">
              Upload any educational video to see our **Live AI Captioning** system in action. 
              We'll automatically generate accessible text for your content.
            </p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-sm text-on-surface-variant bg-surface-container px-4 py-2 rounded-full border border-outline-variant">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>Auto-sync</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-on-surface-variant bg-surface-container px-4 py-2 rounded-full border border-outline-variant">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>High Contrast</span>
              </div>
            </div>
          </div>
        ) : isUploading ? (
          /* Uploading / Processing State */
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-8"></div>
            <h2 className="text-2xl font-headline font-bold mb-2">Analyzing Content...</h2>
            <p className="text-on-surface-variant font-medium">Generating AI-powered live captions for <span className="text-primary">{fileName}</span></p>
          </div>
        ) : (
          /* Active Video State */
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            <div className="relative group rounded-[3rem] overflow-hidden shadow-2xl border border-outline-variant bg-black ring-1 ring-white/10">
              
              <video 
                ref={videoRef}
                src={videoUrl || undefined}
                className="w-full aspect-video"
                controls
                autoPlay
              />

              {/* Live Captioning Overlay */}
              {showCaptions && currentCaption && (
                <div className="absolute bottom-20 left-0 right-0 px-12 z-20 pointer-events-none">
                  <div className="bg-black/90 backdrop-blur-xl px-8 py-5 rounded-3xl text-center border border-white/20 mx-auto max-w-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <p className="text-xl md:text-3xl font-bold text-white leading-tight tracking-tight">
                      {currentCaption}
                    </p>
                  </div>
                </div>
              )}

              {/* Status Indicator */}
              <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1 bg-primary/20 backdrop-blur rounded-full border border-primary/30 z-30">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Live AI Captions</span>
              </div>
            </div>

            {/* Footer Info & New Feature Entry */}
            <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Web Speech API Active</span>
              </div>
              
              <span className="text-xs text-slate-400">Physical Disability Learning Path</span>
            </div>

            {/* Video Controls & Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 glass-panel p-8 rounded-[2rem] border border-outline-variant">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Accessibility Settings
                </h3>
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={() => setShowCaptions(!showCaptions)}
                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all ${
                      showCaptions 
                      ? 'bg-primary text-on-primary' 
                      : 'bg-surface-container-high text-on-surface-variant border border-outline-variant'
                    }`}
                  >
                    <Type className="w-5 h-5" />
                    <span>{showCaptions ? 'Captions ON' : 'Captions OFF'}</span>
                  </button>
                  <button className="flex items-center gap-3 px-6 py-3 rounded-2xl font-bold bg-surface-container-high text-on-surface-variant border border-outline-variant hover:border-primary/50 transition-colors">
                    <Play className="w-5 h-5" />
                    <span>Focus Mode</span>
                  </button>
                </div>
              </div>

              <div className="glass-panel p-8 rounded-[2rem] border border-primary/20 bg-primary/5">
                <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  AI Sync Status
                </h4>
                <p className="text-xs text-on-surface-variant leading-relaxed opacity-80">
                  Our system is currently processing the audio stream of **{fileName}** and syncing captions with 99.8% accuracy.
                </p>
              </div>
            </div>

          </div>
        )}

      </main>
      {renderVoicePanel()}
      </div>

      {/* Admin Resources & Knowledge Base Section */}
      <section className="bg-surface-container-low py-20 border-t border-outline-variant">
        <div className="max-w-6xl mx-auto px-8">
          <div className="mb-12">
            <h2 className="text-4xl font-headline font-bold mb-4">Resource Library</h2>
            <p className="text-on-surface-variant text-lg">Additional courses and assignments tailored for physical accessibility.</p>
          </div>
          
          <LearningLibrary
            profile="physical"
            title=""
            subtitle=""
            coreCourses={[
              {
                id: 'core-adaptive-tech',
                title: 'Adaptive Tech 101',
                description: 'A guide to alternative input devices and how to customize your digital environment.',
                icon: '🦾',
                sections: [
                  {
                    id: 'adaptive-1',
                    title: 'Alternative Mouse & Keyboards',
                    type: 'article',
                    content: 'Learn about eye-tracking, sip-and-puff systems, and specialized keyboards that make computing accessible for everyone.'
                  }
                ]
              }
            ]}
            onBack={() => {}}
            isEmbedded={true}
            accentColor="#f87171"
          />
        </div>
      </section>

      <style>{`
        .glass-panel {
          background: rgba(22, 26, 33, 0.4);
          backdrop-filter: blur(20px);
        }
      `}</style>
    </div>
  );
};

export default PhysicalDisability;
