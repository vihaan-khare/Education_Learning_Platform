import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Hand, GraduationCap, Search, Menu } from 'lucide-react';

import CameraFeed from '../components/CameraFeed';
import GestureDetector from '../components/GestureDetector';
import ChatBox from '../components/ChatBox';
import VideoPlayer from '../components/VideoPlayer';
import { gestureCategories } from '../utils/gestureMap';

import '../styles/signconnect.css';

const SignConnect = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('interact');
  const [chatHistory, setChatHistory] = useState([]);
  const [videoFrame, setVideoFrame] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLearningItem, setSelectedLearningItem] = useState({
    title: "Hello",
    src: "https://www.youtube.com/watch?v=v1desDduz5M&t=15s"
  });

  const handleFrame = useCallback((video) => {
    setVideoFrame(prev => prev || video);
  }, []);

  const handleGesture = (text) => {
    // Add user message
    const userMessage = {
      text,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setChatHistory(prev => [userMessage, ...prev]);
    speakText(text);

    // AI Bot Response logic
    setTimeout(() => {
      let response = "";
      switch(text) {
        case "Hello": response = "Hello! I can see your sign. How can I help you today?"; break;
        case "Yes": response = "Understood! Would you like to proceed?"; break;
        case "No": response = "Okay, I've noted that. What would you like to do instead?"; break;
        case "A": response = "Perfect 'A' sign! You're doing great with the alphabet."; break;
        case "B": response = "Excellent 'B'! Your hand position is very clear."; break;
        case "C": response = "Great 'C' shape! Very well defined."; break;
        case "D": response = "That's a 'D'! Just like pointing up."; break;
        case "F": response = "I see the 'F'! Great job."; break;
        case "I": response = "The letter 'I'! Keep it up."; break;
        case "L": response = "I see the 'L'! Keep going, you're doing great."; break;
        case "V": response = "The 'V' sign! That's also used for the number 2."; break;
        case "W": response = "That's a 'W'! Perfect fingers."; break;
        case "Y": response = "Great 'Y' sign! Thumb and pinky out."; break;
        case "Thumbs Up": response = "Awesome! Thumbs up to you too!"; break;
        case "Help": response = "I see you need help. How can I assist you?"; break;
        case "Together": response = "We are stronger together! Great sign."; break;
        case "Book": response = "A book! Are you ready to study something new?"; break;
        case "I Love You": response = "I love you too! This is one of the most popular signs."; break;
        default: response = `I detected your sign for "${text}". That's correct!`;
      }

      const botMessage = {
        text: response,
        sender: 'ai',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setChatHistory(prev => [botMessage, ...prev]);
      // Optional: speak AI response too
      // speakText(response);
    }, 1000);
  };

  const speakText = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="signconnect-container">
      {/* Header */}
      <header className="p-6 border-b border-white/10 flex justify-between items-center glass-panel sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/physical-disability')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-blue-500">Sign</span>Connect
            </h1>
            <p className="text-xs text-white/50 tracking-widest uppercase">Sign Language Communication Hub</p>
          </div>
        </div>

        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button 
            onClick={() => setActiveTab('interact')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'interact' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
          >
            <Hand className="w-4 h-4" />
            <span>INTERACT</span>
          </button>
          <button 
            onClick={() => setActiveTab('learn')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'learn' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/60 hover:text-white'}`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>LEARN</span>
          </button>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto">
        
        {activeTab === 'interact' ? (
          /* INTERACT MODE */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-[600px]">
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="relative aspect-[4/3] bg-black rounded-3xl overflow-hidden shadow-2xl border border-blue-500/20">
                <CameraFeed onFrame={handleFrame} />
                <GestureDetector videoElement={videoFrame} onGestureDetected={handleGesture} />
              </div>
              <div className="glass-card p-6 bg-blue-600/10 border-blue-500/20">
                <p className="text-sm font-medium text-blue-300">
                  <span className="font-bold mr-2">TIP:</span> 
                  Open palm for "Hello", fist for "Yes", fist with thumb out for "A", and two fingers for "No".
                </p>
              </div>
            </div>
            
            <div className="lg:col-span-5 h-full">
              <ChatBox history={chatHistory} onSpeak={speakText} />
            </div>
          </div>
        ) : (
          /* LEARN MODE */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <aside className="lg:col-span-4 flex flex-col gap-6">
              <div className="glass-card p-6">
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input 
                    type="text" 
                    placeholder="Search signs..." 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 outline-none focus:border-blue-500 transition-colors"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="space-y-6">
                  {Object.entries(gestureCategories).map(([category, items]) => (
                    <div key={category}>
                      <h4 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">{category}</h4>
                      <div className="flex flex-wrap gap-2">
                        {items.map(item => (
                          <button 
                            key={item}
                            onClick={() => {
                              // Robust mapping using verified compilation videos
                              const getSignConfig = (item) => {
                                // Alphabet A-Z Mapping (Raa0vBXA8OQ)
                                const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                                const alphabetIndex = alphabet.indexOf(item);
                                if (alphabetIndex !== -1) {
                                  return { id: "Raa0vBXA8OQ", start: alphabetIndex * 4 };
                                }

                                // Words & Sentences Mapping
                                const wordMap = {
                                  "Hello": { id: "v1desDduz5M", start: 15 },
                                  "Hello, how are you?": { id: "v1desDduz5M", start: 15 },
                                  "Yes": { id: "v1desDduz5M", start: 120 },
                                  "No": { id: "v1desDduz5M", start: 135 },
                                  "Thanks": { id: "v1desDduz5M", start: 50 },
                                  "Please": { id: "v1desDduz5M", start: 75 },
                                  "Sorry": { id: "v1desDduz5M", start: 95 },
                                  "Eat": { id: "ianCxd71UX8", start: 150 },
                                  "Drink": { id: "ianCxd71UX8", start: 160 },
                                  "More": { id: "ianCxd71UX8", start: 170 },
                                  "Help me": { id: "ianCxd71UX8", start: 130 },
                                  "How are you?": { id: "v1desDduz5M", start: 300 },
                                  "Nice to meet you": { id: "ianCxd71UX8", start: 240 },
                                  "I am learning sign language": { id: "ianCxd71UX8", start: 280 }
                                };

                                return wordMap[item] || { id: "v1desDduz5M", start: 0 };
                              };
                              
                              const config = getSignConfig(item);
                              setSelectedLearningItem({ 
                                title: item, 
                                src: `https://www.youtube.com/watch?v=${config.id}${config.start ? `&t=${config.start}s` : ''}` 
                              });
                            }}
                            className={`category-pill ${selectedLearningItem.title === item ? 'active' : ''}`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            <div className="lg:col-span-8">
              <div className="glass-card p-8">
                <VideoPlayer src={selectedLearningItem.src} title={selectedLearningItem.title} />
                
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <h5 className="font-bold text-sm mb-2 text-blue-400">Description</h5>
                    <p className="text-sm text-white/60 leading-relaxed">
                      Watch carefully how the fingers are positioned and the movement of the hand. 
                      Try to mimic this in Interact mode!
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <h5 className="font-bold text-sm mb-2 text-blue-400">Memory Hack</h5>
                    <p className="text-sm text-white/60 leading-relaxed">
                      Practice this sign 5 times in a row while saying the word out loud to reinforce the connection.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Global CSS for scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  );
};

export default SignConnect;
