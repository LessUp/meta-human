/**
 * Vision mirror hook.
 *
 * Encapsulates vision service calls for emotion and motion detection.
 * Provides a clean interface for components.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { visionService } from '../core/vision/visionService';
import type { UserEmotion } from '../core/vision/visionMapper';

export interface UseVisionMirrorOptions {
  /** Called when an emotion is detected */
  onEmotionChange?: (emotion: UserEmotion) => void;
  /** Called when a head motion is detected */
  onHeadMotion?: (motion: 'nod' | 'shakeHead' | 'raiseHand' | 'waveHand') => void;
}

export interface VisionMirrorControls {
  /** Whether the camera is currently on */
  isCameraOn: boolean;
  /** Whether the camera is initializing */
  isLoading: boolean;
  /** Current error message, if any */
  error: string | null;
  /** Currently detected emotion */
  currentEmotion: UserEmotion;
  /** Last detected motion */
  lastMotion: 'nod' | 'shakeHead' | 'raiseHand' | 'waveHand' | null;
  /** Current FPS */
  fps: number;
  /** Video element ref to attach to <video> */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Toggle camera on/off */
  toggleCamera: () => Promise<void>;
}

/**
 * Hook for vision-based emotion and motion detection.
 *
 * @example
 * ```tsx
 * const vision = useVisionMirror({
 *   onEmotionChange: (emotion) => console.log('Emotion:', emotion),
 *   onHeadMotion: (motion) => console.log('Motion:', motion),
 * });
 *
 * <video ref={vision.videoRef} />
 * <button onClick={vision.toggleCamera}>
 *   {vision.isCameraOn ? 'Stop' : 'Start'}
 * </button>
 * ```
 */
export function useVisionMirror(options: UseVisionMirrorOptions = {}): VisionMirrorControls {
  const { onEmotionChange, onHeadMotion } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentEmotion, setCurrentEmotion] = useState<UserEmotion>('neutral');
  const [lastMotion, setLastMotion] = useState<
    'nod' | 'shakeHead' | 'raiseHand' | 'waveHand' | null
  >(null);
  const [fps, setFps] = useState(0);

  // Track if component is mounted
  const mountedRef = useRef(true);

  // Use refs for callbacks to avoid stale closures and reduce re-binding
  const onEmotionChangeRef = useRef(onEmotionChange);
  const onHeadMotionRef = useRef(onHeadMotion);
  onEmotionChangeRef.current = onEmotionChange;
  onHeadMotionRef.current = onHeadMotion;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      visionService.stop();
    };
  }, []);

  // Auto-hide motion indicator
  useEffect(() => {
    if (lastMotion) {
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          setLastMotion(null);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [lastMotion]);

  // Update FPS periodically with change detection to avoid unnecessary re-renders
  useEffect(() => {
    if (!isCameraOn) return;

    const prevFpsRef = { current: 0 };

    const interval = setInterval(() => {
      if (mountedRef.current) {
        const newFps = visionService.getFps();
        if (newFps !== prevFpsRef.current) {
          prevFpsRef.current = newFps;
          setFps(newFps);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isCameraOn]);

  // Toggle camera
  const toggleCamera = useCallback(async () => {
    if (isCameraOn) {
      visionService.stop();
      setIsCameraOn(false);
      setCurrentEmotion('neutral');
      onEmotionChangeRef.current?.('neutral');
      setLastMotion(null);
      setFps(0);
      setError(null);
    } else {
      if (videoRef.current) {
        setIsLoading(true);
        setError(null);

        const success = await visionService.start(
          videoRef.current,
          (emotion) => {
            if (!mountedRef.current) return;
            setCurrentEmotion(emotion);
            onEmotionChangeRef.current?.(emotion);
          },
          (motion) => {
            if (!mountedRef.current) return;
            setLastMotion(motion);
            onHeadMotionRef.current?.(motion);
          },
        );

        if (!mountedRef.current) return;

        setIsLoading(false);

        if (success) {
          setIsCameraOn(true);
        } else {
          setError('摄像头启动失败，请检查权限设置');
        }
      }
    }
  }, [isCameraOn]); // Removed callback deps - now using refs

  return {
    isCameraOn,
    isLoading,
    error,
    currentEmotion,
    lastMotion,
    fps,
    videoRef,
    toggleCamera,
  };
}
