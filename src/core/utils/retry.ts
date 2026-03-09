/**
 * 重试工具
 *
 * 提供通用的重试逻辑，支持指数退避、超时控制和 AbortController。
 */

/** 重试配置 */
export interface RetryConfig {
  maxRetries: number
  retryDelay: number
  backoffMultiplier?: number
  timeout?: number
  signal?: AbortSignal
}

/** 重试状态 */
export interface RetryState {
  attempt: number
  lastError: Error | null
  nextRetryTime: number
}

/**
 * 延迟函数
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 计算指数退避延迟
 */
export function getBackoffDelay(
  attempt: number,
  baseDelay: number,
  multiplier: number = 2,
): number {
  return baseDelay * Math.pow(multiplier, attempt)
}

/**
 * 带超时的 fetch
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number,
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * 判断 HTTP 错误是否可重试
 */
export function isRetryableStatus(status: number): boolean {
  return status >= 500 || status === 429 || status === 408
}

/**
 * 带重试的异步操作执行器
 *
 * @param fn - 要执行的异步操作
 * @param config - 重试配置
 * @param onRetry - 重试回调（可选）
 */
export async function withRetry<T>(
  fn: (attempt: number, signal?: AbortSignal) => Promise<T>,
  config: RetryConfig,
  onRetry?: (state: RetryState) => void,
): Promise<T> {
  const { maxRetries, retryDelay, backoffMultiplier = 2, signal } = config
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // 检查是否已被取消
    if (signal?.aborted) {
      throw new Error('操作已被取消')
    }

    try {
      return await fn(attempt, signal)
    } catch (error) {
      lastError = error as Error

      if (attempt < maxRetries) {
        const backoff = getBackoffDelay(attempt, retryDelay, backoffMultiplier)
        const state: RetryState = {
          attempt,
          lastError,
          nextRetryTime: Date.now() + backoff,
        }
        onRetry?.(state)
        await delay(backoff)
      }
    }
  }

  throw lastError ?? new Error('所有重试均失败')
}
