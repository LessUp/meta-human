// FPS 监控组件 — 从 DigitalHumanViewer.enhanced.tsx 提取
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useDigitalHumanStore } from '@/store/digitalHumanStore';

interface FPSMonitorProps {
  onFPSUpdate?: (fps: number) => void;
}

export default function FPSMonitor({ onFPSUpdate }: FPSMonitorProps) {
  const frameTimesRef = useRef<number[]>([]);
  const lastUpdateRef = useRef<number>(0);
  const { updatePerformanceMetrics } = useDigitalHumanStore.getState();

  useFrame((state) => {
    const now = state.clock.elapsedTime * 1000;
    frameTimesRef.current.push(now);

    while (frameTimesRef.current.length > 60) {
      frameTimesRef.current.shift();
    }

    if (now - lastUpdateRef.current > 500 && frameTimesRef.current.length > 1) {
      const times = frameTimesRef.current;
      const totalTime = times[times.length - 1] - times[0];
      const fps = totalTime > 0 ? Math.round((times.length - 1) / (totalTime / 1000)) : 0;

      updatePerformanceMetrics({ fps, lastFrameTime: now });
      onFPSUpdate?.(fps);
      lastUpdateRef.current = now;
    }
  });

  return null;
}
