/**
 * FPS 监控器
 *
 * 从原 performanceMonitor.ts 拆分，独立管理帧率监控。
 * 通过 StoreBridge + EventBus 与外部通信。
 */

import type { FPSMonitorConfig, StoreBridge } from '../types'
import { coreEvents } from '../events'

const DEFAULT_CONFIG: FPSMonitorConfig = {
  sampleSize: 60,
  targetFPS: 60,
  warningThreshold: 30,
}

export interface FPSMonitorOptions {
  store: StoreBridge
  config?: Partial<FPSMonitorConfig>
}

/**
 * 创建 FPS 监控器
 */
export function createFPSMonitor(options: FPSMonitorOptions) {
  const { store } = options
  const config: FPSMonitorConfig = { ...DEFAULT_CONFIG, ...options.config }

  let frameTimes: number[] = []
  let lastFrameTime = 0
  let animationFrameId: number | null = null
  let isRunning = false
  let onFPSUpdate: ((fps: number) => void) | undefined

  function getCurrentFPS(): number {
    if (frameTimes.length < 2) return 0
    const totalTime = frameTimes[frameTimes.length - 1] - frameTimes[0]
    if (totalTime === 0) return 0
    return Math.round((frameTimes.length - 1) / (totalTime / 1000))
  }

  function tick(): void {
    if (!isRunning) return

    const currentTime = performance.now()
    frameTimes.push(currentTime)

    // 保持采样窗口大小
    while (frameTimes.length > config.sampleSize) {
      frameTimes.shift()
    }

    const fps = getCurrentFPS()

    // 更新 store 中的性能指标
    store.updatePerformanceMetrics({
      fps,
      lastFrameTime: currentTime,
    })

    // 触发事件
    coreEvents.emit('performance:fps:update', { fps })

    // 低帧率警告
    if (fps > 0 && fps < config.warningThreshold) {
      coreEvents.emit('performance:fps:warning', { fps, threshold: config.warningThreshold })
    }

    onFPSUpdate?.(fps)

    lastFrameTime = currentTime
    animationFrameId = requestAnimationFrame(tick)
  }

  return {
    /**
     * 开始监控帧率
     */
    start(callback?: (fps: number) => void): void {
      if (isRunning) return
      isRunning = true
      onFPSUpdate = callback
      lastFrameTime = performance.now()
      frameTimes = []
      tick()
    },

    /**
     * 停止监控
     */
    stop(): void {
      isRunning = false
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = null
      }
    },

    /**
     * 获取当前帧率
     */
    getCurrentFPS,

    /**
     * 获取平均帧率
     */
    getAverageFPS(): number {
      return getCurrentFPS()
    },

    /**
     * 检查帧率是否低于警告阈值
     */
    isBelowThreshold(): boolean {
      return getCurrentFPS() < config.warningThreshold
    },

    /**
     * 更新配置
     */
    updateConfig(newConfig: Partial<FPSMonitorConfig>): void {
      Object.assign(config, newConfig)
    },

    /**
     * 销毁
     */
    dispose(): void {
      this.stop()
      frameTimes = []
    },
  }
}

export type FPSMonitor = ReturnType<typeof createFPSMonitor>
