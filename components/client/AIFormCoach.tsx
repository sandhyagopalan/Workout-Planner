
import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, RefreshCw, CheckCircle2 } from 'lucide-react';

declare global {
  interface Window {
    Pose: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    POSE_CONNECTIONS: any;
  }
}

interface Props {
  onClose: () => void;
}

const AIFormCoach: React.FC<Props> = ({ onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState("Stand back to show full body");
  const [repCount, setRepCount] = useState(0);
  const [squatState, setSquatState] = useState<'up' | 'down'>('up');
  const [depthScore, setDepthScore] = useState(0);

  // Logic for Angle Calculation
  const calculateAngle = (a: any, b: any, c: any) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  };

  useEffect(() => {
    if (!window.Pose || !window.Camera) {
      setFeedback("MediaPipe libraries not loaded");
      return;
    }

    const pose = new window.Pose({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    pose.onResults(onResults);

    let camera: any;

    if (videoRef.current) {
      camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) await pose.send({ image: videoRef.current });
        },
        width: 640,
        height: 480
      });
      camera.start()
        .then(() => setIsLoading(false))
        .catch((e: any) => {
            console.error(e);
            setFeedback("Camera permission denied");
            setIsLoading(false);
        });
    }

    return () => {
        if (camera) camera.stop();
        pose.close();
    };
  }, []);

  const onResults = (results: any) => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // Draw Video Feed
    canvasCtx.globalCompositeOperation = 'source-over';
    canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

    if (results.poseLandmarks) {
      // Draw Skeleton
      window.drawConnectors(canvasCtx, results.poseLandmarks, window.POSE_CONNECTIONS,
        { color: 'rgba(255, 255, 255, 0.5)', lineWidth: 2 });
      window.drawLandmarks(canvasCtx, results.poseLandmarks,
        { color: 'rgba(0, 255, 255, 0.5)', lineWidth: 1, radius: 3 });

      // --- SQUAT LOGIC ---
      // Landmarks: 23=Left Hip, 25=Left Knee, 27=Left Ankle
      // Or 24, 26, 28 for Right side.
      // We'll pick the side that is more visible (higher visibility score)
      
      const landmarks = results.poseLandmarks;
      const leftVis = landmarks[23].visibility * landmarks[25].visibility * landmarks[27].visibility;
      const rightVis = landmarks[24].visibility * landmarks[26].visibility * landmarks[28].visibility;
      
      const isLeft = leftVis > rightVis;
      
      const hip = isLeft ? landmarks[23] : landmarks[24];
      const knee = isLeft ? landmarks[25] : landmarks[26];
      const ankle = isLeft ? landmarks[27] : landmarks[28];

      // Calculate Knee Angle
      const angle = calculateAngle(hip, knee, ankle);
      
      // Visualizing the angle
      const midX = knee.x * canvasRef.current.width;
      const midY = knee.y * canvasRef.current.height;
      
      canvasCtx.fillStyle = 'white';
      canvasCtx.font = '30px Arial';
      canvasCtx.fillText(Math.round(angle).toString() + '°', midX + 10, midY);

      // Logic
      if (angle < 160) {
          // In squat motion
          if (angle < 95) {
              // Deep enough
              canvasCtx.fillStyle = '#00ff00'; // Green
              canvasCtx.fillText("GOOD DEPTH!", 50, 100);
              setFeedback("Perfect! Drive up.");
              setDepthScore(100);
              
              // Draw Green Lines for active feedback
              window.drawConnectors(canvasCtx, results.poseLandmarks, [[isLeft ? 23 : 24, isLeft ? 25 : 26], [isLeft ? 25 : 26, isLeft ? 27 : 28]], { color: '#00FF00', lineWidth: 8 });

              if (squatState === 'up') {
                  setSquatState('down');
              }
          } else {
              canvasCtx.fillStyle = 'yellow';
              setFeedback("Go Lower...");
              setDepthScore(Math.max(0, 100 - (angle - 90)));
              
              // Draw Yellow Lines
              window.drawConnectors(canvasCtx, results.poseLandmarks, [[isLeft ? 23 : 24, isLeft ? 25 : 26], [isLeft ? 25 : 26, isLeft ? 27 : 28]], { color: '#FFFF00', lineWidth: 4 });
          }
      } else {
          // Standing up
          setFeedback("Ready");
          setDepthScore(0);
          
          if (squatState === 'down') {
              setRepCount(prev => prev + 1);
              setSquatState('up');
          }
      }
    } else {
        setFeedback("Can't see full body");
    }
    
    canvasCtx.restore();
  };

  return (
    <div className="absolute inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-12 flex justify-between items-start z-20 bg-gradient-to-b from-black/80 to-transparent">
          <div>
              <h3 className="text-white font-bold text-lg flex items-center gap-2"><Camera size={20} className="text-green-400"/> AI Form Coach</h3>
              <p className="text-white/80 text-sm">Squat Depth Detector</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white"><X size={24}/></button>
      </div>

      {/* Video Canvas Container */}
      <div className="flex-1 relative bg-slate-900 flex items-center justify-center overflow-hidden">
          {isLoading && <div className="absolute z-10 text-white flex flex-col items-center"><RefreshCw className="animate-spin mb-2"/> Initializing AI...</div>}
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-0" autoPlay playsInline muted></video>
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover"></canvas>
          
          {/* Feedback Overlay */}
          <div className="absolute bottom-20 left-4 right-4">
              <div className="bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                  <div className="flex justify-between items-end mb-2">
                      <span className="text-white font-bold text-2xl">{feedback}</span>
                      <span className="text-green-400 font-black text-4xl">{repCount} <span className="text-sm text-white font-medium">reps</span></span>
                  </div>
                  <div className="h-3 w-full bg-white/20 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-200 ${depthScore > 90 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${depthScore}%` }}></div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default AIFormCoach;
