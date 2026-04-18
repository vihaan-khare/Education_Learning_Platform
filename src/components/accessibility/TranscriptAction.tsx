import React from 'react';
import { Download } from 'lucide-react';

interface TranscriptActionProps {
  content: string;
  fileName?: string;
}

const TranscriptAction: React.FC<TranscriptActionProps> = ({ 
  content, 
  fileName = 'lesson_transcript.txt' 
}) => {
  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <button 
      onClick={handleDownload}
      className="btn btn-outline flex items-center gap-2 group transition-all hover:border-primary/50"
    >
      <Download className="w-4 h-4 text-outline group-hover:text-primary" />
      <span>Download Transcript</span>
    </button>
  );
};

export default TranscriptAction;
