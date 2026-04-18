import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Minimize2, Maximize2 } from 'lucide-react';
import { callGemini } from '../../services/geminiService';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const AILearningChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Hi! I\'m your learning assistant. Ask me anything about the lesson!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const prompt = `You are a helpful educational assistant for a student with hearing or physical disabilities. 
      The student is asking: "${userMsg}". 
      Provide a concise, clear, and encouraging response.`;
      
      const response = await callGemini(prompt);
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: response || "I'm having trouble connecting right now, but I'm here to help! Could you try rephrasing that?" 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isMinimized) {
    return (
      <button 
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full intelligence-gradient text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-[100]"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="flex flex-col h-full glass-panel rounded-3xl overflow-hidden border border-primary/20 shadow-xl">
      <div className="p-4 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full intelligence-gradient flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Learning Assistant</h3>
            <p className="text-[10px] text-on-surface-variant">Powered by Gemini AI</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-surface-variant rounded">
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
              msg.role === 'user' 
                ? 'bg-primary text-on-primary rounded-tr-none shadow-md' 
                : 'bg-surface-container-high border border-outline-variant rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-surface-container-high p-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
              <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 bg-surface-container border-t border-outline-variant">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Aurora..."
            className="flex-1 bg-surface-container-highest border border-outline-variant rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
          />
          <button 
            type="submit"
            className="p-2 bg-primary text-on-primary rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            disabled={!input.trim() || isLoading}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AILearningChat;
