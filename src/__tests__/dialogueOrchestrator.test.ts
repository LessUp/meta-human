import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  runDialogueTurnStream,
  handleDialogueResponse,
} from '../core/dialogue/dialogueOrchestrator';

// Mock transport to control turn behavior
vi.mock('../core/dialogue/chatTransport', () => {
  let mockStreamGenerator: AsyncGenerator<string, any, unknown> | null = null;
  let mockSendResult: any = {
    response: { replyText: 'ok', emotion: 'neutral', action: 'idle' },
    connectionStatus: 'connected',
    error: null,
  };

  async function* stream() {
    if (mockStreamGenerator) {
      return yield* mockStreamGenerator;
    }
  }

  return {
    getDefaultChatTransport: () => ({
      send: vi.fn(async () => mockSendResult),
      stream,
    }),
    __setMockStream: (gen: AsyncGenerator<string, any, unknown>) => {
      mockStreamGenerator = gen;
    },
    __setMockSendResult: (result: any) => {
      mockSendResult = result;
    },
  };
});

// Mock digitalHumanEngine to avoid store dependency
vi.mock('../core/services', () => ({
  digitalHumanEngine: {
    setBehavior: vi.fn(),
    setEmotion: vi.fn(),
    playAnimation: vi.fn(),
  },
}));

async function* tokens(texts: string[]): AsyncGenerator<string> {
  for (const t of texts) {
    yield t;
  }
}

describe('runDialogueTurnStream', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('accumulates tokens and calls onStreamToken progressively', async () => {
    const { __setMockStream } = (await import('../core/dialogue/chatTransport')) as any;
    __setMockStream(tokens(['你', '好', '！']));

    const streamTokens: string[] = [];
    const onStreamToken = vi.fn((text: string) => streamTokens.push(text));
    const onStreamEnd = vi.fn();
    const onAddUserMessage = vi.fn();
    const setLoading = vi.fn();

    const result = await runDialogueTurnStream('hi', {
      onAddUserMessage,
      onStreamToken,
      onStreamEnd,
      setLoading,
    });

    expect(onAddUserMessage).toHaveBeenCalledWith('hi');
    expect(streamTokens).toEqual(['你', '你好', '你好！']);
    expect(onStreamEnd).toHaveBeenCalledTimes(1);
    expect(result?.replyText).toBe('你好！');
  });

  it('returns undefined for empty input', async () => {
    const result = await runDialogueTurnStream('   ');
    expect(result).toBeUndefined();
  });

  it('calls setLoading with true then false', async () => {
    const { __setMockStream } = (await import('../core/dialogue/chatTransport')) as any;
    __setMockStream(tokens(['ok']));

    const setLoading = vi.fn();
    await runDialogueTurnStream('test', { setLoading });

    expect(setLoading).toHaveBeenCalledWith(true);
    expect(setLoading).toHaveBeenCalledWith(false);
  });

  it('rejects concurrent requests', async () => {
    const { __setMockStream } = (await import('../core/dialogue/chatTransport')) as any;

    // First request: slow generator that blocks
    let resolveFirst: () => void;
    const firstDone = new Promise<void>((r) => {
      resolveFirst = r;
    });

    async function* slowGen(): AsyncGenerator<string> {
      yield 'first';
      await firstDone;
    }

    __setMockStream(slowGen());

    // Start first request (don't await)
    const firstPromise = runDialogueTurnStream('first', {
      setLoading: vi.fn(),
      onStreamToken: vi.fn(),
      onStreamEnd: vi.fn(),
      onAddUserMessage: vi.fn(),
    });

    // Second request should be rejected
    const secondResult = await runDialogueTurnStream('second');
    expect(secondResult).toBeUndefined();

    // Resolve first so cleanup happens
    resolveFirst!();
    await firstPromise;
  });

  it('calls onError on stream failure', async () => {
    const { __setMockStream } = (await import('../core/dialogue/chatTransport')) as any;

    async function* failingGen(): AsyncGenerator<string> {
      yield 'partial';
      throw new Error('stream broke');
    }

    __setMockStream(failingGen());

    const onError = vi.fn();
    const onStreamToken = vi.fn();
    const onStreamEnd = vi.fn();

    const result = await runDialogueTurnStream('test', {
      onError,
      onStreamToken,
      onStreamEnd,
      setLoading: vi.fn(),
      onAddUserMessage: vi.fn(),
    });

    expect(onError).toHaveBeenCalledWith('stream broke');
    expect(onStreamEnd).toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it('propagates connection error when stream transport returns fallback status', async () => {
    const { __setMockStream } = (await import('../core/dialogue/chatTransport')) as any;

    async function* offlineFallbackGen(): AsyncGenerator<string, any, unknown> {
      yield '离线回复';
      return {
        response: { replyText: '离线回复', emotion: 'neutral', action: 'idle' },
        connectionStatus: 'error',
        error: '网络连接失败，请检查网络',
      };
    }

    __setMockStream(offlineFallbackGen());

    const onError = vi.fn();
    const onConnectionChange = vi.fn();
    const onStreamToken = vi.fn();

    const result = await runDialogueTurnStream('test', {
      onError,
      onConnectionChange,
      onStreamToken,
      onStreamEnd: vi.fn(),
      setLoading: vi.fn(),
      onAddUserMessage: vi.fn(),
    });

    expect(onStreamToken).toHaveBeenCalledWith('离线回复');
    expect(onConnectionChange).toHaveBeenCalledWith('error');
    expect(onError).toHaveBeenCalledWith('网络连接失败，请检查网络');
    expect(result?.replyText).toBe('离线回复');
  });
});

describe('handleDialogueResponse', () => {
  it('calls onAddAssistantMessage with replyText', async () => {
    const onAddAssistantMessage = vi.fn();
    await handleDialogueResponse(
      { replyText: '你好！', emotion: 'happy', action: 'wave' },
      { onAddAssistantMessage },
    );
    expect(onAddAssistantMessage).toHaveBeenCalledWith('你好！');
  });

  it('sets emotion on digitalHumanEngine', async () => {
    const { digitalHumanEngine } = await import('../core/services');
    await handleDialogueResponse({ replyText: 'hi', emotion: 'happy', action: 'idle' });
    expect(digitalHumanEngine.setEmotion).toHaveBeenCalledWith('happy');
  });

  it('plays animation for non-idle action', async () => {
    const { digitalHumanEngine } = await import('../core/services');
    await handleDialogueResponse({ replyText: 'hi', emotion: 'neutral', action: 'wave' });
    expect(digitalHumanEngine.playAnimation).toHaveBeenCalledWith('wave');
  });

  it('does not play animation for idle action', async () => {
    const { digitalHumanEngine } = await import('../core/services');
    (digitalHumanEngine.playAnimation as ReturnType<typeof vi.fn>).mockClear();
    await handleDialogueResponse({ replyText: 'hi', emotion: 'neutral', action: 'idle' });
    expect(digitalHumanEngine.playAnimation).not.toHaveBeenCalled();
  });

  it('calls speakWith when not muted', async () => {
    const speakWith = vi.fn();
    await handleDialogueResponse(
      { replyText: 'Hello', emotion: 'neutral', action: 'idle' },
      { isMuted: false, speakWith },
    );
    expect(speakWith).toHaveBeenCalledWith('Hello');
  });

  it('does not call speakWith when muted', async () => {
    const speakWith = vi.fn();
    await handleDialogueResponse(
      { replyText: 'Hello', emotion: 'neutral', action: 'idle' },
      { isMuted: true, speakWith },
    );
    expect(speakWith).not.toHaveBeenCalled();
  });

  it('calls onError when speakWith throws', async () => {
    const speakWith = vi.fn().mockRejectedValue(new Error('TTS failed'));
    const onError = vi.fn();

    await handleDialogueResponse(
      { replyText: 'Hello', emotion: 'neutral', action: 'idle' },
      { isMuted: false, speakWith, onError },
    );

    // speakWith is fire-and-forget, flush microtasks
    await new Promise((r) => setTimeout(r, 0));

    expect(onError).toHaveBeenCalledWith('TTS failed');
  });
});
