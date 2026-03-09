/**
 * 性能监控模块统一导出
 */

export { createFPSMonitor, type FPSMonitor, type FPSMonitorOptions } from './fps-monitor'
export { createStateDebouncer, createDebouncedUpdater, type StateDebouncer } from './state-debouncer'
export { createVisibilityOptimizer, type VisibilityOptimizer } from './visibility-optimizer'
