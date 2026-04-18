import React, { useEffect, useState, useRef } from 'react';
import { detectGesture } from '../utils/gestureModel';

const GestureDetector = ({ videoElement, onGestureDetected }) => {
  const [status, setStatus] = useState('Loading AI...');
  const [lastGesture, setLastGesture] = useState(null);
  const [hands, setHands] = useState(null);
  const canvasRef = useRef(null);
  const lastGestureRef = useRef(null);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    let handsInstance = null;
    let isMounted = true;

    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    const init = async () => {
      try {
        setStatus('Connecting to AI...');
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");
        await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js");

        if (!isMounted) return;
        if (!window.Hands) throw new Error("MediaPipe Hands failed to load");

        handsInstance = new window.Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        handsInstance.setOptions({
          maxNumHands: 2,
          modelComplexity: 1, // 0 for Lite, 1 for Full
          minDetectionConfidence: 0.4,
          minTrackingConfidence: 0.4
        });

        handsInstance.onResults((results) => {
          if (!isMounted) return;
          
          // Draw on canvas
          if (canvasRef.current) {
            const canvasCtx = canvasRef.current.getContext('2d');
            canvasCtx.save();
            canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            
            if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
              for (const landmarks of results.multiHandLandmarks) {
                if (window.drawConnectors) {
                  window.drawConnectors(canvasCtx, landmarks, window.HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 5});
                  window.drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 2});
                }
              }
              
              const gesture = detectGesture(results.multiHandLandmarks);
              if (gesture && gesture !== lastGestureRef.current) {
                const now = Date.now();
                if (now - lastTimeRef.current > 1500) {
                  setLastGesture(gesture);
                  lastGestureRef.current = gesture;
                  onGestureDetected(gesture);
                  lastTimeRef.current = now;
                }
              }
            } else {
              if (lastGestureRef.current) {
                setLastGesture(null);
                lastGestureRef.current = null;
              }
            }
            canvasCtx.restore();
          }
        });

        setHands(handsInstance);
        setStatus('Waiting for hands...');
      } catch (err) {
        console.error("SignConnect AI Error:", err);
        setStatus('AI failed to start. Please refresh.');
      }
    };

    init();

    return () => {
      isMounted = false;
      if (handsInstance) handsInstance.close();
    };
  }, []);

  useEffect(() => {
    let animationId;
    const processFrame = async () => {
      if (hands && videoElement && videoElement.readyState === 4) {
        try {
          await hands.send({ image: videoElement });
        } catch (e) {}
      }
      animationId = requestAnimationFrame(processFrame);
    };

    if (hands && videoElement) {
      processFrame();
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [hands, videoElement]);

  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      <canvas 
        ref={canvasRef}
        className="w-full h-full object-cover opacity-80"
        width={1280}
        height={720}
      />
      <div className="gesture-overlay">
        {lastGesture ? `Detected: ${lastGesture}` : status}
      </div>
    </div>
  );
};

export default GestureDetector;
