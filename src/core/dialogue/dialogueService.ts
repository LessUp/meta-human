import { sleep } from '../../lib/utils';
import { loggers } from '../../lib/logger';
import type { EmotionType } from '../../store/digitalHumanStore';

export interface ChatRequestPayload {
  sessionId?: string;
  userText: string;
  meta?: Record<string, unknown>;
}

export interface ChatResponsePayload {
  replyText: string;
  emotion: EmotionType;
  action: string;
}

export interface DialogueServiceResult {
  response: ChatResponsePayload;
  connectionStatus: 'connected' | 'error';
  error: string | null;
}

// 对话服务配置
export interface DialogueServiceConfig {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

// API 错误类
export class DialogueApiError extends Error {
  status: number;
  isRetryable: boolean;

  constructor(message: string, status: number, isRetryable = false) {
    super(message);
    this.name = 'DialogueApiError';
    this.status = status;
    this.isRetryable = isRetryable;
  }
}

const logger = loggers.dialogue;

const API_BASE_URL = validateApiUrl(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000');

/**
 * Validates and normalizes an API URL.
 * Throws an error if the URL is malformed.
 */
function validateApiUrl(url: string): string {
  const normalized = url.replace(/\/+$/, '');
  try {
    new URL(normalized);
    return normalized;
  } catch {
    logger.error(`Invalid API URL: ${url}`);
    // Return a safe default that will fail gracefully
    return 'http://localhost:8000';
  }
}

// Named constants for configuration
const DEFAULT_CONFIG: Required<DialogueServiceConfig> = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 15000,
};

// Named constants for timeouts and thresholds
const HEALTH_CHECK_TIMEOUT_MS = 5000;
const SESSION_DELETE_TIMEOUT_MS = 5000;

// 带超时的 fetch
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number,
  externalSignal?: AbortSignal,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // If external signal is already aborted, return early
  if (externalSignal?.aborted) {
    clearTimeout(timeoutId);
    throw new DOMException('The operation was aborted.', 'AbortError');
  }

  // Listen to external signal to abort our controller too
  let abortHandler: (() => void) | null = null;
  if (externalSignal) {
    abortHandler = () => controller.abort();
    externalSignal.addEventListener('abort', abortHandler, { once: true });
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
    // Clean up the event listener if fetch completes before external signal aborts
    if (abortHandler && externalSignal) {
      externalSignal.removeEventListener('abort', abortHandler);
    }
  }
}

// 判断错误是否可重试
function isRetryableError(status: number): boolean {
  // 5xx 服务器错误和 429 (Rate Limit) 可重试
  return status >= 500 || status === 429 || status === 408;
}

// 获取用户友好的错误消息
function getErrorMessage(status: number, defaultMessage: string): string {
  const messages: Record<number, string> = {
    400: '请求格式错误，请重试',
    401: '认证失败，请刷新页面',
    403: '访问被拒绝',
    404: '服务不可用，请稍后重试',
    408: '请求超时，请重试',
    429: '请求过于频繁，请稍后重试',
    500: '服务器内部错误，请稍后重试',
    502: '网关错误，请稍后重试',
    503: '服务暂时不可用，请稍后重试',
    504: '网关超时，请稍后重试',
  };
  return messages[status] || defaultMessage;
}

// 本地降级响应
function getFallbackResponse(userText: string): ChatResponsePayload {
  // 简单的本地响应逻辑
  const greetings = ['你好', '您好', 'hello', 'hi', '嗨'];
  const isGreeting = greetings.some((g) => userText.toLowerCase().includes(g));

  if (isGreeting) {
    return {
      replyText: '您好！很高兴见到您。由于网络问题，我目前处于离线模式，但仍然可以进行简单的交互。',
      emotion: 'happy',
      action: 'wave',
    };
  }

  return {
    replyText: '抱歉，我暂时无法连接到服务器。请检查网络连接后重试，或者稍后再来。',
    emotion: 'neutral',
    action: 'idle',
  };
}

function buildEmptyResponse(): ChatResponsePayload {
  return { replyText: '', emotion: 'neutral', action: 'idle' };
}

export { buildEmptyResponse };

// 检查服务器连接状态
export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/health`,
      { method: 'GET' },
      HEALTH_CHECK_TIMEOUT_MS,
    );
    return response.ok;
  } catch {
    return false;
  }
}

// 清理远程会话历史（best-effort，不影响前端流程）
export async function clearRemoteSession(sessionId: string): Promise<void> {
  if (!sessionId) return;
  try {
    await fetchWithTimeout(
      `${API_BASE_URL}/v1/session/${encodeURIComponent(sessionId)}`,
      { method: 'DELETE' },
      SESSION_DELETE_TIMEOUT_MS,
    );
  } catch {
    // 静默失败，不影响前端新会话的创建
  }
}

// 主发送函数 - 带重试和降级
export async function sendUserInput(
  payload: ChatRequestPayload,
  config: DialogueServiceConfig = {},
  signal?: AbortSignal,
): Promise<DialogueServiceResult> {
  const { maxRetries, retryDelay, timeout } = { ...DEFAULT_CONFIG, ...config };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (signal?.aborted) {
      return {
        response: buildEmptyResponse(),
        connectionStatus: 'error',
        error: '请求被取消',
      };
    }

    try {
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/v1/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
        timeout,
        signal,
      );

      if (!response.ok) {
        const isRetryable = isRetryableError(response.status);
        const errorMsg = getErrorMessage(response.status, `服务错误: ${response.status}`);

        if (isRetryable && attempt < maxRetries) {
          lastError = new DialogueApiError(errorMsg, response.status, true);
          await sleep(retryDelay * (attempt + 1));
          continue;
        }

        throw new DialogueApiError(errorMsg, response.status, false);
      }

      const data = await response.json();

      return {
        response: {
          replyText: data.replyText ?? '',
          emotion: data.emotion ?? 'neutral',
          action: data.action ?? 'idle',
        },
        connectionStatus: 'connected',
        error: null,
      };
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (lastError.name === 'AbortError') {
        lastError = new DialogueApiError('请求超时，请重试', 408, true);
      }

      if (lastError instanceof TypeError && lastError.message.includes('fetch')) {
        lastError = new DialogueApiError('网络连接失败，请检查网络', 0, true);
      }

      const canRetry = lastError instanceof DialogueApiError ? lastError.isRetryable : true;

      if (!canRetry || attempt >= maxRetries) {
        break;
      }

      await sleep(retryDelay * (attempt + 1));
    }
  }

  logger.error('对话服务所有重试都失败:', lastError);
  const errorMsg = lastError?.message || '对话服务不可用';

  return {
    response: getFallbackResponse(payload.userText),
    connectionStatus: 'error',
    error: errorMsg,
  };
}

// 流式对话（SSE）
export interface StreamCallbacks {
  onConnected?: () => void;
  onError?: (message: string) => void;
  onDone?: (response: ChatResponsePayload) => void;
}

export interface StreamUserInputOptions {
  signal?: AbortSignal;
}

export async function* streamUserInput(
  payload: ChatRequestPayload,
  config: DialogueServiceConfig = {},
  callbacks: StreamCallbacks = {},
  signal?: AbortSignal,
): AsyncGenerator<string, DialogueServiceResult, unknown> {
  const { timeout } = { ...DEFAULT_CONFIG, ...config };

  let finalResponse: ChatResponsePayload | null = null;
  let streamError: string | null = null;

  // Check if already aborted
  if (signal?.aborted) {
    return {
      response: buildEmptyResponse(),
      connectionStatus: 'error',
      error: '请求被取消',
    };
  }

  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/v1/chat/stream`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      timeout,
      signal,
    );

    if (!response.ok || !response.body) {
      throw new DialogueApiError(
        getErrorMessage(response.status, `流式服务错误: ${response.status}`),
        response.status,
        false,
      );
    }

    callbacks.onConnected?.();

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        // Check for abort during streaming
        if (signal?.aborted) {
          reader.cancel().catch(() => undefined);
          return {
            response: finalResponse ?? buildEmptyResponse(),
            connectionStatus: 'error',
            error: '请求被取消',
          };
        }

        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          try {
            const event = JSON.parse(raw);
            if (event.type === 'token' && event.content) {
              yield event.content;
            } else if (event.type === 'error') {
              streamError = event.message || '流式响应错误';
            } else if (event.type === 'done') {
              finalResponse = {
                replyText: event.replyText ?? '',
                emotion: event.emotion ?? 'neutral',
                action: event.action ?? 'idle',
              };
              callbacks.onDone?.(finalResponse);
            }
          } catch {
            logger.warn('SSE 事件解析失败:', raw);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    if (streamError) {
      callbacks.onError?.(streamError);
    }
  } catch (error) {
    // Check if aborted
    if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
      return {
        response: finalResponse ?? buildEmptyResponse(),
        connectionStatus: 'error',
        error: '请求被取消',
      };
    }

    logger.warn('流式请求失败，降级到普通请求:', error);
    const fallback = await sendUserInput(payload, config, signal);
    if (fallback.response.replyText) {
      yield fallback.response.replyText;
    }
    // Mark as error since stream failed, even if fallback succeeded
    return {
      ...fallback,
      connectionStatus: fallback.connectionStatus === 'error' ? 'error' : 'connected',
    };
  }

  if (!finalResponse) {
    finalResponse = { replyText: '', emotion: 'neutral', action: 'idle' };
  }

  return {
    response: finalResponse,
    connectionStatus: streamError ? 'error' : 'connected',
    error: streamError,
  };
}
