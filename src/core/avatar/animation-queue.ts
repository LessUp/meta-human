/**
 * 动画队列管理器
 *
 * 从 DigitalHumanEngine 中拆分，独立管理动画序列的排队、执行和取消。
 * 参考 airi 的 playback-manager 模式。
 */

import type { AnimationQueueItem, AnimationOptions } from '../types'

// ============================================================
// 动作持续时间配置
// ============================================================

export const ANIMATION_DURATIONS: Record<string, number> = {
  wave: 3000,
  greet: 3000,
  nod: 2000,
  shakeHead: 2000,
  dance: 6000,
  think: 3000,
  speak: 0,
  idle: 0,
  bow: 3000,
  clap: 3000,
  thumbsUp: 3000,
  headTilt: 2500,
  shrug: 2500,
  lookAround: 4000,
  cheer: 4000,
  sleep: 5000,
  crossArms: 3000,
  point: 3000,
}

// ============================================================
// 动画队列回调
// ============================================================

export interface AnimationQueueCallbacks {
  onAnimationStart?: (name: string) => void
  onAnimationEnd?: (name: string) => void
  onQueueEmpty?: () => void
}

/**
 * 创建动画队列管理器
 */
export function createAnimationQueue(callbacks?: AnimationQueueCallbacks) {
  const queue: AnimationQueueItem[] = []
  let isProcessing = false
  let currentAnimation = 'idle'
  let animationTimeout: ReturnType<typeof setTimeout> | null = null
  const completeCallbacks: (() => void)[] = []

  // ============================================================
  // 内部方法
  // ============================================================

  function clearTimeout_(): void {
    if (animationTimeout) {
      clearTimeout(animationTimeout)
      animationTimeout = null
    }
  }

  function notifyComplete(): void {
    const cbs = [...completeCallbacks]
    completeCallbacks.length = 0
    cbs.forEach(cb => cb())
  }

  function playInternal(name: string, duration: number, autoReset: boolean): Promise<void> {
    return new Promise(resolve => {
      clearTimeout_()
      currentAnimation = name
      callbacks?.onAnimationStart?.(name)

      if (autoReset && duration > 0) {
        animationTimeout = setTimeout(() => {
          currentAnimation = 'idle'
          callbacks?.onAnimationEnd?.(name)
          notifyComplete()
          resolve()
        }, duration)
      } else if (duration === 0) {
        resolve()
      } else {
        animationTimeout = setTimeout(() => {
          callbacks?.onAnimationEnd?.(name)
          notifyComplete()
          resolve()
        }, duration)
      }
    })
  }

  async function processQueue(): Promise<void> {
    if (isProcessing || queue.length === 0) return

    isProcessing = true

    while (queue.length > 0) {
      const item = queue.shift()!
      await playInternal(item.name, item.duration, item.autoReset)
      item.onComplete?.()
    }

    isProcessing = false
    callbacks?.onQueueEmpty?.()
  }

  // ============================================================
  // 公共 API
  // ============================================================

  return {
    /**
     * 添加动画到队列
     */
    enqueue(name: string, options: AnimationOptions = {}): void {
      const {
        duration = ANIMATION_DURATIONS[name] || 3000,
        autoReset = true,
        onComplete,
      } = options

      queue.push({ name, duration, autoReset, onComplete })

      if (!isProcessing) {
        processQueue()
      }
    },

    /**
     * 立即播放动画（清空队列）
     */
    playImmediate(name: string, options: AnimationOptions = {}): void {
      queue.length = 0
      isProcessing = false
      clearTimeout_()

      const {
        duration = ANIMATION_DURATIONS[name] || 3000,
        autoReset = true,
      } = options

      currentAnimation = name
      callbacks?.onAnimationStart?.(name)

      if (autoReset && duration > 0) {
        animationTimeout = setTimeout(() => {
          currentAnimation = 'idle'
          callbacks?.onAnimationEnd?.(name)
          notifyComplete()
        }, duration)
      }
    },

    /**
     * 等待当前动画完成
     */
    waitForCurrent(): Promise<void> {
      return new Promise(resolve => {
        if (currentAnimation === 'idle' || !animationTimeout) {
          resolve()
          return
        }
        completeCallbacks.push(resolve)
      })
    },

    /**
     * 获取当前动画名称
     */
    getCurrent(): string {
      return currentAnimation
    },

    /**
     * 获取队列长度
     */
    getQueueLength(): number {
      return queue.length
    },

    /**
     * 清空队列
     */
    clear(): void {
      queue.length = 0
      isProcessing = false
      clearTimeout_()
      currentAnimation = 'idle'
    },

    /**
     * 销毁
     */
    dispose(): void {
      queue.length = 0
      isProcessing = false
      clearTimeout_()
      completeCallbacks.length = 0
    },
  }
}

export type AnimationQueue = ReturnType<typeof createAnimationQueue>
