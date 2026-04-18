import React, { useRef, useEffect } from 'react';

const CameraFeed = ({ onFrame }) => {
  const videoRef = useRef(null);

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  useEffect(() => {
    let stream = null;
    async function startCamera() {
      try {
        setLoading(true);
        // Try with more relaxed constraints first
        const constraints = { 
          video: true // Simple default first
        };
        
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setLoading(false);
        }
      } catch (err) {
        console.error("Camera access denied:", err);
        let msg = err.message || "Camera access denied";
        if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          msg = "Camera is being used by another application or tab. Please close other apps and try again.";
        }
        setError(msg);
        setLoading(false);
      }
    }

    startCamera();

    const interval = setInterval(() => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        onFrame(videoRef.current);
      }
    }, 100);

    return () => {
      clearInterval(interval);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [onFrame]);

  return (
    <div className="camera-preview h-full">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10">
          <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 animate-spin rounded-full mb-4"></div>
          <p className="text-xs text-white/50 font-bold uppercase tracking-widest">Initializing Camera...</p>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-10 p-8 text-center">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-white font-bold mb-2">Camera Access Failed</p>
          <p className="text-xs text-white/40 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors"
          >
            RETRY
          </button>
        </div>
      )}

      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default CameraFeed;
