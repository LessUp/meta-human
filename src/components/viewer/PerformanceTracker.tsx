/**
 * 性能追踪组件。
 *
 * 计算 FPS 和帧时间，上报到系统 store。
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSystemStore } from '@/store/systemStore';
import { useIsTabVisibleRef } from '@/hooks';

export function PerformanceTracker() {
  const updateRenderPerformance = useSystemStore((s) => s.updateRenderPerformance);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsHistoryRef = useRef<number[]>([]);
  const isVisibleRef = useIsTabVisibleRef();

  useFrame(() => {
    if (!isVisibleRef.current) return;

    frameCountRef.current++;
    const now = performance.now();
    const elapsed = now - lastTimeRef.current;

    // 每 500ms 更新一次 FPS
    if (elapsed >= 500) {
      const fps = (frameCountRef.current * 1000) / elapsed;
      const frameTime = elapsed / frameCountRef.current;

      fpsHistoryRef.current.push(fps);
      if (fpsHistoryRef.current.length > 10) {
        fpsHistoryRef.current.shift();
      }

      const avgFPS =
        fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length;

      updateRenderPerformance({
        currentFPS: Math.round(fps),
        averageFPS: Math.round(avgFPS),
        frameTimeMs: Number(frameTime.toFixed(2)),
      });

      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }
  });

  return null;
}
