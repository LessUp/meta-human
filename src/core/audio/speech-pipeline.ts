/**
 * 语音管线
 *
 * 参考 airi 项目的 speech-pipeline.ts，提供基于意图（Intent）的语音管理。
 * 支持优先级调度、中断控制和队列管理。
 */

import type { SpeechIntentOptions, SpeechIntentHandle, StoreBridge, PriorityLevel } from '../types'
import { coreEvents } from '../events'
import { createPriorityResolver, type PriorityResolver } from '../utils/priority'
import { createId } from '../utils/id'
import type { TTSService } from './tts-service'

// ============================================================
// 意图状态
// ============================================================

interface IntentState {
  intentId: string
  priority: number
  ownerId?: string
  behavior: 'queue' | 'interrupt' | 'replace'
  createdAt: number
  controller: AbortController
  textChunks: string[]
  canceled: boolean
}

// ============================================================
// 语音管线配置
// ============================================================

export interface SpeechPipelineOptions {
  tts: TTSService
  store: StoreBridge
  priority?: PriorityResolver
}

/**
 * 创建语音管线（参考 airi createSpeechPipeline）
 */
export function createSpeechPipeline(options: SpeechPipelineOptions) {
  const { tts, store } = options
  const priorityResolver = options.priority ?? createPriorityResolver()

  const intents = new Map<string, IntentState>()
  const pending: IntentState[] = []
  let activeIntent: IntentState | null = null

  // ============================================================
  // 内部调度
  // ============================================================

  function enqueueIntent(intent: IntentState): void {
    pending.push(intent)
  }

  function pickNextIntent(): IntentState | null {
    if (pending.length === 0) return null
    pending.sort((a, b) => (b.priority - a.priority) || (a.createdAt - b.createdAt))
    return pending.shift() ?? null
  }

  async function runIntent(intent: IntentState): Promise<void> {
    activeIntent = intent

    try {
      for (const text of intent.textChunks) {
        if (intent.canceled || intent.controller.signal.aborted) break
        if (!text.trim()) continue

        try {
          await tts.speak(text)
        } catch (err) {
          if (intent.controller.signal.aborted) break
          console.warn('语音管线 TTS 失败:', err)
        }
      }
    } catch (err) {
      console.warn('语音管线意图执行失败:', err)
    } finally {
      intents.delete(intent.intentId)
      activeIntent = null

      const next = pickNextIntent()
      if (next) {
        void runIntent(next)
      }
    }
  }

  function cancelIntent(intentId: string, reason?: string): void {
    const intent = intents.get(intentId)
    if (!intent) return
    intent.canceled = true
    intent.controller.abort(reason ?? 'canceled')

    if (activeIntent?.intentId === intentId) {
      tts.clearQueue()
      return
    }

    const index = pending.findIndex(item => item.intentId === intentId)
    if (index >= 0) pending.splice(index, 1)
  }

  // ============================================================
  // 公共 API
  // ============================================================

  return {
    /**
     * 打开一个新的语音意图
     *
     * 返回意图句柄，可通过 write/end/cancel 控制。
     */
    openIntent(intentOptions?: SpeechIntentOptions): SpeechIntentHandle {
      const intentId = intentOptions?.intentId ?? createId('intent')
      const priority = priorityResolver.resolve(intentOptions?.priority)
      const behavior = intentOptions?.behavior ?? 'queue'
      const ownerId = intentOptions?.ownerId

      const controller = new AbortController()
      const textChunks: string[] = []

      const intent: IntentState = {
        intentId,
        priority,
        ownerId,
        behavior,
        createdAt: Date.now(),
        controller,
        textChunks,
        canceled: false,
      }

      intents.set(intentId, intent)

      const handle: SpeechIntentHandle = {
        intentId,
        priority,
        ownerId,
        write(text: string) {
          if (intent.canceled) return
          textChunks.push(text)
        },
        end() {
          // 意图结束，开始执行
          if (!activeIntent) {
            void runIntent(intent)
            return
          }

          if (behavior === 'replace') {
            cancelIntent(activeIntent.intentId, 'replace')
            void runIntent(intent)
            return
          }

          if (behavior === 'interrupt' && intent.priority >= activeIntent.priority) {
            cancelIntent(activeIntent.intentId, 'interrupt')
            void runIntent(intent)
            return
          }

          enqueueIntent(intent)
        },
        cancel(reason?: string) {
          cancelIntent(intentId, reason)
        },
      }

      return handle
    },

    /**
     * 取消指定意图
     */
    cancelIntent,

    /**
     * 中断当前活跃意图
     */
    interrupt(reason: string): void {
      if (activeIntent) {
        cancelIntent(activeIntent.intentId, reason)
      }
      coreEvents.emit('audio:speech:interrupt', { reason })
    },

    /**
     * 停止所有意图
     */
    stopAll(reason: string): void {
      for (const intent of intents.values()) {
        intent.canceled = true
        intent.controller.abort(reason)
      }
      pending.length = 0
      intents.clear()
      activeIntent = null
      tts.stop()
    },

    /**
     * 简便方法：直接朗读文本
     */
    speak(text: string, priority?: PriorityLevel): void {
      const handle = this.openIntent({ priority, behavior: 'queue' })
      handle.write(text)
      handle.end()
    },

    /**
     * 获取活跃意图 ID
     */
    getActiveIntentId(): string | null {
      return activeIntent?.intentId ?? null
    },

    /**
     * 获取等待队列长度
     */
    getPendingCount(): number {
      return pending.length
    },

    /**
     * 销毁管线
     */
    dispose(): void {
      this.stopAll('disposed')
    },
  }
}

export type SpeechPipeline = ReturnType<typeof createSpeechPipeline>
