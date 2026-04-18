import React, { useRef, useState } from 'react';
import { Play, Pause, RotateCcw, FastForward } from 'lucide-react';

const VideoPlayer = ({ src, title }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleRepeat = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleSlowMo = () => {
    const newRate = playbackRate === 1 ? 0.5 : 1;
    setPlaybackRate(newRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = newRate;
    }
  };

  const isYouTube = src?.includes('youtube.com') || src?.includes('youtu.be');

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
        {isYouTube ? (
          <iframe 
            src={`https://www.youtube.com/embed/${src.split('v=')[1]?.split('&')[0] || src.split('/').pop().split('?')[0]}?start=${src.includes('&t=') ? src.split('&t=')[1].split('s')[0] : 0}&autoplay=0&controls=1`}
            className="w-full h-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            {loading && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 animate-spin rounded-full"></div>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10 p-6 text-center">
                <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4">
                  <Play className="w-6 h-6 opacity-50" />
                </div>
                <p className="text-sm font-bold text-white mb-1">Video Unavailable</p>
                <p className="text-xs text-white/50">Could not load the sign language video for "{title}".</p>
              </div>
            )}

            <video 
              ref={videoRef}
              src={src}
              className="w-full h-full object-contain"
              loop
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onLoadedData={() => { setLoading(false); setError(false); }}
              onError={() => { setError(true); setLoading(false); }}
            />
            
            {!isPlaying && !error && !loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer" onClick={togglePlay}>
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <Play className="w-8 h-8 text-white fill-current ml-1" />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
        <h4 className="font-bold text-lg">{title}</h4>
        {!isYouTube && (
          <div className="flex gap-2">
            <button onClick={togglePlay} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button onClick={handleRepeat} className="p-2 hover:bg-white/10 rounded-lg transition-colors" title="Repeat">
              <RotateCcw className="w-5 h-5" />
            </button>
            <button 
              onClick={toggleSlowMo} 
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${playbackRate < 1 ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/70'}`}
            >
              SLOW MO
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;
