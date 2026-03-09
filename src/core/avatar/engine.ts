/**
 * 数字人行为引擎（重构版）
 *
 * 从原 DigitalHumanEngine.ts 重构，采用工厂函数模式。
 * 通过 StoreBridge 解耦状态管理，通过 EventBus 通信，
 * 使用独立的 AnimationQueue 和 Presets 模块。
 */

import type {
  EmotionType,
  ExpressionType,
  BehaviorType,
  AnimationOptions,
  StoreBridge,
} from '../types'
import { coreEvents } from '../events'
import { createAnimationQueue, type AnimationQueue } from './animation-queue'
import {
  EMOTION_TO_EXPRESSION,
  ANIMATION_TO_BEHAVIOR,
  VALID_EXPRESSIONS,
  VALID_EMOTIONS,
  VALID_BEHAVIORS,
  PRESET_ACTIONS,
} from './presets'

// ============================================================
// 引擎配置
// ============================================================

export interface EngineOptions {
  store: StoreBridge
}

/**
 * 创建数字人行为引擎
 */
export function createDigitalHumanEngine(options: EngineOptions) {
  const { store } = options

  // 创建动画队列，绑定 store 回调
  const animationQueue: AnimationQueue = createAnimationQueue({
    onAnimationStart(name) {
      store.setAnimation(name)
      store.setPlaying(true)

      // 自动设置对应的行为状态
      const behavior = ANIMATION_TO_BEHAVIOR[name]
      if (behavior) {
        store.setBehavior(behavior)
      }

      coreEvents.emit('avatar:animation:start', {
        name,
        duration: 0, // 由队列内部管理
      })
    },
    onAnimationEnd(name) {
      store.setAnimation('idle')
      store.setBehavior('idle')
      coreEvents.emit('avatar:animation:end', { name })
    },
    onQueueEmpty() {
      // 队列清空时确保状态回到 idle
    },
  })

  // ============================================================
  // 验证工具
  // ============================================================

  function isValidExpression(expression: string): expression is ExpressionType {
    return VALID_EXPRESSIONS.includes(expression as ExpressionType)
  }

  function isValidEmotion(emotion: string): emotion is EmotionType {
    return VALID_EMOTIONS.includes(emotion as EmotionType)
  }

  function isValidBehavior(behavior: string): behavior is BehaviorType {
    return VALID_BEHAVIORS.includes(behavior as BehaviorType)
  }

  // ============================================================
  // 公共 API
  // ============================================================

  return {
    // 暴露动画队列以供外部访问
    animationQueue,

    /**
     * 播放
     */
    play(): void {
      store.play()
    },

    /**
     * 暂停
     */
    pause(): void {
      store.pause()
    },

    /**
     * 重置
     */
    reset(): void {
      store.reset()
      animationQueue.clear()
    },

    /**
     * 获取动画队列长度
     */
    getQueueLength(): number {
      return animationQueue.getQueueLength()
    },

    /**
     * 清空动画队列
     */
    clearAnimationQueue(): void {
      animationQueue.clear()
    },

    /**
     * 添加动画到队列
     */
    queueAnimation(name: string, options: AnimationOptions = {}): void {
      animationQueue.enqueue(name, options)
    },

    /**
     * 等待当前动画完成
     */
    waitForCurrentAnimation(): Promise<void> {
      return animationQueue.waitForCurrent()
    },

    /**
     * 播放动画（立即执行，清空队列）
     */
    playAnimation(name: string, autoReset: boolean = true): void {
      animationQueue.playImmediate(name, { autoReset })

      // 同步设置 store 状态
      store.setAnimation(name)
      store.setPlaying(true)

      const behavior = ANIMATION_TO_BEHAVIOR[name]
      if (behavior) {
        store.setBehavior(behavior)
      }

      coreEvents.emit('avatar:animation:start', { name, duration: 0 })
    },

    /**
     * 设置表情（带验证）
     */
    setExpression(expression: string): boolean {
      if (isValidExpression(expression)) {
        const prev = store.getExpression()
        store.setExpression(expression)
        if (prev !== expression) {
          coreEvents.emit('avatar:expression:change', { from: prev, to: expression })
        }
        return true
      } else {
        console.warn(`无效的表情类型: ${expression}, 使用默认 neutral`)
        store.setExpression('neutral')
        return false
      }
    },

    /**
     * 设置表情强度
     */
    setExpressionIntensity(intensity: number): void {
      store.setExpressionIntensity(intensity)
    },

    /**
     * 设置情感（带验证和自动表情映射）
     */
    setEmotion(emotion: string): boolean {
      if (isValidEmotion(emotion)) {
        const prev = store.getEmotion()
        store.setEmotion(emotion)

        // 自动设置对应的表情
        const mappedExpression = EMOTION_TO_EXPRESSION[emotion]
        if (mappedExpression) {
          store.setExpression(mappedExpression)
        }

        if (prev !== emotion) {
          coreEvents.emit('avatar:emotion:change', { from: prev, to: emotion })
        }
        return true
      } else {
        console.warn(`无效的情感类型: ${emotion}, 使用默认 neutral`)
        store.setEmotion('neutral')
        store.setExpression('neutral')
        return false
      }
    },

    /**
     * 设置行为（带验证）
     */
    setBehavior(behavior: string, _params?: unknown): boolean {
      if (isValidBehavior(behavior)) {
        const prev = store.getBehavior()
        store.setBehavior(behavior)
        if (prev !== behavior) {
          coreEvents.emit('avatar:behavior:change', { from: prev, to: behavior })
        }
        return true
      } else {
        console.warn(`无效的行为类型: ${behavior}, 使用默认 idle`)
        store.setBehavior('idle')
        return false
      }
    },

    /**
     * 执行预设组合动作
     *
     * 通过预设注册表自动设置情感、表情和播放动画。
     * 新增预设只需在 presets.ts 的 PRESET_ACTIONS 中添加配置。
     */
    performPreset(presetName: string): boolean {
      const preset = PRESET_ACTIONS[presetName]
      if (!preset) {
        console.warn(`未知的预设动作: ${presetName}`)
        return false
      }

      this.setEmotion(preset.emotion)
      if (preset.expression) {
        this.setExpression(preset.expression)
      }
      this.playAnimation(preset.animation, preset.autoReset ?? true)
      return true
    },

    // ============================================================
    // 兼容旧 API 的组合动作方法
    // ============================================================

    performGreeting(): void {
      this.performPreset('greeting')
    },

    performThinking(): void {
      this.performPreset('thinking')
    },

    performListening(): void {
      this.performPreset('listening')
    },

    performBow(): void {
      this.performPreset('bow')
    },

    performClap(): void {
      this.performPreset('clap')
    },

    performThumbsUp(): void {
      this.performPreset('thumbsUp')
    },

    performCheer(): void {
      this.performPreset('cheer')
    },

    performShrug(): void {
      this.performPreset('shrug')
    },

    performSleep(): void {
      this.performPreset('sleep')
    },

    /**
     * 销毁引擎
     */
    dispose(): void {
      animationQueue.dispose()
    },
  }
}

export type DigitalHumanEngine = ReturnType<typeof createDigitalHumanEngine>
