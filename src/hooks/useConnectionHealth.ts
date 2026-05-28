import { useEffect, useRef, useCallback } from 'react';
import { useSystemStore } from '../store/systemStore';
import type { ConnectionStatus } from '../store/systemStore';
import { checkServerHealth } from '../core/dialogue/dialogueService';
import { resolveChatTransportMode } from '../core/dialogue/chatTransport';
import { evaluateConnectionRecovery } from '../core/dialogue/connectionRecovery';
import { toast } from 'sonner';

const DEGRADED_CONNECTION_MESSAGE = '服务器连接不稳定，部分功能可能受限';
const RECONNECT_FAILURE_MESSAGE = '连接失败，请稍后重试';
const TRANSPORT_PROBE_FAILURE_MESSAGE = '协议探测失败，已保留当前连接模式';

export function useConnectionHealth() {
  const setConnectionStatus = useSystemStore((s) => s.setConnectionStatus);
  const setChatTransportMode = useSystemStore((s) => s.setChatTransportMode);
  const recordConnectionHealth = useSystemStore((s) => s.recordConnectionHealth);
  const setError = useSystemStore((s) => s.setError);
  const clearError = useSystemStore((s) => s.clearError);
  const lastStatusRef = useRef<string | null>(null);

  const runRecovery = useCallback(
    (options: {
      unhealthyStatus: Extract<ConnectionStatus, 'disconnected' | 'error'>;
      unhealthyReason: string;
      forceTransportProbe?: boolean;
    }) =>
      evaluateConnectionRecovery(
        {
          ...options,
          transportProbeFailureMessage: TRANSPORT_PROBE_FAILURE_MESSAGE,
        },
        {
          checkServerHealth,
          resolveTransportMode: ({ forceProbe }) =>
            resolveChatTransportMode(undefined, { forceProbe }),
        },
      ),
    [],
  );

  const applyRecovery = useCallback(
    (result: {
      status: ConnectionStatus;
      checkedAt: number;
      latencyMs: number;
      degradedReason: string | null;
      transportMode: ReturnType<typeof useSystemStore.getState>['chatTransportMode'] | null;
      transportIssue: string | null;
    }) => {
      recordConnectionHealth({
        status: result.status,
        checkedAt: result.checkedAt,
        latencyMs: result.latencyMs,
        degradedReason: result.degradedReason,
      });

      if (result.transportMode) {
        setChatTransportMode(result.transportMode);
      }

      if (result.status === 'connected') {
        if (result.transportIssue) {
          setError(result.transportIssue);
        } else {
          clearError();
        }
      } else {
        setError(result.degradedReason);
      }

      lastStatusRef.current = result.status;
      return result;
    },
    [clearError, recordConnectionHealth, setChatTransportMode, setError],
  );

  const checkConnection = useCallback(async () => {
    const previousStatus = lastStatusRef.current;
    const result = applyRecovery(
      await runRecovery({
        unhealthyStatus: 'disconnected',
        unhealthyReason: DEGRADED_CONNECTION_MESSAGE,
      }),
    );

    if (result.status === 'disconnected' && previousStatus !== 'disconnected') {
      toast.warning(DEGRADED_CONNECTION_MESSAGE);
    }

    if (result.status === 'connected' && previousStatus && previousStatus !== 'connected') {
      toast.success('服务器连接已恢复');
    }
  }, [applyRecovery, runRecovery]);

  const reconnect = useCallback(async () => {
    setConnectionStatus('connecting');
    const toastId = toast.loading('正在重新连接...');
    const result = applyRecovery(
      await runRecovery({
        unhealthyStatus: 'error',
        unhealthyReason: RECONNECT_FAILURE_MESSAGE,
        forceTransportProbe: true,
      }),
    );

    if (result.status === 'connected') {
      if (result.transportIssue) {
        toast.error(result.transportIssue, { id: toastId });
      } else {
        toast.success('连接成功', { id: toastId });
      }
    } else {
      toast.error(RECONNECT_FAILURE_MESSAGE, { id: toastId });
    }
  }, [applyRecovery, runRecovery, setConnectionStatus]);

  useEffect(() => {
    void checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  return { reconnect };
}
