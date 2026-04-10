import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DialogueServiceResult } from '../core/dialogue/dialogueService';

const sendUserInputMock = vi.fn();
const streamUserInputMock = vi.fn();
const wsConnectMock = vi.fn();
const wsSendMock = vi.fn();
const wsDisconnectMock = vi.fn();
const probeWebSocketEndpointMock = vi.fn();

vi.mock('../core/dialogue/dialogueService', () => ({
  sendUserInput: (...args: unknown[]) => sendUserInputMock(...args),
  streamUserInput: (...args: unknown[]) => streamUserInputMock(...args),
}));

vi.mock('../core/dialogue/wsClient', () => ({
  probeWebSocketEndpoint: (...args: unknown[]) => probeWebSocketEndpointMock(...args),
  MetaHumanWSClient: class {
    connect = (...args: unknown[]) => wsConnectMock(...args);
    send = (...args: unknown[]) => wsSendMock(...args);
    disconnect = (...args: unknown[]) => wsDisconnectMock(...args);
  },
}));

describe('chatTransport', () => {
  beforeEach(() => {
    sendUserInputMock.mockReset();
    streamUserInputMock.mockReset();
    wsConnectMock.mockReset();
    wsSendMock.mockReset();
    wsDisconnectMock.mockReset();
    probeWebSocketEndpointMock.mockReset();
    probeWebSocketEndpointMock.mockResolvedValue(false);
    vi.resetModules();
  });

  it('returns override transport when one is registered', async () => {
    const { getDefaultChatTransport, setChatTransportOverride } =
      await import('../core/dialogue/chatTransport');

    const overrideTransport = {
      mode: 'http' as const,
      send: vi.fn(),
      stream: vi.fn(),
    };

    setChatTransportOverride(overrideTransport);

    expect(getDefaultChatTransport()).toBe(overrideTransport);

    setChatTransportOverride(null);
  });

  it('http transport streams the full reply as a single token', async () => {
    const result: DialogueServiceResult = {
      response: { replyText: '完整回复', emotion: 'neutral', action: 'idle' },
      connectionStatus: 'connected',
      error: null,
    };

    sendUserInputMock.mockResolvedValue(result);

    const { httpChatTransport } = await import('../core/dialogue/chatTransport');
    const iterator = httpChatTransport.stream({ userText: 'hi' });

    expect(await iterator.next()).toEqual({ value: '完整回复', done: false });
    expect(await iterator.next()).toEqual({ value: result, done: true });
  });

  it('sse transport delegates to dialogueService stream implementation', async () => {
    const finalResult: DialogueServiceResult = {
      response: { replyText: 'streamed', emotion: 'happy', action: 'wave' },
      connectionStatus: 'connected',
      error: null,
    };

    streamUserInputMock.mockImplementation(async function* () {
      yield 'streamed';
      return finalResult;
    });

    const { sseChatTransport } = await import('../core/dialogue/chatTransport');
    const iterator = sseChatTransport.stream({ userText: 'hi' });

    expect(await iterator.next()).toEqual({ value: 'streamed', done: false });
    expect(await iterator.next()).toEqual({ value: finalResult, done: true });
    expect(streamUserInputMock).toHaveBeenCalledTimes(1);
  });

  it('websocket transport falls back to HTTP when connect fails', async () => {
    wsConnectMock.mockRejectedValue(new Error('ws unavailable'));

    const fallbackResult: DialogueServiceResult = {
      response: { replyText: 'fallback', emotion: 'neutral', action: 'idle' },
      connectionStatus: 'error',
      error: '网络连接失败，请检查网络',
    };
    sendUserInputMock.mockResolvedValue(fallbackResult);

    const { webSocketChatTransport } = await import('../core/dialogue/chatTransport');
    const iterator = webSocketChatTransport.stream({ userText: 'hi', sessionId: 'sess_1' });

    expect(await iterator.next()).toEqual({ value: 'fallback', done: false });
    expect(await iterator.next()).toEqual({ value: fallbackResult, done: true });
    expect(wsDisconnectMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to sse transport when websocket is requested but unavailable', async () => {
    const originalWebSocket = globalThis.WebSocket;

    try {
      Object.defineProperty(globalThis, 'WebSocket', {
        configurable: true,
        value: undefined,
      });

      const { getChatTransport } = await import('../core/dialogue/chatTransport');

      expect(getChatTransport('websocket').mode).toBe('sse');
    } finally {
      Object.defineProperty(globalThis, 'WebSocket', {
        configurable: true,
        value: originalWebSocket,
      });
    }
  });

  it('resolves auto mode to websocket after a successful probe', async () => {
    probeWebSocketEndpointMock.mockResolvedValue(true);

    const { getDefaultChatTransport, resetChatTransportProbeCache, resolveChatTransportMode } =
      await import('../core/dialogue/chatTransport');

    resetChatTransportProbeCache();

    await expect(resolveChatTransportMode()).resolves.toBe('websocket');
    expect(getDefaultChatTransport().mode).toBe('websocket');
  });

  it('keeps auto mode on sse when websocket probe fails', async () => {
    probeWebSocketEndpointMock.mockResolvedValue(false);

    const { getDefaultChatTransport, resetChatTransportProbeCache, resolveChatTransportMode } =
      await import('../core/dialogue/chatTransport');

    resetChatTransportProbeCache();

    await expect(resolveChatTransportMode()).resolves.toBe('sse');
    expect(getDefaultChatTransport().mode).toBe('sse');
  });
});
