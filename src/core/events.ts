/**
 * MetaHuman Core - 类型安全事件总线
 *
 * 参考 airi 项目的 eventa 模式，提供模块间松耦合通信。
 * 所有核心模块通过事件总线交互，而非直接调用。
 */

import type {
  EmotionType,
  ExpressionType,
  BehaviorType,
  ChatResponsePayload,
  UserEmotion,
  UserMotion,
  PerformanceMetrics,
} from './types'

// ============================================================
// 事件类型定义
// ============================================================

/** 所有事件的类型映射 */
export interface CoreEventMap {
  // 音频事件
  'audio:tts:start': { text: string }
  'audio:tts:end': { text: string }
  'audio:tts:error': { error: string }
  'audio:asr:start': void
  'audio:asr:result': { text: string; isFinal: boolean }
  'audio:asr:end': void
  'audio:asr:error': { error: string }
  'audio:asr:timeout': void
  'audio:speech:interrupt': { reason: string }

  // 动画事件
  'avatar:animation:start': { name: string; duration: number }
  'avatar:animation:end': { name: string }
  'avatar:animation:queue': { name: string; duration: number }
  'avatar:emotion:change': { from: EmotionType; to: EmotionType }
  'avatar:expression:change': { from: ExpressionType; to: ExpressionType }
  'avatar:behavior:change': { from: BehaviorType; to: BehaviorType }

  // 对话事件
  'dialogue:request:start': { userText: string; sessionId?: string }
  'dialogue:request:end': { response: ChatResponsePayload }
  'dialogue:request:error': { error: string; userText: string }
  'dialogue:fallback': { userText: string; response: ChatResponsePayload }

  // 视觉事件
  'vision:emotion:detected': { emotion: UserEmotion }
  'vision:motion:detected': { motion: UserMotion }
  'vision:status:change': { status: string }
  'vision:error': { error: string }

  // 性能事件
  'performance:fps:update': { fps: number }
  'performance:fps:warning': { fps: number; threshold: number }
  'performance:visibility:hidden': void
  'performance:visibility:visible': void
  'performance:metrics:update': PerformanceMetrics

  // 系统事件
  'system:init': void
  'system:dispose': void
  'system:error': { module: string; error: string }
}

// ============================================================
// 事件监听器类型
// ============================================================

type EventPayload<K extends keyof CoreEventMap> = CoreEventMap[K]
type EventListener<K extends keyof CoreEventMap> =
  CoreEventMap[K] extends void ? () => void : (payload: CoreEventMap[K]) => void

// ============================================================
// 事件总线实现
// ============================================================

class EventBus {
  private listeners = new Map<string, Set<Function>>()
  private onceListeners = new Map<string, Set<Function>>()

  /**
   * 监听事件
   * @returns 取消监听的函数
   */
  on<K extends keyof CoreEventMap>(event: K, listener: EventListener<K>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(listener)

    // 返回取消订阅函数
    return () => {
      this.listeners.get(event)?.delete(listener)
    }
  }

  /**
   * 监听事件（仅触发一次）
   */
  once<K extends keyof CoreEventMap>(event: K, listener: EventListener<K>): () => void {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set())
    }
    this.onceListeners.get(event)!.add(listener)

    return () => {
      this.onceListeners.get(event)?.delete(listener)
    }
  }

  /**
   * 触发事件
   */
  emit<K extends keyof CoreEventMap>(
    event: K,
    ...args: CoreEventMap[K] extends void ? [] : [CoreEventMap[K]]
  ): void {
    const payload = args[0]

    // 触发常规监听器
    const listeners = this.listeners.get(event)
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(payload)
        } catch (err) {
          console.error(`[EventBus] 事件 "${event}" 的监听器执行出错:`, err)
        }
      }
    }

    // 触发一次性监听器
    const onceListeners = this.onceListeners.get(event)
    if (onceListeners) {
      for (const listener of onceListeners) {
        try {
          listener(payload)
        } catch (err) {
          console.error(`[EventBus] 事件 "${event}" 的一次性监听器执行出错:`, err)
        }
      }
      this.onceListeners.delete(event)
    }
  }

  /**
   * 移除指定事件的所有监听器
   */
  off<K extends keyof CoreEventMap>(event: K): void {
    this.listeners.delete(event)
    this.onceListeners.delete(event)
  }

  /**
   * 移除所有事件的所有监听器
   */
  clear(): void {
    this.listeners.clear()
    this.onceListeners.clear()
  }

  /**
   * 获取指定事件的监听器数量
   */
  listenerCount<K extends keyof CoreEventMap>(event: K): number {
    return (this.listeners.get(event)?.size ?? 0) + (this.onceListeners.get(event)?.size ?? 0)
  }
}

// ============================================================
// 全局事件总线实例
// ============================================================

export const coreEvents = new EventBus()

export type { EventBus, EventListener, EventPayload }
