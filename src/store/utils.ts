// 工具函数 — 从 digitalHumanStore.ts 提取
// ID 生成、防抖、localStorage 辅助

// ============================================================
// ID 生成
// ============================================================

export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export const generateErrorId = (): string => {
  return `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// ============================================================
// localStorage 安全访问
// ============================================================

export const getSafeLocalStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    const testKey = '__test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch {
    return null;
  }
};

export const getOrCreateSessionId = (): string => {
  const storage = getSafeLocalStorage();
  if (!storage) return generateSessionId();
  try {
    const stored = storage.getItem('metahuman_session_id');
    if (stored) return stored;
    const newId = generateSessionId();
    storage.setItem('metahuman_session_id', newId);
    return newId;
  } catch {
    return generateSessionId();
  }
};

// ============================================================
// 防抖更新器
// 参考 AIRI 高频数据更新策略，封装为类避免模块级可变状态
// ============================================================

interface DebouncerConfig {
  maxUpdatesPerSecond: number;
  debounceInterval: number;
}

export class StateDebouncer {
  private lastUpdateTime = 0;
  private updateCount = 0;
  private windowStart = 0;
  private pendingUpdate: (() => void) | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(private config: DebouncerConfig = { maxUpdatesPerSecond: 10, debounceInterval: 100 }) {}

  schedule(updateFn: () => void): void {
    const now = Date.now();

    // 重置计数窗口
    if (now - this.windowStart >= 1000) {
      this.updateCount = 0;
      this.windowStart = now;
    }

    // 超过每秒最大更新次数 → 排队
    if (this.updateCount >= this.config.maxUpdatesPerSecond) {
      this.pendingUpdate = updateFn;
      if (!this.timeoutId) {
        this.timeoutId = setTimeout(() => {
          this.timeoutId = null;
          if (this.pendingUpdate) {
            this.pendingUpdate();
            this.pendingUpdate = null;
            this.updateCount++;
          }
        }, this.config.debounceInterval);
      }
      return;
    }

    // 防抖间隔内 → 延迟
    if (now - this.lastUpdateTime < this.config.debounceInterval) {
      this.pendingUpdate = updateFn;
      if (!this.timeoutId) {
        const delay = this.config.debounceInterval - (now - this.lastUpdateTime);
        this.timeoutId = setTimeout(() => {
          this.timeoutId = null;
          if (this.pendingUpdate) {
            this.pendingUpdate();
            this.pendingUpdate = null;
            this.lastUpdateTime = Date.now();
            this.updateCount++;
          }
        }, delay);
      }
      return;
    }

    // 立即执行
    updateFn();
    this.lastUpdateTime = now;
    this.updateCount++;
  }

  dispose(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.pendingUpdate = null;
  }
}

// ============================================================
// 错误定时器管理器
// 封装为类，避免模块级 Map 污染
// ============================================================

export class ErrorTimerManager {
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  set(errorId: string, callback: () => void, delayMs: number): void {
    const timer = setTimeout(() => {
      this.timers.delete(errorId);
      callback();
    }, delayMs);
    this.timers.set(errorId, timer);
  }

  clear(errorId: string): void {
    const timer = this.timers.get(errorId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(errorId);
    }
  }

  clearAll(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
  }
}
