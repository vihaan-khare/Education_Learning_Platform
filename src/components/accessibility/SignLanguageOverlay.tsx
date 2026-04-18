import React, { useState } from 'react';
import { X, Video, GripVertical } from 'lucide-react';

const SignLanguageOverlay: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  
  if (!isVisible) return null;

  return (
    <div className="absolute bottom-6 right-6 w-48 aspect-[3/4] bg-surface-bright rounded-2xl border-2 border-primary shadow-2xl overflow-hidden z-20 group/interpreter cursor-move select-none animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
      
      {/* Mock Interpreter */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-5xl animate-pulse">👋</span>
        <div className="absolute inset-0 bg-primary/5 mix-blend-overlay"></div>
      </div>
      
      {/* Controls */}
      <div className="absolute top-2 left-2 right-2 flex justify-between items-center opacity-0 group-hover/interpreter:opacity-100 transition-opacity">
        <div className="p-1 bg-black/40 rounded-lg cursor-grab active:cursor-grabbing">
          <GripVertical className="w-3 h-3 text-white/70" />
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="p-1.5 bg-black/40 hover:bg-error/60 rounded-full transition-colors"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      </div>

      {/* Label */}
      <div className="absolute bottom-3 left-3 right-3">
        <div className="flex items-center gap-2 px-2 py-1 bg-primary/20 backdrop-blur-md border border-primary/30 rounded-lg">
          <Video className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-bold text-white uppercase tracking-wider">Interpreter</span>
        </div>
      </div>

      {/* Scanning Line Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="w-full h-0.5 bg-primary/30 shadow-[0_0_10px_rgba(0,240,255,0.5)] absolute top-0 left-0 animate-[scan_4s_linear_infinite]"></div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default SignLanguageOverlay;
