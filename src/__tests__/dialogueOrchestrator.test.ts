import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  DialogueOrchestrator,
  handleDialogueResponse,
} from '../core/dialogue/dialogueOrchestrator';
import type { DialogueTurnSnapshot } from '../core/dialogue/dialogueTurnLifecycle';

// Mock transport to control turn behavior
vi.mock('../core/dialogue/chatTransport', () => {
  const defaultSendResult = {
    response: { replyText: 'ok', emotion: 'neutral', action: 'idle' },
    connectionStatus: 'connected',
    error: null,
  };
  let mockStreamGenerator: AsyncGenerator<string, any, unknown> | null = null;
  let mockSendResult: any = defaultSendResult;
  let mockSendImplementation: (() => Promise<any> | any) | null = null;
  let mockStreamImplementation:
    | ((...args: unknown[]) => AsyncGenerator<string, any, unknown>)
    | null = null;
  const send = vi.fn(() => (mockSendImplementation ? mockSendImplementation() : mockSendResult));
  const stream = vi.fn((...args: unknown[]) =>
    mockStreamImplementation
      ? mockStreamImplementation(...args)
      : (mockStreamGenerator ?? (async function* () {})()),
  );

  return {
    getDefaultChatTransport: () => ({
      send,
      stream,
    }),
    __setMockStream: (gen: AsyncGenerator<string, any, unknown>) => {
      mockStreamGenerator = gen;
      mockStreamImplementation = null;
    },
    __setMockSendResult: (result: any) => {
      mockSendResult = result;
      mockSendImplementation = null;
    },
    __setMockSendImplementation: (implementation: () => Promise<any> | any) => {
      mockSendImplementation = implementation;
    },
    __setMockStreamImplementation: (
      implementation: (...args: unknown[]) => AsyncGenerator<string, any, unknown>,
    ) => {
      mockStreamImplementation = implementation;
    },
    __resetMockTransport: () => {
      mockStreamGenerator = null;
      mockSendResult = defaultSendResult;
      mockSendImplementation = null;
      mockStreamImplementation = null;
    },
  };
});

// Mock engine for handleDialogueResponse tests
const mockEngine = {
  setBehavior: vi.fn(),
  setEmotion: vi.fn(),
  playAnimation: vi.fn(),
};

async function* tokens(texts: string[]): AsyncGenerator<string> {
  for (const t of texts) {
    yield t;
  }
}

function expectSnapshot(snapshot: DialogueTurnSnapshot, partial: Partial<DialogueTurnSnapshot>) {
  expect(snapshot).toMatchObject(partial);
  expect(snapshot.updatedAt).toEqual(expect.any(Number));
  if (snapshot.status !== 'idle') {
    expect(snapshot.startedAt).toEqual(expect.any(Number));
  }
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function createControlledPendingStream() {
  const nextStep = createDeferred<IteratorResult<string, unknown>>();
  const returnSpy = vi.fn(
    async (): Promise<IteratorReturnResult<unknown>> => ({ done: true as const, value: undefined }),
  );
  let nextCount = 0;

  const generator: AsyncGenerator<string, unknown, unknown> = {
    next: vi.fn(async () => {
      nextCount += 1;

      if (nextCount === 1) {
        return { done: false, value: 'partial' };
      }

      return nextStep.promise;
    }),
    return: returnSpy,
    throw: vi.fn(async (error?: unknown) => {
      throw error;
    }),
    [Symbol.asyncIterator]() {
      return this;
    },
    async [Symbol.asyncDispose]() {},
  };

  return { generator, nextStep, returnSpy };
}

describe('dialogue turn lifecycle seam', () => {
  let orchestrator: DialogueOrchestrator;

  beforeEach(async () => {
    orchestrator = new DialogueOrchestrator();
    const { __resetMockTransport } = (await import('../core/dialogue/chatTransport')) as any;
    __resetMockTransport();
  });

  it('publishes sending then complete for standard turns', async () => {
    const { __setMockSendResult } = (await import('../core/dialogue/chatTransport')) as any;
    const deferred = createDeferred<{
      response: { replyText: string; emotion: string; action: string };
      connectionStatus: 'connected';
      error: null;
    }>();
    __setMockSendResult(deferred.promise);

    const snapshots: DialogueTurnSnapshot[] = [];
    const unsubscribe = orchestrator.subscribeTurnSnapshot((snapshot) => {
      snapshots.push(snapshot);
    });

    const turnPromise = orchestrator.runDialogueTurn('hello');

    expectSnapshot(orchestrator.getTurnSnapshot(), {
      status: 'sending',
      mode: 'standard',
      turnId: 1,
      userText: 'hello',
    });

    deferred.resolve({
      response: { replyText: 'ok', emotion: 'neutral', action: 'idle' },
      connectionStatus: 'connected',
      error: null,
    });

    await expect(turnPromise).resolves.toMatchObject({ replyText: 'ok' });

    expect(snapshots.map((snapshot) => snapshot.status)).toEqual(['sending', 'complete']);
    expectSnapshot(orchestrator.getTurnSnapshot(), {
      status: 'complete',
      mode: 'standard',
      turnId: 1,
      userText: 'hello',
      replyText: 'ok',
    });

    unsubscribe();
  });

  it('publishes sending then error for standard turn failures', async () => {
    const { __setMockSendResult } = (await import('../core/dialogue/chatTransport')) as any;
    const deferred = createDeferred<never>();
    __setMockSendResult(deferred.promise);

    const snapshots: DialogueTurnSnapshot[] = [];
    orchestrator.subscribeTurnSnapshot((snapshot) => {
      snapshots.push(snapshot);
    });

    const turnPromise = orchestrator.runDialogueTurn('hello');
    deferred.reject(new Error('send broke'));

    await expect(turnPromise).rejects.toThrow('send broke');

    expect(snapshots.map((snapshot) => snapshot.status)).toEqual(['sending', 'error']);
    expectSnapshot(orchestrator.getTurnSnapshot(), {
      status: 'error',
      mode: 'standard',
      turnId: 1,
      userText: 'hello',
      error: 'send broke',
    });
  });

  it('clears pending state when send throws synchronously before awaiting', async () => {
    const { __setMockSendImplementation } = (await import('../core/dialogue/chatTransport')) as any;
    __setMockSendImplementation(() => {
      throw new Error('sync send broke');
    });

    const setLoading = vi.fn();
    const onResetBehavior = vi.fn();

    await expect(
      orchestrator.runDialogueTurn('hello', {
        setLoading,
        onResetBehavior,
      }),
    ).rejects.toThrow('sync send broke');

    expect(setLoading).toHaveBeenNthCalledWith(1, true);
    expect(setLoading).toHaveBeenNthCalledWith(2, false);
    expect(onResetBehavior).toHaveBeenCalledTimes(1);
    expect(orchestrator.isTurnPending()).toBe(false);
    expectSnapshot(orchestrator.getTurnSnapshot(), {
      status: 'error',
      mode: 'standard',
      turnId: 1,
      userText: 'hello',
      error: 'sync send broke',
    });
  });

  it('allows a new turn immediately after aborting a pending turn', async () => {
    const { __setMockSendResult } = (await import('../core/dialogue/chatTransport')) as any;
    const firstTurn = createDeferred<{
      response: { replyText: string; emotion: string; action: string };
      connectionStatus: 'connected';
      error: null;
    }>();
    __setMockSendResult(firstTurn.promise);

    const firstPromise = orchestrator.runDialogueTurn('first');
    expect(orchestrator.isTurnPending()).toBe(true);

    orchestrator.abortPendingTurn();

    expectSnapshot(orchestrator.getTurnSnapshot(), {
      status: 'idle',
    });
    expect(orchestrator.isTurnPending()).toBe(false);

    __setMockSendResult({
      response: { replyText: 'second reply', emotion: 'neutral', action: 'idle' },
      connectionStatus: 'connected',
      error: null,
    });

    await expect(orchestrator.runDialogueTurn('second')).resolves.toMatchObject({
      replyText: 'second reply',
    });

    firstTurn.resolve({
      response: { replyText: 'first reply', emotion: 'neutral', action: 'idle' },
      connectionStatus: 'connected',
      error: null,
    });
    await expect(firstPromise).resolves.toBeUndefined();
  });

  it('clears loading immediately when aborting a pending turn', async () => {
    const { __setMockSendResult } = (await import('../core/dialogue/chatTransport')) as any;
    const firstTurn = createDeferred<{
      response: { replyText: string; emotion: string; action: string };
      connectionStatus: 'connected';
      error: null;
    }>();
    __setMockSendResult(firstTurn.promise);

    const setLoading = vi.fn();
    const firstPromise = orchestrator.runDialogueTurn('first', { setLoading });

    expect(setLoading).toHaveBeenLastCalledWith(true);

    orchestrator.abortPendingTurn();

    expect(setLoading).toHaveBeenLastCalledWith(false);
    expectSnapshot(orchestrator.getTurnSnapshot(), {
      status: 'idle',
    });

    firstTurn.resolve({
      response: { replyText: 'first reply', emotion: 'neutral', action: 'idle' },
      connectionStatus: 'connected',
      error: null,
    });
    await expect(firstPromise).resolves.toBeUndefined();
  });

  it('aborts a pending turn when reset is called and keeps the snapshot idle', async () => {
    const { __setMockSendResult } = (await import('../core/dialogue/chatTransport')) as any;
    const pendingTurn = createDeferred<{
      response: { replyText: string; emotion: string; action: string };
      connectionStatus: 'connected';
      error: null;
    }>();
    __setMockSendResult(pendingTurn.promise);

    const snapshots: DialogueTurnSnapshot[] = [];
    orchestrator.subscribeTurnSnapshot((snapshot) => {
      snapshots.push(snapshot);
    });

    const turnPromise = orchestrator.runDialogueTurn('reset me');

    expectSnapshot(orchestrator.getTurnSnapshot(), {
      status: 'sending',
      mode: 'standard',
      turnId: 1,
      userText: 'reset me',
    });

    orchestrator.reset();

    expect(orchestrator.isTurnPending()).toBe(false);
    expectSnapshot(orchestrator.getTurnSnapshot(), {
      status: 'idle',
    });

    pendingTurn.resolve({
      response: { replyText: 'late reply', emotion: 'neutral', action: 'idle' },
      connectionStatus: 'connected',
      error: null,
    });

    await expect(turnPromise).resolves.toBeUndefined();
    expect(orchestrator.getTurnSnapshot()).toMatchObject({
      status: 'idle',
      mode: null,
      turnId: null,
      userText: null,
      replyText: '',
      error: null,
    });
    expect(snapshots.map((snapshot) => snapshot.status)).toEqual(['sending', 'idle']);
  });

  it('does not reuse the aborted turn id when reset is followed by an immediate new turn', async () => {
    const { __setMockSendResult } = (await import('../core/dialogue/chatTransport')) as any;
    const firstTurn = createDeferred<{
      response: { replyText: string; emotion: string; action: string };
      connectionStatus: 'connected';
      error: null;
    }>();
    const secondTurn = createDeferred<{
      response: { replyText: string; emotion: string; action: string };
      connectionStatus: 'connected';
      error: null;
    }>();
    __setMockSendResult(firstTurn.promise);

    const firstPromise = orchestrator.runDialogueTurn('first');
    const firstSnapshot = orchestrator.getTurnSnapshot();

    orchestrator.reset();

    __setMockSendResult(secondTurn.promise);
    const secondPromise = orchestrator.runDialogueTurn('second');
    const secondSnapshot = orchestrator.getTurnSnapshot();

    expect(secondSnapshot).toMatchObject({
      status: 'sending',
      mode: 'standard',
      userText: 'second',
    });
    expect(secondSnapshot.turnId).not.toBe(firstSnapshot.turnId);

    firstTurn.resolve({
      response: { replyText: 'first reply', emotion: 'neutral', action: 'idle' },
      connectionStatus: 'connected',
      error: null,
    });

    await expect(firstPromise).resolves.toBeUndefined();

    expect(orchestrator.isTurnPending()).toBe(true);
    expect(orchestrator.getTurnSnapshot()).toMatchObject({
      status: 'sending',
      userText: 'second',
      turnId: secondSnapshot.turnId,
    });

    secondTurn.resolve({
      response: { replyText: 'second reply', emotion: 'neutral', action: 'idle' },
      connectionStatus: 'connected',
      error: null,
    });

    await expect(secondPromise).resolves.toMatchObject({
      replyText: 'second reply',
    });
  });

  it('publishes sending, streaming, then complete for streaming turns', async () => {
    const { __setMockStream } = (await import('../core/dialogue/chatTransport')) as any;
    __setMockStream(tokens(['你', '好']));

    const snapshots: DialogueTurnSnapshot[] = [];
    orchestrator.subscribeTurnSnapshot((snapshot) => {
      snapshots.push(snapshot);
    });

    await expect(orchestrator.runDialogueTurnStream('hi')).resolves.toMatchObject({
      replyText: '你好',
    });

    expectSnapshot(snapshots[0], {
      status: 'sending',
      mode: 'streaming',
      turnId: 1,
      userText: 'hi',
    });
    expect(snapshots.some((snapshot) => snapshot.status === 'streaming')).toBe(true);
    expectSnapshot(orchestrator.getTurnSnapshot(), {
      status: 'complete',
      mode: 'streaming',
      turnId: 1,
      userText: 'hi',
      replyText: '你好',
    });
  });
});

describe('runDialogueTurnStream', () => {
  let orchestrator: DialogueOrchestrator;

  beforeEach(async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    orchestrator = new DialogueOrchestrator();
    const { __resetMockTransport } = (await import('../core/dialogue/chatTransport')) as any;
    __resetMockTransport();
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

    const result = await orchestrator.runDialogueTurnStream('hi', {
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
    const result = await orchestrator.runDialogueTurnStream('   ');
    expect(result).toBeUndefined();
  });

  it('calls setLoading with true then false', async () => {
    const { __setMockStream } = (await import('../core/dialogue/chatTransport')) as any;
    __setMockStream(tokens(['ok']));

    const setLoading = vi.fn();
    await orchestrator.runDialogueTurnStream('test', { setLoading });

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
    const firstPromise = orchestrator.runDialogueTurnStream('first', {
      setLoading: vi.fn(),
      onStreamToken: vi.fn(),
      onStreamEnd: vi.fn(),
      onAddUserMessage: vi.fn(),
    });

    // Second request should be rejected
    const secondResult = await orchestrator.runDialogueTurnStream('second');
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

    const result = await orchestrator.runDialogueTurnStream('test', {
      onError,
      onStreamToken,
      onStreamEnd,
      setLoading: vi.fn(),
      onAddUserMessage: vi.fn(),
    });

    expect(onError).toHaveBeenCalledWith('stream broke');
    expect(onStreamEnd).toHaveBeenCalled();
    expect(result).toBeUndefined();
    expectSnapshot(orchestrator.getTurnSnapshot(), {
      status: 'error',
      mode: 'streaming',
      turnId: 1,
      userText: 'test',
      replyText: 'partial',
      error: 'stream broke',
    });
  });

  it('clears pending state when stream transport throws synchronously before awaiting', async () => {
    const { __setMockStreamImplementation } =
      (await import('../core/dialogue/chatTransport')) as any;
    __setMockStreamImplementation(() => {
      throw new Error('sync stream broke');
    });

    const setLoading = vi.fn();
    const onResetBehavior = vi.fn();
    const onError = vi.fn();
    const onStreamEnd = vi.fn();

    await expect(
      orchestrator.runDialogueTurnStream('test', {
        setLoading,
        onResetBehavior,
        onError,
        onStreamEnd,
      }),
    ).resolves.toBeUndefined();

    expect(setLoading).toHaveBeenNthCalledWith(1, true);
    expect(setLoading).toHaveBeenNthCalledWith(2, false);
    expect(onResetBehavior).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith('sync stream broke');
    expect(onStreamEnd).toHaveBeenCalledTimes(1);
    expect(orchestrator.isTurnPending()).toBe(false);
    expectSnapshot(orchestrator.getTurnSnapshot(), {
      status: 'error',
      mode: 'streaming',
      turnId: 1,
      userText: 'test',
      replyText: '',
      error: 'sync stream broke',
    });
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

    const result = await orchestrator.runDialogueTurnStream('test', {
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

  it.each([
    ['abortPendingTurn', (orchestrator: DialogueOrchestrator) => orchestrator.abortPendingTurn()],
    ['reset', (orchestrator: DialogueOrchestrator) => orchestrator.reset()],
  ])('closes the active stream generator on %s', async (_label, closeTurn) => {
    const { __setMockStream } = (await import('../core/dialogue/chatTransport')) as any;
    const { generator, nextStep, returnSpy } = createControlledPendingStream();
    __setMockStream(generator);

    const turnPromise = orchestrator.runDialogueTurnStream('stream me', {
      onStreamToken: vi.fn(),
      onStreamEnd: vi.fn(),
      onAddUserMessage: vi.fn(),
      setLoading: vi.fn(),
    });

    await vi.waitFor(() => {
      expect(orchestrator.getTurnSnapshot()).toMatchObject({
        status: 'streaming',
        replyText: 'partial',
      });
    });

    closeTurn(orchestrator);
    nextStep.resolve({ done: true, value: undefined });

    await expect(turnPromise).resolves.toBeUndefined();
    expect(returnSpy).toHaveBeenCalledTimes(1);
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

  it('sets emotion on engine', async () => {
    mockEngine.setEmotion.mockClear();
    await handleDialogueResponse(
      { replyText: 'hi', emotion: 'happy', action: 'idle' },
      { engine: mockEngine as any },
    );
    expect(mockEngine.setEmotion).toHaveBeenCalledWith('happy');
  });

  it('plays animation for non-idle action', async () => {
    mockEngine.playAnimation.mockClear();
    await handleDialogueResponse(
      { replyText: 'hi', emotion: 'neutral', action: 'wave' },
      { engine: mockEngine as any },
    );
    expect(mockEngine.playAnimation).toHaveBeenCalledWith('wave');
  });

  it('does not play animation for idle action', async () => {
    mockEngine.playAnimation.mockClear();
    await handleDialogueResponse(
      { replyText: 'hi', emotion: 'neutral', action: 'idle' },
      { engine: mockEngine as any },
    );
    expect(mockEngine.playAnimation).not.toHaveBeenCalled();
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
