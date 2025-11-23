import React, { useEffect, useRef, useState } from 'react';
import { visionService } from '../core/vision/visionService';
import type { UserEmotion } from '../core/vision/visionMapper';
import { Camera, CameraOff, ScanFace } from 'lucide-react';

interface VisionMirrorPanelProps {
  onEmotionChange: (emotion: UserEmotion) => void;
  onHeadMotion?: (motion: 'nod' | 'shakeHead' | 'raiseHand' | 'waveHand') => void;
}

export default function VisionMirrorPanel({ onEmotionChange, onHeadMotion }: VisionMirrorPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<UserEmotion>('neutral');

  useEffect(() => {
    return () => {
      visionService.stop();
    };
  }, []);

  const handleToggleCamera = async () => {
    if (isCameraOn) {
      visionService.stop();
      setIsCameraOn(false);
      setCurrentEmotion('neutral');
      onEmotionChange('neutral');
    } else {
      if (videoRef.current) {
        await visionService.start(
          videoRef.current,
          (emotion) => {
            setCurrentEmotion(emotion);
            onEmotionChange(emotion);
          },
          (motion) => {
            if (onHeadMotion) {
              onHeadMotion(motion);
            }
          },
        );
        setIsCameraOn(true);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Vision Mirror</h3>
        <div className="flex items-center space-x-2">
            <div className={`w-1.5 h-1.5 rounded-full ${isCameraOn ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`}></div>
            <span className="text-xs text-white/60">{isCameraOn ? 'LIVE' : 'OFFLINE'}</span>
        </div>
      </div>

      <div className="relative aspect-video bg-black/50 rounded-xl overflow-hidden border border-white/10 shadow-inner">
        {!isCameraOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/20">
                <ScanFace size={48} className="mb-2" />
                <span className="text-xs uppercase tracking-widest">Camera Disabled</span>
            </div>
        )}
        <video
          ref={videoRef}
          className={`w-full h-full object-cover transition-opacity ${isCameraOn ? 'opacity-100' : 'opacity-0'}`}
          autoPlay
          playsInline
          muted
        />
        {isCameraOn && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur rounded text-[10px] text-white/80 border border-white/10">
                AI TRACKING
            </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div className="text-xs text-white/60">
            Detected Emotion:
            <span className="ml-2 font-mono text-blue-400 uppercase">
            {currentEmotion}
            </span>
        </div>
        
        <button
          onClick={handleToggleCamera}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-medium transition-all border ${
            isCameraOn 
            ? 'bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30' 
            : 'bg-blue-500/20 text-blue-400 border-blue-500/50 hover:bg-blue-500/30'
          }`}
        >
          {isCameraOn ? <CameraOff size={14} /> : <Camera size={14} />}
          <span>{isCameraOn ? 'Stop Camera' : 'Start Camera'}</span>
        </button>
      </div>
    </div>
  );
}
