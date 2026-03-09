/**
 * 状态更新防抖器
 *
 * 从原 performanceMonitor.ts 拆分，独立管理高频状态更新的防抖。
 */

import type { DebounceConfig } from '../types'

const DEFAULT_CONFIG: DebounceConfig = {
  maxUpdatesPerSecond: 10,
  debounceInterval: 100,
}

/**
 * 创建状态防抖器
 */
export function createStateDebouncer(config?: Partial<DebounceConfig>) {
  const cfg: DebounceConfig = { ...DEFAULT_CONFIG, ...config }

  let lastUpdateTime = 0
  let pendingUpdate: (() => void) | null = null
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let updateCount = 0
  let windowStart = 0

  return {
    /**
     * 防抖执行更新
     */
    debounce(updateFn: () => void): void {
      const now = Date.now()

      // 重置计数窗口
      if (now - windowStart >= 1000) {
        updateCount = 0
        windowStart = now
      }

      // 检查是否超过每秒最大更新次数
      if (updateCount >= cfg.maxUpdatesPerSecond) {
        pendingUpdate = updateFn

        if (!timeoutId) {
          timeoutId = setTimeout(() => {
            timeoutId = null
            if (pendingUpdate) {
              pendingUpdate()
              pendingUpdate = null
              updateCount++
            }
          }, cfg.debounceInterval)
        }
        return
      }

      // 检查防抖间隔
      if (now - lastUpdateTime < cfg.debounceInterval) {
        pendingUpdate = updateFn

        if (!timeoutId) {
          const delay = cfg.debounceInterval - (now - lastUpdateTime)
          timeoutId = setTimeout(() => {
            timeoutId = null
            if (pendingUpdate) {
              pendingUpdate()
              pendingUpdate = null
              lastUpdateTime = Date.now()
              updateCount++
            }
          }, delay)
        }
        return
      }

      // 立即执行
      updateFn()
      lastUpdateTime = now
      updateCount++
    },

    /**
     * 获取当前秒内的更新次数
     */
    getUpdateCount(): number {
      return updateCount
    },

    /**
     * 清除待处理的更新
     */
    clear(): void {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      pendingUpdate = null
    },

    /**
     * 更新配置
     */
    updateConfig(newConfig: Partial<DebounceConfig>): void {
      Object.assign(cfg, newConfig)
    },

    /**
     * 销毁
     */
    dispose(): void {
      this.clear()
    },
  }
}

export type StateDebouncer = ReturnType<typeof createStateDebouncer>

/**
 * 创建防抖状态更新函数
 */
export function createDebouncedUpdater<T>(
  updateFn: (value: T) => void,
  debouncer?: StateDebouncer,
): (value: T) => void {
  const d = debouncer ?? createStateDebouncer()
  return (value: T) => {
    d.debounce(() => updateFn(value))
  }
}
