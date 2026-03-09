/**
 * 对话 API 服务（重构版）
 *
 * 从原 dialogueService.ts 重构，去除对 Zustand store 的直接依赖。
 * 使用 StoreBridge + EventBus + 通用重试工具。
 */

import type {
  ChatRequestPayload,
  ChatResponsePayload,
  DialogueServiceConfig,
  StoreBridge,
} from '../types'
import { coreEvents } from '../events'
import { fetchWithTimeout, isRetryableStatus, delay } from '../utils/retry'
import { getFallbackResponse, getHttpErrorMessage } from './fallback'

// ============================================================
// API 错误类
// ============================================================

export class DialogueApiError extends Error {
  status: number
  isRetryable: boolean

  constructor(message: string, status: number, isRetryable = false) {
    super(message)
    this.name = 'DialogueApiError'
    this.status = status
    this.isRetryable = isRetryable
  }
}

// ============================================================
// 默认配置
// ============================================================

const DEFAULT_CONFIG: Required<DialogueServiceConfig> = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 15000,
  maxHistoryLength: 50,
}

// ============================================================
// 对话服务配置
// ============================================================

export interface DialogueServiceOptions {
  store: StoreBridge
  baseUrl?: string
  config?: Partial<DialogueServiceConfig>
}

/**
 * 创建对话服务（工厂函数模式）
 */
export function createDialogueService(options: DialogueServiceOptions) {
  const { store } = options
  const baseUrl = options.baseUrl ?? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000')
  const config = { ...DEFAULT_CONFIG, ...options.config }

  // 会话历史存储
  const sessionHistories = new Map<string, ChatRequestPayload[]>()

  // ============================================================
  // 内部工具方法
  // ============================================================

  function validateResponse(data: unknown): ChatResponsePayload {
    if (!data || typeof data !== 'object') {
      return { replyText: '', emotion: 'neutral', action: 'idle' }
    }

    const obj = data as Record<string, unknown>

    const validEmotions = ['neutral', 'happy', 'surprised', 'sad', 'angry']
    const emotion =
      typeof obj.emotion === 'string' && validEmotions.includes(obj.emotion)
        ? obj.emotion
        : 'neutral'

    const validActions = ['idle', 'wave', 'greet', 'nod', 'shakeHead', 'dance', 'think', 'speak']
    const action =
      typeof obj.action === 'string' && validActions.includes(obj.action) ? obj.action : 'idle'

    return {
      replyText: typeof obj.replyText === 'string' ? obj.replyText : '',
      emotion,
      action,
    }
  }

  function addToSessionHistory(
    sessionId: string,
    payload: ChatRequestPayload,
    maxLength: number,
  ): void {
    const history = sessionHistories.get(sessionId) || []
    history.push(payload)

    while (history.length > maxLength) {
      history.shift()
    }

    sessionHistories.set(sessionId, history)
  }

  // ============================================================
  // 公共 API
  // ============================================================

  return {
    /**
     * 检查服务器健康状态
     */
    async checkHealth(): Promise<{
      healthy: boolean
      latency: number
      services: Record<string, string>
    }> {
      const startTime = performance.now()
      try {
        const response = await fetchWithTimeout(`${baseUrl}/health`, { method: 'GET' }, 5000)
        const latency = performance.now() - startTime

        if (response.ok) {
          const data = await response.json().catch(() => ({}))
          return {
            healthy: true,
            latency,
            services: data.services || { api: 'ok' },
          }
        }

        return {
          healthy: false,
          latency,
          services: { api: `error: ${response.status}` },
        }
      } catch {
        return {
          healthy: false,
          latency: performance.now() - startTime,
          services: { api: 'unreachable' },
        }
      }
    },

    /**
     * 清除会话
     */
    clearSession(sessionId: string): void {
      sessionHistories.delete(sessionId)
    },

    /**
     * 获取会话历史
     */
    getSessionHistory(sessionId: string): ChatRequestPayload[] {
      return sessionHistories.get(sessionId) || []
    },

    /**
     * 发送用户输入（带重试和降级）
     */
    async sendUserInput(
      payload: ChatRequestPayload,
      configOverride?: Partial<DialogueServiceConfig>,
    ): Promise<ChatResponsePayload> {
      const mergedConfig = { ...config, ...configOverride }
      const { maxRetries, retryDelay, timeout, maxHistoryLength } = mergedConfig

      let lastError: Error | null = null

      // 添加到会话历史
      if (payload.sessionId) {
        addToSessionHistory(payload.sessionId, payload, maxHistoryLength)
      }

      coreEvents.emit('dialogue:request:start', {
        userText: payload.userText,
        sessionId: payload.sessionId,
      })

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          // 更新连接状态
          if (attempt > 0) {
            store.setConnectionStatus('connecting')
            store.setConnectionDetails({ reconnectAttempts: attempt })
          }

          const response = await fetchWithTimeout(
            `${baseUrl}/v1/chat`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            },
            timeout,
          )

          if (!response.ok) {
            const isRetryable = isRetryableStatus(response.status)
            const errorMsg = getHttpErrorMessage(response.status, `服务错误: ${response.status}`)

            if (isRetryable && attempt < maxRetries) {
              lastError = new DialogueApiError(errorMsg, response.status, true)
              const backoffDelay = retryDelay * Math.pow(2, attempt)
              await delay(backoffDelay)
              continue
            }

            throw new DialogueApiError(errorMsg, response.status, false)
          }

          const data = await response.json()
          const validatedResponse = validateResponse(data)

          // 成功 - 更新连接状态
          store.setConnectionStatus('connected')
          store.setConnectionDetails({
            lastConnectedAt: Date.now(),
            reconnectAttempts: 0,
          })
          store.clearError()

          coreEvents.emit('dialogue:request:end', { response: validatedResponse })

          return validatedResponse
        } catch (error: unknown) {
          const err = error as Error & { name?: string }
          lastError = err

          if (err.name === 'AbortError') {
            lastError = new DialogueApiError('请求超时，请重试', 408, true)
          }

          if (err instanceof TypeError && err.message.includes('fetch')) {
            lastError = new DialogueApiError('网络连接失败，请检查网络', 0, true)
          }

          if (attempt < maxRetries) {
            const isRetryable = err instanceof DialogueApiError ? err.isRetryable : true
            if (isRetryable) {
              const backoffDelay = retryDelay * Math.pow(2, attempt)
              await delay(backoffDelay)
              continue
            }
          }
        }
      }

      // 所有重试都失败了，返回降级响应
      console.error('对话服务所有重试都失败:', lastError)
      store.setConnectionStatus('error')
      store.setConnectionDetails({ lastErrorAt: Date.now() })
      store.addError(lastError?.message || '对话服务不可用')

      const fallback = getFallbackResponse(payload.userText)
      coreEvents.emit('dialogue:fallback', { userText: payload.userText, response: fallback })

      return fallback
    },

    /**
     * 流式对话（预留接口）
     */
    async *streamUserInput(
      payload: ChatRequestPayload,
    ): AsyncGenerator<string, ChatResponsePayload, unknown> {
      const response = await this.sendUserInput(payload)
      yield response.replyText
      return response
    },

    /**
     * 销毁服务
     */
    dispose(): void {
      sessionHistories.clear()
    },
  }
}

export type DialogueService = ReturnType<typeof createDialogueService>
