import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { useChatStream } from '../hooks/useChatStream';
import { ServicesProvider, type Services } from '@/core/services';
import type { ServiceComposition } from '@/core/serviceComposition';
import { DialogueOrchestrator } from '@/core/dialogue/dialogueOrchestrator';
import { useDigitalHumanStore } from '../store/digitalHumanStore';
import { useChatSessionStore } from '../store/chatSessionStore';
import { useSystemStore } from '../store/systemStore';

type MockStreamResult = {
  response: { replyText: string; emotion: string; action: string };
  connectionStatus: 'connected' | 'error';
  error: string | null;
};

type MockStreamHandler = (signal: AbortSignal) => AsyncGenerator<string, MockStreamResult, unknown>;
type MockStreamRequest = {
  sessionId?: string;
  userText?: string;
  meta?: Record<string, unknown>;
};

const streamHandlers: MockStreamHandler[] = [];
const streamMock = vi.fn(
  (
    _request: unknown,
    _options: unknown,
    _callbacks: unknown,
    signal: AbortSignal,
  ): AsyncGenerator<string, MockStreamResult, unknown> => {
    const handler = streamHandlers.shift();

    if (!handler) {
      throw new Error('No mock stream handler queued');
    }

    return handler(signal);
  },
);

vi.mock('../core/dialogue/chatTransport', () => ({
  getDefaultChatTransport: () => ({
    send: vi.fn(),
    stream: streamMock,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

function queueStreamHandler(handler: MockStreamHandler) {
  streamHandlers.push(handler);
}

function createCompletedStream(
  replyText: string,
): AsyncGenerator<string, MockStreamResult, unknown> {
  return (async function* () {
    for (const token of [] as string[]) {
      yield token;
    }

    return {
      response: { replyText, emotion: 'neutral', action: 'idle' },
      connectionStatus: 'connected' as const,
      error: null,
    };
  })();
}

function createAbortablePendingStream(replyText = 'aborted reply'): MockStreamHandler {
  return (signal) =>
    (async function* () {
      for (const token of [] as string[]) {
        yield token;
      }

      await new Promise<void>((resolve) => {
        signal.addEventListener('abort', () => resolve(), { once: true });
      });

      return {
        response: { replyText, emotion: 'neutral', action: 'idle' },
        connectionStatus: 'connected' as const,
        error: null,
      };
    })();
}

function createFailingStream(
  errorMessage: string,
): AsyncGenerator<string, MockStreamResult, unknown> {
  return (async function* () {
    for (const token of [] as string[]) {
      yield token;
    }

    throw new Error(errorMessage);
  })();
}

function createTestComposition(): ServiceComposition {
  const dialogue = new DialogueOrchestrator();
  const services: Services = {
    dialogue,
    engine: {
      dispose: vi.fn(),
      setBehavior: vi.fn(),
      setEmotion: vi.fn(),
      playAnimation: vi.fn(),
    } as unknown as Services['engine'],
    tts: {
      dispose: vi.fn(),
      speak: vi.fn(),
    } as unknown as Services['tts'],
    asr: {
      dispose: vi.fn(),
    } as unknown as Services['asr'],
  };

  return {
    services,
    dispose: vi.fn(),
  };
}

function renderChatStreamHook(
  options: {
    composition?: ServiceComposition;
    sessionId?: string;
  } = {},
) {
  const composition = options.composition ?? createTestComposition();
  const sessionId = options.sessionId ?? 'session_test';
  const wrapper = ({ children }: { children: ReactNode }) => (
    <ServicesProvider composition={composition}>{children}</ServicesProvider>
  );

  const renderResult = renderHook(
    () =>
      useChatStream({
        sessionId,
        isMuted: false,
        onConnectionChange: vi.fn(),
        onClearError: vi.fn(),
        onError: vi.fn(),
      }),
    { wrapper },
  );

  return {
    ...renderResult,
    composition,
  };
}

describe('useChatStream', () => {
  beforeEach(() => {
    streamHandlers.length = 0;
    streamMock.mockClear();
    localStorage.clear();
    useDigitalHumanStore.setState({
      currentBehavior: 'idle',
    });
    useChatSessionStore.setState({
      sessionId: 'session_test',
      chatHistory: [],
    });
    useSystemStore.getState().resetSystemState();
  });

  it('adds user message before assistant stream placeholder and updates the streamed reply', async () => {
    queueStreamHandler(() =>
      (async function* () {
        yield '你';
        yield '好';
        return {
          response: { replyText: '你好', emotion: 'neutral', action: 'idle' },
          connectionStatus: 'connected' as const,
          error: null,
        };
      })(),
    );

    const { result } = renderChatStreamHook();

    await act(async () => {
      await result.current.handleChatSend('你好');
    });

    const messages = useChatSessionStore.getState().chatHistory;

    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({ role: 'user', text: '你好' });
    expect(messages[1]).toMatchObject({
      role: 'assistant',
      text: '你好',
      isStreaming: false,
    });
    expect(useSystemStore.getState().chatPerformance.status).toBe('completed');
    expect(useSystemStore.getState().chatPerformance.firstTokenMs).not.toBeNull();
    expect(useSystemStore.getState().chatPerformance.responseCompleteMs).not.toBeNull();
    expect(useSystemStore.getState().chatPerformance.responseCompleteMs).toBeGreaterThanOrEqual(
      useSystemStore.getState().chatPerformance.firstTokenMs ?? 0,
    );
    const firstRequest = streamMock.mock.calls[0]?.[0] as MockStreamRequest | undefined;
    expect(firstRequest).toMatchObject({
      sessionId: 'session_test',
      userText: '你好',
      meta: {
        language: 'zh-CN',
        speech: {
          voiceName: null,
          rate: 1,
          pitch: 1,
          volume: 0.8,
        },
        vision: null,
      },
    });
    expect(firstRequest?.meta).toEqual(
      expect.objectContaining({
        timestamp: expect.any(Number),
      }),
    );
    expect(useSystemStore.getState().dialogueTurn).toMatchObject({
      status: 'complete',
      mode: 'streaming',
      turnId: 1,
      userText: '你好',
      replyText: '你好',
      error: null,
    });
  });

  it('uses the preferred UI language in dialogue request metadata', async () => {
    localStorage.setItem('preferred-lang', 'en');
    queueStreamHandler(() => createCompletedStream('hello back'));

    const { result } = renderChatStreamHook();

    await act(async () => {
      await result.current.handleChatSend('hello');
    });

    const firstRequest = streamMock.mock.calls[0]?.[0] as MockStreamRequest | undefined;
    expect(firstRequest?.meta).toEqual(
      expect.objectContaining({
        language: 'en',
      }),
    );
  });

  it('includes the latest vision context in dialogue request metadata when available', async () => {
    queueStreamHandler(() => createCompletedStream('vision aware'));
    useDigitalHumanStore.setState({
      ...(useDigitalHumanStore.getState() as unknown as Record<string, unknown>),
      visionContext: {
        emotion: 'happy',
        motion: 'waveHand',
        updatedAt: 1_700_000_000_123,
      },
    } as unknown as Partial<ReturnType<typeof useDigitalHumanStore.getState>>);

    const { result } = renderChatStreamHook();

    await act(async () => {
      await result.current.handleChatSend('look at me');
    });

    const firstRequest = streamMock.mock.calls[0]?.[0] as MockStreamRequest | undefined;
    expect(firstRequest?.meta).toEqual(
      expect.objectContaining({
        vision: {
          emotion: 'happy',
          motion: 'waveHand',
          updatedAt: 1_700_000_000_123,
        },
      }),
    );
  });

  it('includes the current speech preferences in dialogue request metadata', async () => {
    queueStreamHandler(() => createCompletedStream('configured speech'));
    useDigitalHumanStore.setState({
      ...(useDigitalHumanStore.getState() as unknown as Record<string, unknown>),
      speechConfig: {
        voiceName: 'English Voice',
        rate: 1.25,
        pitch: 0.85,
        volume: 0.6,
      },
    } as unknown as Partial<ReturnType<typeof useDigitalHumanStore.getState>>);

    const { result } = renderChatStreamHook();

    await act(async () => {
      await result.current.handleChatSend('configured');
    });

    const firstRequest = streamMock.mock.calls[0]?.[0] as MockStreamRequest | undefined;
    expect(firstRequest?.meta).toEqual(
      expect.objectContaining({
        speech: {
          voiceName: 'English Voice',
          rate: 1.25,
          pitch: 0.85,
          volume: 0.6,
        },
      }),
    );
  });

  it('removes an empty assistant placeholder when the stream fails before any token arrives', async () => {
    queueStreamHandler(() => createFailingStream('stream failed'));

    const { result } = renderChatStreamHook();

    await act(async () => {
      await result.current.handleChatSend('测试');
    });

    const messages = useChatSessionStore.getState().chatHistory;

    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ role: 'user', text: '测试' });
    expect(useSystemStore.getState().chatPerformance.status).toBe('failed');
    expect(useSystemStore.getState().chatPerformance.firstTokenMs).toBeNull();
    expect(useSystemStore.getState().chatPerformance.responseCompleteMs).not.toBeNull();
  });

  it('clears loading immediately after abort so the next send is not blocked', async () => {
    queueStreamHandler(createAbortablePendingStream());
    queueStreamHandler(() => createCompletedStream('second reply'));

    const { result, composition } = renderChatStreamHook();

    let firstTurnPromise!: Promise<void>;
    act(() => {
      firstTurnPromise = result.current.handleChatSend('first');
    });

    expect(useSystemStore.getState().isLoading).toBe(true);
    expect(streamMock).toHaveBeenCalledTimes(1);

    act(() => {
      composition.services.dialogue.abortPendingTurn();
    });

    expect(useSystemStore.getState().isLoading).toBe(false);

    let secondTurnPromise!: Promise<void>;
    act(() => {
      secondTurnPromise = result.current.handleChatSend('second');
    });

    expect(streamMock).toHaveBeenCalledTimes(2);

    await act(async () => {
      await firstTurnPromise;
      await secondTurnPromise;
    });

    expect(useChatSessionStore.getState().chatHistory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'user', text: 'second' }),
        expect.objectContaining({ role: 'assistant', text: 'second reply' }),
      ]),
    );
  });

  it('resets the system dialogue turn to idle on unmount after a completed turn', async () => {
    queueStreamHandler(() => createCompletedStream('done'));

    const { result, unmount } = renderChatStreamHook();

    await act(async () => {
      await result.current.handleChatSend('complete me');
    });

    expect(useSystemStore.getState().dialogueTurn).toMatchObject({
      status: 'complete',
      mode: 'streaming',
      turnId: 1,
      userText: 'complete me',
      replyText: 'done',
      error: null,
    });

    unmount();

    expect(useSystemStore.getState().dialogueTurn).toMatchObject({
      status: 'idle',
      mode: null,
      turnId: null,
      userText: null,
      replyText: '',
      error: null,
    });
  });

  it('does not rehydrate a stale completed snapshot when a new session mounts', async () => {
    queueStreamHandler(() => createCompletedStream('done'));

    const composition = createTestComposition();
    const firstMount = renderChatStreamHook({
      composition,
      sessionId: 'session_a',
    });

    await act(async () => {
      await firstMount.result.current.handleChatSend('complete me');
    });

    expect(useSystemStore.getState().dialogueTurn).toMatchObject({
      status: 'complete',
      mode: 'streaming',
      userText: 'complete me',
      replyText: 'done',
      error: null,
    });

    firstMount.unmount();

    expect(useSystemStore.getState().dialogueTurn).toMatchObject({
      status: 'idle',
      mode: null,
      turnId: null,
      userText: null,
      replyText: '',
      error: null,
    });

    renderChatStreamHook({
      composition,
      sessionId: 'session_b',
    });

    expect(useSystemStore.getState().dialogueTurn).toMatchObject({
      status: 'idle',
      mode: null,
      turnId: null,
      userText: null,
      replyText: '',
      error: null,
    });
  });

  it('removes the transient assistant placeholder and settles performance on unmount during a pending stream', async () => {
    queueStreamHandler(createAbortablePendingStream());

    const { result, unmount } = renderChatStreamHook();

    let pendingTurnPromise!: Promise<void>;
    act(() => {
      pendingTurnPromise = result.current.handleChatSend('pending');
    });

    expect(useChatSessionStore.getState().chatHistory).toEqual([
      expect.objectContaining({ role: 'user', text: 'pending' }),
      expect.objectContaining({ role: 'assistant', text: '', isStreaming: true }),
    ]);
    expect(useSystemStore.getState().chatPerformance.status).toBe('pending');

    unmount();

    await act(async () => {
      await pendingTurnPromise;
    });

    expect(useChatSessionStore.getState().chatHistory).toEqual([
      expect.objectContaining({ role: 'user', text: 'pending' }),
    ]);
    expect(useSystemStore.getState().chatPerformance.status).toBe('failed');
    expect(useSystemStore.getState().chatPerformance.responseCompleteMs).not.toBeNull();
    expect(useSystemStore.getState().dialogueTurn).toMatchObject({
      status: 'idle',
      mode: null,
      turnId: null,
      userText: null,
      replyText: '',
      error: null,
    });
  });
});
