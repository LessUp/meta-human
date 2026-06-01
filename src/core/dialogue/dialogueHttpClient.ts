import type { EmotionType } from '../../store/digitalHumanStore';
import type { DialogueMessage } from './dialoguePayload';

export interface DialogueHttpRequestPayload {
  sessionId?: string;
  userText: string;
  meta?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  context?: Record<string, unknown>;
  messages?: DialogueMessage[];
}

export interface DialogueHttpResponsePayload {
  replyText: string;
  emotion: EmotionType;
  action: string;
}

export interface DialogueHttpRequestOptions {
  endpoint: string;
  timeout: number;
  signal?: AbortSignal;
}

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

export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number,
  externalSignal?: AbortSignal,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  if (externalSignal?.aborted) {
    clearTimeout(timeoutId);
    throw new DOMException('The operation was aborted.', 'AbortError');
  }

  let abortHandler: (() => void) | null = null;
  if (externalSignal) {
    abortHandler = () => controller.abort();
    externalSignal.addEventListener('abort', abortHandler, { once: true });
  }

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
    if (abortHandler && externalSignal) {
      externalSignal.removeEventListener('abort', abortHandler);
    }
  }
}

export function isRetryableError(status: number): boolean {
  return status >= 500 || status === 429 || status === 408;
}

export function getErrorMessage(status: number, defaultMessage: string): string {
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

export function normalizeDialogueError(error: unknown): Error {
  if (error instanceof DialogueApiError) {
    return error;
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return new DialogueApiError('请求超时，请重试', 408, true);
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new DialogueApiError('网络连接失败，请检查网络', 0, true);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(String(error));
}

function parseChatResponse(data: unknown): DialogueHttpResponsePayload {
  const response = (data as Partial<DialogueHttpResponsePayload>) || {};
  return {
    replyText: response.replyText ?? '',
    emotion: (response.emotion as EmotionType) ?? 'neutral',
    action: response.action ?? 'idle',
  };
}

export async function sendDialogueHttpRequest(
  payload: DialogueHttpRequestPayload,
  options: DialogueHttpRequestOptions,
): Promise<DialogueHttpResponsePayload> {
  const response = await fetchWithTimeout(
    `${options.endpoint}/v1/chat`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    options.timeout,
    options.signal,
  );

  if (!response.ok) {
    throw new DialogueApiError(
      getErrorMessage(response.status, `服务错误: ${response.status}`),
      response.status,
      isRetryableError(response.status),
    );
  }

  const data = await response.json();
  return parseChatResponse(data);
}

export async function sendDialogueStreamRequest(
  payload: DialogueHttpRequestPayload,
  options: DialogueHttpRequestOptions,
): Promise<Response> {
  const response = await fetchWithTimeout(
    `${options.endpoint}/v1/chat/stream`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    options.timeout,
    options.signal,
  );

  if (!response.ok || !response.body) {
    throw new DialogueApiError(
      getErrorMessage(response.status, `流式服务错误: ${response.status}`),
      response.status,
      isRetryableError(response.status) || !response.body,
    );
  }

  return response;
}
