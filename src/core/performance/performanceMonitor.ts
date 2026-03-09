/**
 * @deprecated 此文件为兼容层，请迁移到新模块：
 * - FPS: import { createFPSMonitor } from '@/core/performance/fps-monitor'
 * - 防抖: import { createStateDebouncer } from '@/core/performance/state-debouncer'
 * - 可见性: import { createVisibilityOptimizer } from '@/core/performance/visibility-optimizer'
 */

import {
  getCoreInstances,
  initPerformanceMonitoring as _initPerformanceMonitoring,
} from "../index";
import { createStateDebouncer as _createStateDebouncer } from "./state-debouncer";
import { createFPSMonitor as _createFPSMonitor } from "./fps-monitor";
import { createVisibilityOptimizer as _createVisibilityOptimizer } from "./visibility-optimizer";

// 重新导出类型
export type {
  FPSMonitorConfig,
  DebounceConfig,
  VisibilityConfig,
} from "../types";

// 兼容旧的单例导出（通过 Proxy 延迟初始化）
export const fpsMonitor = new Proxy({} as any, {
  get(_target, prop) {
    const { fpsMonitor } = getCoreInstances();
    return (fpsMonitor as any)[prop];
  },
});

export const stateDebouncer = _createStateDebouncer();

export const visibilityOptimizer = new Proxy({} as any, {
  get(_target, prop) {
    const { visibility } = getCoreInstances();
    return (visibility as any)[prop];
  },
});

// 兼容旧的类导出（用于类型引用和 new 调用）
export class FPSMonitor {
  private _inner: ReturnType<typeof _createFPSMonitor>;
  constructor(config?: any) {
    this._inner = _createFPSMonitor({
      store: getCoreInstances().store,
      config,
    });
  }
  start(cb?: any) {
    this._inner.start(cb);
  }
  stop() {
    this._inner.stop();
  }
  getCurrentFPS() {
    return this._inner.getCurrentFPS();
  }
  getAverageFPS() {
    return this._inner.getAverageFPS();
  }
  isBelowThreshold() {
    return this._inner.isBelowThreshold();
  }
  updateConfig(c: any) {
    this._inner.updateConfig(c);
  }
}

export class StateDebouncer {
  private _inner: ReturnType<typeof _createStateDebouncer>;
  constructor(config?: any) {
    this._inner = _createStateDebouncer(config);
  }
  debounce(fn: () => void) {
    this._inner.debounce(fn);
  }
  getUpdateCount() {
    return this._inner.getUpdateCount();
  }
  clear() {
    this._inner.clear();
  }
  updateConfig(c: any) {
    this._inner.updateConfig(c);
  }
}

export class VisibilityOptimizer {
  private _inner: ReturnType<typeof _createVisibilityOptimizer>;
  constructor(config?: any) {
    this._inner = _createVisibilityOptimizer(config);
  }
  start() {
    this._inner.start();
  }
  stop() {
    this._inner.stop();
  }
  onPause(cb: () => void) {
    return this._inner.onPause(cb);
  }
  onResume(cb: () => void) {
    return this._inner.onResume(cb);
  }
  isVisible() {
    return this._inner.isVisible();
  }
  updateConfig(c: any) {
    this._inner.updateConfig(c);
  }
}

/**
 * 创建防抖状态更新函数
 */
export function createDebouncedUpdater<T>(
  updateFn: (value: T) => void,
  debouncer: any = stateDebouncer,
): (value: T) => void {
  return (value: T) => {
    debouncer.debounce(() => updateFn(value));
  };
}

/**
 * 性能监控 Hook 辅助函数
 */
export function initPerformanceMonitoring(): () => void {
  return _initPerformanceMonitoring();
}
