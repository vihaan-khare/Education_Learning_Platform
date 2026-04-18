import React from 'react';
import { Image as ImageIcon, ExternalLink } from 'lucide-react';

interface DiagramViewProps {
  imageSrc?: string;
  title?: string;
  description?: string;
}

const DiagramView: React.FC<DiagramViewProps> = ({ 
  imageSrc = '/diagram.png', 
  title = 'Visual Diagram',
  description = 'Detailed visual representation of the current lesson topic.'
}) => {
  return (
    <div className="glass-panel rounded-3xl p-6 flex flex-col h-full border border-outline-variant/10 group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-secondary" />
          <h2 className="font-headline font-bold text-lg">{title}</h2>
        </div>
        <button className="p-1.5 hover:bg-surface-variant rounded-lg transition-colors" title="Expand Diagram">
          <ExternalLink className="w-4 h-4 text-outline" />
        </button>
      </div>
      
      <div className="flex-1 bg-surface-container-highest rounded-2xl overflow-hidden relative border border-outline-variant group-hover:border-secondary/30 transition-colors">
        <img 
          src={imageSrc} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1000';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
          <p className="text-xs text-white leading-relaxed">{description}</p>
        </div>
      </div>
      
      <p className="mt-4 text-[11px] text-on-surface-variant leading-relaxed">
        Visual diagrams help reinforce concepts described in the video and captions.
      </p>
    </div>
  );
};

export default DiagramView;
