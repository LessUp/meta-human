import { sleep } from '../../lib/utils';
import { loggers } from '../../lib/logger';
import type { EmotionType } from '../../store/digitalHumanStore';
import { useSystemStore } from '../../store/systemStore';
import { parseApiEndpoints } from './endpointDiscovery';
import { DialogueEndpointRouter } from './dialogueEndpointRouter';
import {
  DialogueApiError,
  fetchWithTimeout,
  normalizeDialogueError,
  sendDialogueHttpRequest,
  sendDialogueStreamRequest,
  type DialogueHttpRequestPayload,
  type DialogueHttpResponsePayload,
} from './dialogueHttpClient';
import { normalizeDialogueRequestPayload } from './dialoguePayload';

export type ChatRequestPayload = DialogueHttpRequestPayload;

export type ChatResponsePayload = DialogueHttpResponsePayload;

export interface DialogueServiceResult {
  response: ChatResponsePayload;
  connectionStatus: 'connected' | 'error';
  error: string | null;
}

export interface DialogueServiceConfig {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  endpoint?: string;
}

const logger = loggers.dialogue;

function validateApiUrl(url: string): string {
  const normalized = url.replace(/\/+$/, '');
  try {
    new URL(normalized);
    return normalized;
  } catch {
    logger.error(`Invalid API URL: ${url}`);
    return 'http://localhost:8000';
  }
}

const API_BASE_URLS = parseApiEndpoints(
  validateApiUrl(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'),
  import.meta.env.VITE_API_BASE_URL_FALLBACKS || '',
);
let endpointRouter = new DialogueEndpointRouter(API_BASE_URLS);

const DEFAULT_CONFIG: Required<Omit<DialogueServiceConfig, 'endpoint'>> = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 15000,
};

const HEALTH_CHECK_TIMEOUT_MS = 5000;
const SESSION_DELETE_TIMEOUT_MS = 5000;

function recordRoutingState(activeEndpoint: string, didFailover = false): void {
  useSystemStore.getState().recordEndpointRouting({
    activeEndpoint,
    didFailover,
  });
}

function reportEndpointSuccess(endpoint: string): void {
  const routing = endpointRouter.reportSuccess(endpoint);
  recordRoutingState(routing.activeEndpoint, routing.didFailover);
}

function reportEndpointFailure(endpoint: string): void {
  const routing = endpointRouter.reportFailure(endpoint);
  if (routing.didFailover) {
    recordRoutingState(routing.activeEndpoint, true);
  }
}

function getEndpointCandidates(preferredEndpoint?: string): string[] {
  return endpointRouter.getCandidateEndpoints(preferredEndpoint);
}

function getActiveEndpoint(): string {
  return endpointRouter.selectPrimaryEndpoint();
}

function isRetryableDialogueError(error: Error): boolean {
  if (error instanceof DialogueApiError) {
    return error.isRetryable;
  }

  return true;
}

function getFallbackResponse(userText: string): ChatResponsePayload {
  const greetings = ['你好', '您好', 'hello', 'hi', '嗨'];
  const isGreeting = greetings.some((greeting) => userText.toLowerCase().includes(greeting));

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

function toChatResponsePayload(response: DialogueHttpResponsePayload): ChatResponsePayload {
  return {
    replyText: response.replyText,
    emotion: response.emotion as EmotionType,
    action: response.action,
  };
}

function buildFallbackResult(
  payload: ChatRequestPayload,
  error: Error | null,
): DialogueServiceResult {
  return {
    response: getFallbackResponse(payload.userText),
    connectionStatus: 'error',
    error: error?.message || '对话服务不可用',
  };
}

function maybeNormalizeError(error: unknown): Error {
  return normalizeDialogueError(error);
}

function shouldAbort(error: unknown, signal?: AbortSignal): boolean {
  return (
    signal?.aborted === true ||
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof Error &&
      error.message === '请求被取消' &&
      error instanceof DialogueApiError &&
      error.status === 408)
  );
}

function buildEmptyResponse(): ChatResponsePayload {
  return { replyText: '', emotion: 'neutral', action: 'idle' };
}

export { buildEmptyResponse, DialogueApiError };

export function resetDialogueServiceRoutingForTests(): void {
  endpointRouter = new DialogueEndpointRouter(API_BASE_URLS);
  endpointRouter.resetActiveEndpoint(API_BASE_URLS[0]);
}

/**
 * 运行时切换对话服务端点（优先于 env 配置）。
 * 由 UI 配置面板调用，持久化由 systemStore 负责。
 */
export function applyRuntimeApiEndpoints(baseUrl: string, fallbacks: string = ''): void {
  const urls = parseApiEndpoints(baseUrl, fallbacks);
  if (urls.length > 0) {
    endpointRouter = new DialogueEndpointRouter(urls);
  }
}

/**
 * 清除运行时端点配置，回退到 env 配置。
 */
export function resetRuntimeApiEndpoints(): void {
  endpointRouter = new DialogueEndpointRouter(API_BASE_URLS);
}

export async function checkServerHealth(): Promise<boolean> {
  const candidates = getEndpointCandidates();

  for (const endpoint of candidates) {
    try {
      const response = await fetchWithTimeout(
        `${endpoint}/health`,
        { method: 'GET' },
        HEALTH_CHECK_TIMEOUT_MS,
      );
      if (response.ok) {
        reportEndpointSuccess(endpoint);
        return true;
      }
      reportEndpointFailure(endpoint);
    } catch {
      reportEndpointFailure(endpoint);
    }
  }

  return false;
}

export async function clearRemoteSession(sessionId: string): Promise<void> {
  if (!sessionId) return;

  try {
    await fetchWithTimeout(
      `${getActiveEndpoint()}/v1/session/${encodeURIComponent(sessionId)}`,
      { method: 'DELETE' },
      SESSION_DELETE_TIMEOUT_MS,
    );
  } catch {
    // Best-effort cleanup.
  }
}

export async function sendUserInput(
  payload: ChatRequestPayload,
  config: DialogueServiceConfig = {},
  signal?: AbortSignal,
): Promise<DialogueServiceResult> {
  const normalizedPayload = normalizeDialogueRequestPayload(payload);
  const { maxRetries, retryDelay, timeout, endpoint } = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error | null = null;

  attemptLoop: for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (signal?.aborted) {
      return {
        response: buildEmptyResponse(),
        connectionStatus: 'error',
        error: '请求被取消',
      };
    }

    const candidateEndpoints = getEndpointCandidates(endpoint);

    for (let candidateIndex = 0; candidateIndex < candidateEndpoints.length; candidateIndex++) {
      const candidateEndpoint = candidateEndpoints[candidateIndex];

      try {
        const response = await sendDialogueHttpRequest(normalizedPayload, {
          endpoint: candidateEndpoint,
          timeout,
          signal,
        });
        reportEndpointSuccess(candidateEndpoint);

        return {
          response: toChatResponsePayload(response),
          connectionStatus: 'connected',
          error: null,
        };
      } catch (error: unknown) {
        lastError = maybeNormalizeError(error);

        if (signal?.aborted || shouldAbort(lastError, signal)) {
          return {
            response: buildEmptyResponse(),
            connectionStatus: 'error',
            error: '请求被取消',
          };
        }

        const retryable = isRetryableDialogueError(lastError);
        if (retryable) {
          reportEndpointFailure(candidateEndpoint);
        }

        if (retryable && candidateIndex < candidateEndpoints.length - 1) {
          continue;
        }

        if (!retryable || attempt >= maxRetries) {
          break attemptLoop;
        }

        await sleep(retryDelay * (attempt + 1));
        continue attemptLoop;
      }
    }
  }

  logger.error('对话服务所有重试都失败:', lastError);
  return buildFallbackResult(normalizedPayload, lastError);
}

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
  const normalizedPayload = normalizeDialogueRequestPayload(payload);
  const { timeout, maxRetries, retryDelay, endpoint } = { ...DEFAULT_CONFIG, ...config };

  let finalResponse: ChatResponsePayload | null = null;
  let streamError: string | null = null;
  let lastError: Error | null = null;

  if (signal?.aborted) {
    return {
      response: buildEmptyResponse(),
      connectionStatus: 'error',
      error: '请求被取消',
    };
  }

  attemptLoop: for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const candidateEndpoints = getEndpointCandidates(endpoint);

    for (let candidateIndex = 0; candidateIndex < candidateEndpoints.length; candidateIndex++) {
      const candidateEndpoint = candidateEndpoints[candidateIndex];

      try {
        const response = await sendDialogueStreamRequest(normalizedPayload, {
          endpoint: candidateEndpoint,
          timeout,
          signal,
        });

        reportEndpointSuccess(candidateEndpoint);
        callbacks.onConnected?.();

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
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

        if (!finalResponse) {
          finalResponse = { replyText: '', emotion: 'neutral', action: 'idle' };
        }

        return {
          response: finalResponse,
          connectionStatus: streamError ? 'error' : 'connected',
          error: streamError,
        };
      } catch (error: unknown) {
        if (signal?.aborted || shouldAbort(error, signal)) {
          return {
            response: finalResponse ?? buildEmptyResponse(),
            connectionStatus: 'error',
            error: '请求被取消',
          };
        }

        lastError = maybeNormalizeError(error);
        const retryable = isRetryableDialogueError(lastError);
        if (retryable) {
          reportEndpointFailure(candidateEndpoint);
        }

        if (retryable && candidateIndex < candidateEndpoints.length - 1) {
          continue;
        }

        if (!retryable || attempt >= maxRetries) {
          break attemptLoop;
        }

        await sleep(retryDelay * (attempt + 1));
        continue attemptLoop;
      }
    }
  }

  logger.warn('流式请求失败，降级到普通请求:', lastError);
  const fallback = await sendUserInput(normalizedPayload, { ...config, endpoint }, signal);
  if (fallback.response.replyText) {
    yield fallback.response.replyText;
  }

  return {
    ...fallback,
    connectionStatus: fallback.connectionStatus === 'error' ? 'error' : 'connected',
  };
}
