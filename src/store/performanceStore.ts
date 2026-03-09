// performanceStore — FPS/性能指标（防抖更新）
// 参考 AIRI 领域分离设计
import { create } from 'zustand';
import type { PerformanceMetrics } from './types';
import { StateDebouncer } from './utils';

// 防抖器实例（高频 FPS 更新专用）
const fpsDebouncer = new StateDebouncer({ maxUpdatesPerSecond: 10, debounceInterval: 100 });

interface PerformanceState {
  performanceMetrics: PerformanceMetrics;
  updatePerformanceMetrics: (metrics: Partial<PerformanceMetrics>) => void;
}

export const usePerformanceStore = create<PerformanceState>((set) => ({
  performanceMetrics: { fps: 0, lastFrameTime: 0 },

  updatePerformanceMetrics: (metrics) => {
    fpsDebouncer.schedule(() => {
      set((state) => ({
        performanceMetrics: { ...state.performanceMetrics, ...metrics },
      }));
    });
  },
}));
