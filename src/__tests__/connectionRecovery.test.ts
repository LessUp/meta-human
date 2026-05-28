import { describe, expect, it, vi } from 'vitest';
import { evaluateConnectionRecovery } from '@/core/dialogue/connectionRecovery';

describe('evaluateConnectionRecovery', () => {
  it('returns connected diagnostics and synced transport when the backend is healthy', async () => {
    const checkServerHealth = vi.fn().mockResolvedValue(true);
    const resolveTransportMode = vi.fn().mockResolvedValue('websocket');
    const performanceNow = vi.fn().mockReturnValueOnce(100).mockReturnValueOnce(132);
    const now = vi.fn().mockReturnValue(1_700_000_000_000);

    await expect(
      evaluateConnectionRecovery(
        {
          unhealthyStatus: 'disconnected',
          unhealthyReason: '服务器连接不稳定，部分功能可能受限',
          transportProbeFailureMessage: '协议探测失败，已保留当前连接模式',
        },
        {
          checkServerHealth,
          resolveTransportMode,
          performanceNow,
          now,
        },
      ),
    ).resolves.toEqual({
      status: 'connected',
      checkedAt: 1_700_000_000_000,
      latencyMs: 32,
      degradedReason: null,
      transportMode: 'websocket',
      transportIssue: null,
    });

    expect(checkServerHealth).toHaveBeenCalledTimes(1);
    expect(resolveTransportMode).toHaveBeenCalledWith({ forceProbe: false });
  });

  it('returns degraded diagnostics without probing transport when the backend is unhealthy', async () => {
    const checkServerHealth = vi.fn().mockResolvedValue(false);
    const resolveTransportMode = vi.fn();
    const performanceNow = vi.fn().mockReturnValueOnce(40).mockReturnValueOnce(46);
    const now = vi.fn().mockReturnValue(1_700_000_000_100);

    await expect(
      evaluateConnectionRecovery(
        {
          unhealthyStatus: 'disconnected',
          unhealthyReason: '服务器连接不稳定，部分功能可能受限',
          transportProbeFailureMessage: '协议探测失败，已保留当前连接模式',
        },
        {
          checkServerHealth,
          resolveTransportMode,
          performanceNow,
          now,
        },
      ),
    ).resolves.toEqual({
      status: 'disconnected',
      checkedAt: 1_700_000_000_100,
      latencyMs: 6,
      degradedReason: '服务器连接不稳定，部分功能可能受限',
      transportMode: null,
      transportIssue: null,
    });

    expect(resolveTransportMode).not.toHaveBeenCalled();
  });

  it('keeps a healthy status and surfaces a transport issue when syncing the transport mode fails', async () => {
    const checkServerHealth = vi.fn().mockResolvedValue(true);
    const resolveTransportMode = vi.fn().mockRejectedValue(new Error('probe failed'));
    const performanceNow = vi.fn().mockReturnValueOnce(10).mockReturnValueOnce(24);
    const now = vi.fn().mockReturnValue(1_700_000_000_200);

    await expect(
      evaluateConnectionRecovery(
        {
          unhealthyStatus: 'error',
          unhealthyReason: '连接失败，请稍后重试',
          transportProbeFailureMessage: '协议探测失败，已保留当前连接模式',
          forceTransportProbe: true,
        },
        {
          checkServerHealth,
          resolveTransportMode,
          performanceNow,
          now,
        },
      ),
    ).resolves.toEqual({
      status: 'connected',
      checkedAt: 1_700_000_000_200,
      latencyMs: 14,
      degradedReason: null,
      transportMode: null,
      transportIssue: '协议探测失败，已保留当前连接模式',
    });

    expect(resolveTransportMode).toHaveBeenCalledWith({ forceProbe: true });
  });
});
