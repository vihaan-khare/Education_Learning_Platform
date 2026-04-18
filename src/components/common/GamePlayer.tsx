import React, { useEffect, useState } from 'react';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { logActivity, saveGameState, getGameState } from '../../services/activityService';

interface GamePlayerProps {
  mode: 'adhd' | 'dyslexia';
  title: string;
  onBack: () => void;
}

const GamePlayer: React.FC<GamePlayerProps> = ({ mode, title, onBack }) => {
  const [playerName, setPlayerName] = useState<string>('');
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().name) {
            setPlayerName(docSnap.data().name);
          } else {
            setPlayerName(user.displayName || user.email?.split('@')[0] || 'Player');
          }
        } catch (e) {
          console.error(e);
        }
      }
    };

    fetchUser();

    // Listen for level completion and state sync from the game iframe
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'LEARNING_ACTIVITY') {
        const { domain, level } = event.data;
        logActivity(
          mode, 
          domain, 
          `Level ${level}`, 
          'lesson_complete'
        );
      } else if (event.data?.type === 'SYNC_STATE') {
        // Save the updated state to Firestore
        if (event.data.gameState) {
          saveGameState(event.data.gameState, mode);
        }
      } else if (event.data?.type === 'REQUEST_STATE') {
        // Send the stored state back to the game engine
        const storedState = await getGameState(mode);
        if (storedState && iframeRef.current?.contentWindow) {
          iframeRef.current.contentWindow.postMessage({
            type: 'INIT_STATE',
            gameState: storedState
          }, '*');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [mode]);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>
          ← Exit to Library
        </button>
        <h2 style={styles.title}>{title}</h2>
        <div style={styles.badge}>
          {mode === 'adhd' ? '🎯 Focus Session' : '📚 Literacy Lab'}
        </div>
      </header>

      <iframe
        ref={iframeRef}
        src={`/play.html?mode=${mode}${playerName ? `&player=${encodeURIComponent(playerName)}` : ''}`}
        style={styles.iframe}
        title="NeuroLearn Play"
        frameBorder="0"
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f8f6ff',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '12px 24px',
    backgroundColor: '#ffffff',
    borderBottom: '2px solid rgba(108, 99, 255, 0.1)',
    zIndex: 10,
  },
  backBtn: {
    padding: '10px 18px',
    borderRadius: '50px',
    border: '2px solid #6C63FF',
    backgroundColor: 'transparent',
    color: '#6C63FF',
    fontWeight: 800,
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 900,
    color: '#1A1A2E',
    flex: 1,
  },
  badge: {
    padding: '6px 14px',
    backgroundColor: '#EAE9FF',
    color: '#6C63FF',
    borderRadius: '50px',
    fontSize: '12px',
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  iframe: {
    flex: 1,
    width: '100%',
    height: '100%',
    border: 'none',
  },
};

export default GamePlayer;
