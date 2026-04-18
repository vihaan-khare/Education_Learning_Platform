import React from 'react';
import { Type } from 'lucide-react';

interface CaptionsViewProps {
  captions: string[];
  currentIndex?: number;
}

const CaptionsView: React.FC<CaptionsViewProps> = ({ captions, currentIndex = -1 }) => {
  return (
    <div className="glass-panel rounded-3xl p-6 flex flex-col h-full overflow-hidden border border-outline-variant/10">
      <div className="flex items-center gap-2 mb-4">
        <Type className="w-5 h-5 text-primary" />
        <h2 className="font-headline font-bold text-lg">Full Captions</h2>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {captions.map((text, i) => (
          <div 
            key={i} 
            className={`p-3 rounded-xl transition-all duration-500 ${
              i === currentIndex 
                ? 'bg-primary-container/30 border-l-4 border-primary scale-[1.02] shadow-sm' 
                : 'bg-surface-container-low text-on-surface-variant opacity-60'
            }`}
          >
            <p className="text-sm font-medium leading-relaxed">{text}</p>
            {i === currentIndex && (
              <span className="text-[10px] font-bold text-primary mt-1 block uppercase tracking-widest animate-pulse">
                Current
              </span>
            )}
          </div>
        ))}
        {captions.length === 0 && (
          <p className="text-sm text-outline italic text-center mt-8">No captions available for this section.</p>
        )}
      </div>
    </div>
  );
};

export default CaptionsView;
