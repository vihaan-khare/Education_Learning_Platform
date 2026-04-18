import React from 'react';
import { MessageCircle, Volume2 } from 'lucide-react';

const ChatBox = ({ history, onSpeak }) => {
  return (
    <div className="glass-card flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-400" />
          <h3 className="font-bold">Communication History</h3>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 custom-scrollbar">
        {history.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.sender === 'user' ? 'user' : 'ai'}`}>
            <div className="flex items-center justify-between gap-4">
              <p>{msg.text}</p>
              <button 
                onClick={() => onSpeak(msg.text)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                title="Read Aloud"
              >
                <Volume2 className="w-3 h-3" />
              </button>
            </div>
            <span className="text-[9px] opacity-60 block mt-1">{msg.time}</span>
          </div>
        ))}
        {history.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-40 italic text-sm">
            <p>No messages yet.</p>
            <p>Try making a gesture like "Hello"!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBox;
