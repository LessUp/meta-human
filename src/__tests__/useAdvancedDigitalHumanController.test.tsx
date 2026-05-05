import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAdvancedDigitalHumanController } from '../hooks/useAdvancedDigitalHumanController';
import { useDigitalHumanStore } from '../store/digitalHumanStore';
import { useChatSessionStore } from '../store/chatSessionStore';
import { useSystemStore } from '../store/systemStore';

const mocks = vi.hoisted(() => ({
  setChatInputMock: vi.fn(),
  handleChatSendMock: vi.fn(),
  reconnectMock: vi.fn(),
  asrStartMock: vi.fn(),
  asrStopMock: vi.fn(),
  asrPerformGreetingMock: vi.fn(),
  asrPerformDanceMock: vi.fn(),
  clearRemoteSessionMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastInfoMock: vi.fn(),
  digitalHumanDisposeMock: vi.fn(),
  digitalHumanPauseMock: vi.fn(),
  digitalHumanPlayMock: vi.fn(),
  digitalHumanResetMock: vi.fn(),
  digitalHumanSetExpressionMock: vi.fn(),
  digitalHumanSetExpressionIntensityMock: vi.fn(),
  digitalHumanSetBehaviorMock: vi.fn(),
}));

vi.mock('../hooks/useChatStream', () => ({
  useChatStream: () => ({
    chatInput: 'draft',
    setChatInput: mocks.setChatInputMock,
    isChatLoading: false,
    handleChatSend: mocks.handleChatSendMock,
  }),
}));

vi.mock('../hooks/useConnectionHealth', () => ({
  useConnectionHealth: () => ({
    reconnect: mocks.reconnectMock,
  }),
}));

vi.mock('../core/services', () => ({
  asrService: {
    start: mocks.asrStartMock,
    stop: mocks.asrStopMock,
    performGreeting: mocks.asrPerformGreetingMock,
    performDance: mocks.asrPerformDanceMock,
  },
  digitalHumanEngine: {
    dispose: mocks.digitalHumanDisposeMock,
    pause: mocks.digitalHumanPauseMock,
    play: mocks.digitalHumanPlayMock,
    reset: mocks.digitalHumanResetMock,
    setExpression: mocks.digitalHumanSetExpressionMock,
    setExpressionIntensity: mocks.digitalHumanSetExpressionIntensityMock,
    setBehavior: mocks.digitalHumanSetBehaviorMock,
  },
}));

vi.mock('../core/dialogue/dialogueService', () => ({
  clearRemoteSession: (...args: unknown[]) => mocks.clearRemoteSessionMock(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    success: mocks.toastSuccessMock,
    info: mocks.toastInfoMock,
  },
}));

describe('useAdvancedDigitalHumanController', () => {
  beforeEach(() => {
    vi.useRealTimers();
    mocks.setChatInputMock.mockReset();
    mocks.handleChatSendMock.mockReset();
    mocks.reconnectMock.mockReset();
    mocks.asrStartMock.mockReset();
    mocks.asrStopMock.mockReset();
    mocks.asrPerformGreetingMock.mockReset();
    mocks.asrPerformDanceMock.mockReset();
    mocks.clearRemoteSessionMock.mockReset();
    mocks.clearRemoteSessionMock.mockResolvedValue(undefined);
    mocks.toastSuccessMock.mockReset();
    mocks.toastInfoMock.mockReset();
    mocks.digitalHumanDisposeMock.mockReset();
    mocks.digitalHumanPauseMock.mockReset();
    mocks.digitalHumanPlayMock.mockReset();
    mocks.digitalHumanResetMock.mockReset();
    mocks.digitalHumanSetExpressionMock.mockReset();
    mocks.digitalHumanSetExpressionIntensityMock.mockReset();
    mocks.digitalHumanSetBehaviorMock.mockReset();
    mocks.asrStartMock.mockReturnValue(true);

    useDigitalHumanStore.setState({
      isPlaying: false,
      isRecording: false,
      isMuted: false,
      autoRotate: false,
      isSpeaking: false,
      currentEmotion: 'neutral',
      currentExpression: 'neutral',
      expressionIntensity: 0.8,
      currentBehavior: 'idle',
    });
    useChatSessionStore.setState({
      sessionId: 'session_old',
      chatHistory: [],
    });
    useSystemStore.setState({
      isConnected: true,
      connectionStatus: 'connected',
      isLoading: false,
      error: null,
      lastErrorTime: null,
      chatTransportMode: 'sse',
    });
  });

  it('starts a new session, clears draft input, and clears remote session', () => {
    const { result } = renderHook(() => useAdvancedDigitalHumanController());

    act(() => {
      result.current.handleNewSession();
    });

    expect(mocks.setChatInputMock).toHaveBeenCalledWith('');
    expect(mocks.clearRemoteSessionMock).toHaveBeenCalledWith('session_old');
    expect(useChatSessionStore.getState().sessionId).not.toBe('session_old');
    expect(mocks.toastSuccessMock).toHaveBeenCalledWith('已开启新会话');
  });

  it('toggles settings from keyboard shortcuts and ignores input fields', () => {
    const { result, rerender } = renderHook(() => useAdvancedDigitalHumanController());

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
    });

    // Need to rerender to get the updated memoized value
    rerender();

    expect(result.current.showSettings).toBe(true);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    rerender();

    expect(result.current.showSettings).toBe(false);

    const input = document.createElement('input');
    document.body.appendChild(input);

    try {
      act(() => {
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 's', bubbles: true }));
      });

      rerender();

      expect(result.current.showSettings).toBe(false);
    } finally {
      input.remove();
    }
  });

  it('starts recording when idle and stops recording when already recording', () => {
    const { result, rerender } = renderHook(() => useAdvancedDigitalHumanController());

    act(() => {
      result.current.handleToggleRecording();
    });

    expect(mocks.asrStartMock).toHaveBeenCalledTimes(1);
    expect(mocks.toastSuccessMock).toHaveBeenCalledWith('正在聆听...');

    act(() => {
      useDigitalHumanStore.getState().setRecording(true);
    });

    rerender();

    act(() => {
      result.current.handleToggleRecording();
    });

    expect(mocks.asrStopMock).toHaveBeenCalledTimes(1);
    expect(useDigitalHumanStore.getState().isRecording).toBe(false);
    expect(mocks.toastInfoMock).toHaveBeenCalledWith('录音已停止');
  });

  it('clears transient errors after five seconds', () => {
    vi.useFakeTimers();
    useSystemStore.setState({ error: 'temporary error', lastErrorTime: Date.now() });

    renderHook(() => useAdvancedDigitalHumanController());

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(useSystemStore.getState().error).toBeNull();
  });

  it('disposes the avatar engine on unmount', () => {
    const { unmount } = renderHook(() => useAdvancedDigitalHumanController());

    unmount();

    expect(mocks.digitalHumanDisposeMock).toHaveBeenCalledTimes(1);
  });
});
