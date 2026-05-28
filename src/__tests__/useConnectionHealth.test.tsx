import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useConnectionHealth } from '@/hooks/useConnectionHealth';
import { useSystemStore } from '@/store/systemStore';

const mocks = vi.hoisted(() => ({
  checkServerHealthMock: vi.fn(),
  resolveChatTransportModeMock: vi.fn(),
  toastWarningMock: vi.fn(),
  toastSuccessMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastLoadingMock: vi.fn(),
}));

vi.mock('@/core/dialogue/dialogueService', () => ({
  checkServerHealth: (...args: unknown[]) => mocks.checkServerHealthMock(...args),
}));

vi.mock('@/core/dialogue/chatTransport', () => ({
  resolveChatTransportMode: (...args: unknown[]) => mocks.resolveChatTransportModeMock(...args),
}));

vi.mock('sonner', () => ({
  toast: {
    warning: (...args: unknown[]) => mocks.toastWarningMock(...args),
    success: (...args: unknown[]) => mocks.toastSuccessMock(...args),
    error: (...args: unknown[]) => mocks.toastErrorMock(...args),
    loading: (...args: unknown[]) => mocks.toastLoadingMock(...args),
  },
}));

describe('useConnectionHealth', () => {
  beforeEach(() => {
    useSystemStore.getState().resetSystemState();
    mocks.checkServerHealthMock.mockReset();
    mocks.resolveChatTransportModeMock.mockReset();
    mocks.toastWarningMock.mockReset();
    mocks.toastSuccessMock.mockReset();
    mocks.toastErrorMock.mockReset();
    mocks.toastLoadingMock.mockReset();
    mocks.toastLoadingMock.mockReturnValue('toast-1');
  });

  it('degrades periodic checks to disconnected when backend health checks fail', async () => {
    mocks.checkServerHealthMock.mockResolvedValue(false);

    const { unmount } = renderHook(() => useConnectionHealth());

    await waitFor(() => {
      expect(useSystemStore.getState().connectionStatus).toBe('disconnected');
    });

    expect(useSystemStore.getState().error).toBe('服务器连接不稳定，部分功能可能受限');
    expect(mocks.toastWarningMock).toHaveBeenCalledWith('服务器连接不稳定，部分功能可能受限');
    expect(mocks.resolveChatTransportModeMock).not.toHaveBeenCalled();

    unmount();
  });

  it('keeps reconnects connected while surfacing transport probe failures as transport issues', async () => {
    mocks.checkServerHealthMock.mockResolvedValueOnce(true).mockResolvedValueOnce(true);
    mocks.resolveChatTransportModeMock
      .mockResolvedValueOnce('sse')
      .mockRejectedValueOnce(new Error('probe failed'));

    const { result, unmount } = renderHook(() => useConnectionHealth());

    await waitFor(() => {
      expect(useSystemStore.getState().connectionStatus).toBe('connected');
    });

    await act(async () => {
      await result.current.reconnect();
    });

    expect(useSystemStore.getState().connectionStatus).toBe('connected');
    expect(useSystemStore.getState().error).toBe('协议探测失败，已保留当前连接模式');
    expect(mocks.toastLoadingMock).toHaveBeenCalledWith('正在重新连接...');
    expect(mocks.toastErrorMock).toHaveBeenCalledWith('协议探测失败，已保留当前连接模式', {
      id: 'toast-1',
    });
    expect(mocks.resolveChatTransportModeMock).toHaveBeenNthCalledWith(2, undefined, {
      forceProbe: true,
    });

    unmount();
  });
});
