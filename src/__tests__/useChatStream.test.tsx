import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useChatStream } from '../hooks/useChatStream';
import { useDigitalHumanStore } from '../store/digitalHumanStore';
import { useChatSessionStore } from '../store/chatSessionStore';
import { useSystemStore } from '../store/systemStore';

const runDialogueTurnStreamMock = vi.fn();
const abortPendingTurnMock = vi.fn();
const moduleRunDialogueTurnStreamMock = vi.fn((_: string, _options: unknown) => {
  throw new Error('useChatStream should use useDialogue().runDialogueTurnStream');
});
const moduleAbortPendingTurnMock = vi.fn(() => {
  throw new Error('useChatStream should use useDialogue().abortPendingTurn');
});

vi.mock('@/core/services', () => ({
  useTTS: () => ({ speak: vi.fn() }),
  useEngine: () => ({ setBehavior: vi.fn() }),
  useDialogue: () => ({
    abortPendingTurn: () => abortPendingTurnMock(),
    runDialogueTurnStream: (text: string, options: unknown) =>
      runDialogueTurnStreamMock(text, options),
  }),
}));

vi.mock('../core/dialogue/dialogueOrchestrator', () => ({
  runDialogueTurnStream: (text: string, options: unknown) =>
    moduleRunDialogueTurnStreamMock(text, options),
  abortPendingTurn: () => moduleAbortPendingTurnMock(),
}));

describe('useChatStream', () => {
  beforeEach(() => {
    runDialogueTurnStreamMock.mockReset();
    abortPendingTurnMock.mockReset();
    moduleRunDialogueTurnStreamMock.mockClear();
    moduleAbortPendingTurnMock.mockClear();
    useDigitalHumanStore.setState({
      currentBehavior: 'idle',
    });
    useChatSessionStore.setState({
      sessionId: 'session_test',
      chatHistory: [],
    });
    useSystemStore.setState({
      isLoading: false,
      error: null,
      lastErrorTime: null,
      connectionStatus: 'connected',
      isConnected: true,
    });
  });

  it('adds user message before assistant stream placeholder and updates the streamed reply', async () => {
    runDialogueTurnStreamMock.mockImplementation(
      async (_text: string, options: Record<string, (...args: any[]) => void>) => {
        options.onAddUserMessage?.('你好');
        options.onStreamToken?.('你');
        options.onStreamToken?.('你好');
        options.onStreamEnd?.();

        return { replyText: '你好', emotion: 'neutral', action: 'idle' };
      },
    );

    const { result } = renderHook(() =>
      useChatStream({
        sessionId: 'session_test',
        isMuted: false,
        onConnectionChange: vi.fn(),
        onClearError: vi.fn(),
        onError: vi.fn(),
      }),
    );

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
  });

  it('removes an empty assistant placeholder when the stream fails before any token arrives', async () => {
    runDialogueTurnStreamMock.mockImplementation(
      async (_text: string, options: Record<string, (...args: any[]) => void>) => {
        options.onAddUserMessage?.('测试');
        options.onError?.('stream failed');
        return undefined;
      },
    );

    const { result } = renderHook(() =>
      useChatStream({
        sessionId: 'session_test',
        isMuted: false,
        onConnectionChange: vi.fn(),
        onClearError: vi.fn(),
        onError: vi.fn(),
      }),
    );

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

  it('aborts the pending dialogue turn on unmount', () => {
    const { unmount } = renderHook(() =>
      useChatStream({
        sessionId: 'session_test',
        isMuted: false,
        onConnectionChange: vi.fn(),
        onClearError: vi.fn(),
        onError: vi.fn(),
      }),
    );

    unmount();

    expect(abortPendingTurnMock).toHaveBeenCalledTimes(1);
  });
});
