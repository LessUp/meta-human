import { renderHook, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSessionManager } from '@/hooks/useSessionManager';
import { useChatSessionStore } from '@/store/chatSessionStore';
import { useSystemStore } from '@/store/systemStore';

const abortPendingTurnMock = vi.fn();
const clearRemoteSessionMock = vi.fn();
const toastSuccessMock = vi.fn();
const moduleAbortPendingTurnMock = vi.fn(() => {
  throw new Error('useSessionManager should use useDialogue().abortPendingTurn');
});

vi.mock('@/core/services', () => ({
  useDialogue: () => ({
    abortPendingTurn: () => abortPendingTurnMock(),
  }),
}));

vi.mock('@/core/dialogue/dialogueOrchestrator', () => ({
  abortPendingTurn: () => moduleAbortPendingTurnMock(),
}));

vi.mock('@/core/dialogue/dialogueService', () => ({
  clearRemoteSession: (...args: unknown[]) => clearRemoteSessionMock(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
  },
}));

describe('useSessionManager', () => {
  beforeEach(() => {
    abortPendingTurnMock.mockReset();
    clearRemoteSessionMock.mockReset();
    toastSuccessMock.mockReset();
    moduleAbortPendingTurnMock.mockClear();

    useChatSessionStore.setState({
      sessionId: 'session_old',
      chatHistory: [],
    });
    useSystemStore.getState().resetSystemState();
  });

  it('aborts provider dialogue before starting a new session', async () => {
    const { result } = renderHook(() => useSessionManager());

    await act(async () => {
      result.current.handleNewSession();
      await Promise.resolve();
    });

    expect(abortPendingTurnMock).toHaveBeenCalledTimes(1);
    expect(clearRemoteSessionMock).toHaveBeenCalledWith('session_old');
    expect(toastSuccessMock).toHaveBeenCalledWith('已开启新会话');
  });
});
