import {
  sendUserInput,
  streamUserInput,
  type ChatRequestPayload,
  type ChatResponsePayload,
  type DialogueServiceConfig,
  type DialogueServiceResult,
  type StreamCallbacks,
} from './dialogueService';
import { MetaHumanWSClient, probeWebSocketEndpoint, type WSServerEvent } from './wsClient';

export type ChatTransportMode = 'auto' | 'http' | 'sse' | 'websocket';

export interface ChatTransport {
  mode: Exclude<ChatTransportMode, 'auto'>;
  send: (
    payload: ChatRequestPayload,
    config?: DialogueServiceConfig,
  ) => Promise<DialogueServiceResult>;
  stream: (
    payload: ChatRequestPayload,
    config?: DialogueServiceConfig,
    callbacks?: StreamCallbacks,
  ) => AsyncGenerator<string, DialogueServiceResult, unknown>;
}

type ConcreteChatTransportMode = Exclude<ChatTransportMode, 'auto'>;

export interface ChatTransportCapabilities {
  websocket: boolean;
  streaming: boolean;
  recommendedMode: ConcreteChatTransportMode;
  probedAt: number;
}

const DEFAULT_TIMEOUT_MS = 15000;

const buildEmptyResponse = (): ChatResponsePayload => ({
  replyText: '',
  emotion: 'neutral',
  action: 'idle',
});

export const httpChatTransport: ChatTransport = {
  mode: 'http',

  send(payload, config) {
    return sendUserInput(payload, config);
  },

  async *stream(
    payload: ChatRequestPayload,
    config: DialogueServiceConfig = {},
    callbacks: StreamCallbacks = {},
  ): AsyncGenerator<string, DialogueServiceResult, unknown> {
    const result = await sendUserInput(payload, config);

    if (result.connectionStatus === 'connected') {
      callbacks.onConnected?.();
    }

    if (result.error) {
      callbacks.onError?.(result.error);
    }
    callbacks.onDone?.(result.response);

    if (result.response.replyText) {
      yield result.response.replyText;
    }

    return result;
  },
};

export const sseChatTransport: ChatTransport = {
  mode: 'sse',

  send(payload, config) {
    return sendUserInput(payload, config);
  },

  stream(payload, config, callbacks) {
    return streamUserInput(payload, config, callbacks);
  },
};

function waitForSignal(register: (resolve: () => void) => void): Promise<void> {
  return new Promise((resolve) => register(resolve));
}

async function* streamOverWebSocket(
  payload: ChatRequestPayload,
  config: DialogueServiceConfig = {},
  callbacks: StreamCallbacks = {},
): AsyncGenerator<string, DialogueServiceResult, unknown> {
  const timeout = config.timeout ?? DEFAULT_TIMEOUT_MS;
  const sessionId = payload.sessionId ?? `ws_${Date.now()}`;
  const client = new MetaHumanWSClient(sessionId);

  const queue: string[] = [];
  let pendingResolver: (() => void) | null = null;
  let accumulatedText = '';
  let terminalEvent: WSServerEvent | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const notify = () => {
    if (pendingResolver) {
      pendingResolver();
      pendingResolver = null;
    }
  };

  const setTerminalEvent = (event: WSServerEvent) => {
    terminalEvent = event;
    notify();
  };

  const handleMessage = (event: WSServerEvent) => {
    if (event.type === 'token') {
      queue.push(event.content);
      notify();
      return;
    }

    if (event.type === 'done') {
      callbacks.onDone?.({
        replyText: event.replyText,
        emotion: event.emotion as ChatResponsePayload['emotion'],
        action: event.action,
      });
      setTerminalEvent(event);
      return;
    }

    callbacks.onError?.(event.message);
    setTerminalEvent(event);
  };

  try {
    await client.connect(handleMessage);
    callbacks.onConnected?.();
    client.send({ type: 'chat', userText: payload.userText, meta: payload.meta });

    timeoutId = setTimeout(() => {
      callbacks.onError?.('WebSocket 请求超时，请重试');
      setTerminalEvent({ type: 'error', message: 'WebSocket 请求超时，请重试' });
    }, timeout);

    while (!terminalEvent || queue.length > 0) {
      if (queue.length > 0) {
        const token = queue.shift();
        if (!token) {
          continue;
        }

        accumulatedText += token;
        yield token;
        continue;
      }

      await waitForSignal((resolve) => {
        pendingResolver = resolve;
      });
    }

    // Build return value from terminal event or accumulated text
    if (terminalEvent?.type === 'done') {
      return {
        response: {
          replyText: terminalEvent.replyText,
          emotion: terminalEvent.emotion as ChatResponsePayload['emotion'],
          action: terminalEvent.action,
        },
        connectionStatus: 'connected',
        error: null,
      };
    }

    if (accumulatedText) {
      return {
        response: {
          replyText: accumulatedText,
          emotion: 'neutral',
          action: 'idle',
        },
        connectionStatus: 'error',
        error: terminalEvent?.type === 'error' ? terminalEvent.message : 'WebSocket 流中断',
      };
    }

    // No tokens received and no terminal event — HTTP fallback
    const fallback = await sendUserInput(payload, config);

    if (fallback.response.replyText) {
      yield fallback.response.replyText;
    }

    return fallback;
  } catch (error) {
    console.warn('WebSocket 请求失败，降级到 HTTP:', error);
    const fallback = await sendUserInput(payload, config);

    if (fallback.response.replyText) {
      yield fallback.response.replyText;
    }

    return fallback;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    client.disconnect();
  }
}

export const webSocketChatTransport: ChatTransport = {
  mode: 'websocket',

  async send(payload, config) {
    const iterator = this.stream(payload, config);
    let finalResult: DialogueServiceResult | undefined;
    let step = await iterator.next();

    while (!step.done) {
      step = await iterator.next();
    }

    finalResult = step.value;

    return (
      finalResult ?? {
        response: buildEmptyResponse(),
        connectionStatus: 'error',
        error: 'WebSocket 未返回结果',
      }
    );
  },

  stream(payload, config, callbacks) {
    return streamOverWebSocket(payload, config, callbacks);
  },
};

const transportRegistry: Record<ConcreteChatTransportMode, ChatTransport> = {
  http: httpChatTransport,
  sse: sseChatTransport,
  websocket: webSocketChatTransport,
};

let transportOverride: ChatTransport | null = null;
let autoTransportMode: ConcreteChatTransportMode = getStreamingFallbackMode();
let cachedCapabilities: ChatTransportCapabilities | null = null;
let pendingCapabilitiesProbe: Promise<ChatTransportCapabilities> | null = null;

function canUseStreamingTransport(): boolean {
  return (
    typeof fetch === 'function' &&
    typeof ReadableStream !== 'undefined' &&
    typeof TextDecoder !== 'undefined'
  );
}

function getStreamingFallbackMode(): ConcreteChatTransportMode {
  return canUseStreamingTransport() ? 'sse' : 'http';
}

function cacheCapabilities(capabilities: ChatTransportCapabilities): ChatTransportCapabilities {
  cachedCapabilities = capabilities;
  autoTransportMode = capabilities.recommendedMode;
  return capabilities;
}

export function getPreferredChatTransportMode(): ChatTransportMode {
  const rawMode = import.meta.env.VITE_CHAT_TRANSPORT;
  if (!rawMode) {
    return 'auto';
  }

  const normalizedMode = rawMode.toLowerCase();
  if (normalizedMode === 'http' || normalizedMode === 'sse' || normalizedMode === 'websocket') {
    return normalizedMode;
  }

  return 'auto';
}

export function setChatTransportOverride(transport: ChatTransport | null): void {
  transportOverride = transport;
}

export function getCachedChatTransportCapabilities(): ChatTransportCapabilities | null {
  return cachedCapabilities;
}

export function resetChatTransportProbeCache(): void {
  cachedCapabilities = null;
  pendingCapabilitiesProbe = null;
  autoTransportMode = getStreamingFallbackMode();
}

export async function probeChatTransportCapabilities(
  options: {
    force?: boolean;
    timeoutMs?: number;
  } = {},
): Promise<ChatTransportCapabilities> {
  const { force = false, timeoutMs = 1200 } = options;

  if (!force && cachedCapabilities) {
    return cachedCapabilities;
  }

  if (!force && pendingCapabilitiesProbe) {
    return pendingCapabilitiesProbe;
  }

  pendingCapabilitiesProbe = (async () => {
    const streaming = canUseStreamingTransport();
    const websocket = await probeWebSocketEndpoint(timeoutMs).catch(() => false);

    return cacheCapabilities({
      websocket,
      streaming,
      recommendedMode: websocket ? 'websocket' : streaming ? 'sse' : 'http',
      probedAt: Date.now(),
    });
  })();

  try {
    return await pendingCapabilitiesProbe;
  } finally {
    pendingCapabilitiesProbe = null;
  }
}

export async function resolveChatTransportMode(
  mode: ChatTransportMode = getPreferredChatTransportMode(),
  options?: { forceProbe?: boolean; timeoutMs?: number },
): Promise<ConcreteChatTransportMode> {
  if (transportOverride) {
    return transportOverride.mode;
  }

  if (mode !== 'auto') {
    return getChatTransport(mode).mode;
  }

  const capabilities = await probeChatTransportCapabilities({
    force: options?.forceProbe,
    timeoutMs: options?.timeoutMs,
  });

  return capabilities.recommendedMode;
}

export function getChatTransport(
  mode: ChatTransportMode = getPreferredChatTransportMode(),
): ChatTransport {
  if (transportOverride) {
    return transportOverride;
  }

  if (mode === 'auto') {
    return transportRegistry[autoTransportMode];
  }

  if (mode === 'http') {
    return transportRegistry.http;
  }

  if (mode === 'websocket') {
    if (typeof WebSocket !== 'undefined') {
      return transportRegistry.websocket;
    }

    console.warn('WebSocket 不可用，回退到 SSE transport');
  }

  return transportRegistry.sse;
}

export function getDefaultChatTransport(): ChatTransport {
  return getChatTransport();
}
