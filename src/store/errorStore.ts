// errorStore — 错误队列/自动清除管理
// 参考 AIRI 领域分离设计
import { create } from 'zustand';
import type { ErrorItem } from './types';
import { generateErrorId, ErrorTimerManager } from './utils';

// 错误定时器管理器实例
const errorTimers = new ErrorTimerManager();

interface ErrorState {
  error: string | null;
  lastErrorTime: number | null;
  errorQueue: ErrorItem[];
  maxErrorQueueLength: number;

  setError: (error: string | null) => void;
  clearError: () => void;
  addError: (message: string, severity?: 'info' | 'warning' | 'error', autoHideMs?: number) => void;
  dismissError: (errorId: string) => void;
  clearAllErrors: () => void;
}

export const useErrorStore = create<ErrorState>((set, get) => ({
  error: null,
  lastErrorTime: null,
  errorQueue: [],
  maxErrorQueueLength: 5,

  setError: (error) => set({ error, lastErrorTime: error ? Date.now() : null }),

  clearError: () => set({ error: null, lastErrorTime: null }),

  addError: (message, severity = 'error', autoHideMs = 5000) => {
    const errorId = generateErrorId();
    const errorItem: ErrorItem = {
      id: errorId,
      message,
      severity,
      timestamp: Date.now(),
      dismissable: true,
      autoHideMs,
    };

    set((state) => {
      let newQueue = [...state.errorQueue, errorItem];
      // 限制队列长度
      while (newQueue.length > state.maxErrorQueueLength) {
        const removed = newQueue.shift();
        if (removed) errorTimers.clear(removed.id);
      }
      return { errorQueue: newQueue, error: message, lastErrorTime: Date.now() };
    });

    // 设置自动清除
    if (autoHideMs && autoHideMs > 0) {
      errorTimers.set(errorId, () => get().dismissError(errorId), autoHideMs);
    }
  },

  dismissError: (errorId) => {
    errorTimers.clear(errorId);
    set((state) => ({
      errorQueue: state.errorQueue.filter(e => e.id !== errorId),
    }));
  },

  clearAllErrors: () => {
    errorTimers.clearAll();
    set({ errorQueue: [], error: null, lastErrorTime: null });
  },
}));
