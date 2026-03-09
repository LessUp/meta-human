/**
 * 页面可见性优化器
 *
 * 从原 performanceMonitor.ts 拆分，独立管理页面可见性变化时的资源暂停/恢复。
 */

import type { VisibilityConfig } from '../types'
import { coreEvents } from '../events'

const DEFAULT_CONFIG: VisibilityConfig = {
  pauseDelay: 100,
  resumeDelay: 100,
}

/**
 * 创建页面可见性优化器
 */
export function createVisibilityOptimizer(config?: Partial<VisibilityConfig>) {
  const cfg: VisibilityConfig = { ...DEFAULT_CONFIG, ...config }

  let isPageVisible = true
  const pauseCallbacks: (() => void)[] = []
  const resumeCallbacks: (() => void)[] = []
  let pauseTimeoutId: ReturnType<typeof setTimeout> | null = null
  let resumeTimeoutId: ReturnType<typeof setTimeout> | null = null

  function clearTimeouts(): void {
    if (pauseTimeoutId) {
      clearTimeout(pauseTimeoutId)
      pauseTimeoutId = null
    }
    if (resumeTimeoutId) {
      clearTimeout(resumeTimeoutId)
      resumeTimeoutId = null
    }
  }

  function handleVisibilityChange(): void {
    const isVisible = document.visibilityState === 'visible'

    if (isVisible === isPageVisible) return

    isPageVisible = isVisible
    clearTimeouts()

    if (!isVisible) {
      pauseTimeoutId = setTimeout(() => {
        pauseCallbacks.forEach(cb => cb())
        coreEvents.emit('performance:visibility:hidden')
      }, cfg.pauseDelay)
    } else {
      resumeTimeoutId = setTimeout(() => {
        resumeCallbacks.forEach(cb => cb())
        coreEvents.emit('performance:visibility:visible')
      }, cfg.resumeDelay)
    }
  }

  return {
    /**
     * 开始监听页面可见性变化
     */
    start(): void {
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', handleVisibilityChange)
        isPageVisible = document.visibilityState === 'visible'
      }
    },

    /**
     * 停止监听
     */
    stop(): void {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
      clearTimeouts()
    },

    /**
     * 注册暂停回调
     */
    onPause(callback: () => void): () => void {
      pauseCallbacks.push(callback)
      return () => {
        const index = pauseCallbacks.indexOf(callback)
        if (index >= 0) pauseCallbacks.splice(index, 1)
      }
    },

    /**
     * 注册恢复回调
     */
    onResume(callback: () => void): () => void {
      resumeCallbacks.push(callback)
      return () => {
        const index = resumeCallbacks.indexOf(callback)
        if (index >= 0) resumeCallbacks.splice(index, 1)
      }
    },

    /**
     * 获取页面是否可见
     */
    isVisible(): boolean {
      return isPageVisible
    },

    /**
     * 更新配置
     */
    updateConfig(newConfig: Partial<VisibilityConfig>): void {
      Object.assign(cfg, newConfig)
    },

    /**
     * 销毁
     */
    dispose(): void {
      this.stop()
      pauseCallbacks.length = 0
      resumeCallbacks.length = 0
    },
  }
}

export type VisibilityOptimizer = ReturnType<typeof createVisibilityOptimizer>
