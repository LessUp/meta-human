import { useEffect, useRef, useCallback } from 'react';
import { useSystemStore } from '../store/systemStore';
import type { ConnectionStatus } from '../store/systemStore';
import { checkServerHealth } from '../core/dialogue/dialogueService';
import { resolveChatTransportMode } from '../core/dialogue/chatTransport';
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

  const syncTransportMode = useCallback(
    async (forceProbe = false) => {
      try {
        const mode = await resolveChatTransportMode(undefined, { forceProbe });
        setChatTransportMode(mode);
        return true;
      } catch {
        setError(TRANSPORT_PROBE_FAILURE_MESSAGE);
        return false;
      }
    },
    [setChatTransportMode, setError],
  );

  const checkConnection = useCallback(async () => {
    const startedAt = performance.now();
    const isHealthy = await checkServerHealth();
    const nextStatus = isHealthy ? 'connected' : 'disconnected';
    const previousStatus = lastStatusRef.current;
    const checkedAt = Date.now();
    const latencyMs = Math.max(0, Math.round(performance.now() - startedAt));

    recordConnectionHealth({
      status: nextStatus as ConnectionStatus,
      checkedAt,
      latencyMs,
      degradedReason: isHealthy ? null : DEGRADED_CONNECTION_MESSAGE,
    });

    if (!isHealthy && previousStatus !== 'disconnected') {
      toast.warning(DEGRADED_CONNECTION_MESSAGE);
    }

    if (isHealthy && previousStatus && previousStatus !== 'connected') {
      toast.success('服务器连接已恢复');
    }

    if (isHealthy) {
      clearError();
      void syncTransportMode();
    } else {
      setError(DEGRADED_CONNECTION_MESSAGE);
    }

    lastStatusRef.current = nextStatus;
  }, [clearError, recordConnectionHealth, setError, syncTransportMode]);

  const reconnect = useCallback(async () => {
    setConnectionStatus('connecting');
    const toastId = toast.loading('正在重新连接...');
    const startedAt = performance.now();
    const isHealthy = await checkServerHealth();
    const nextStatus = isHealthy ? 'connected' : 'error';
    const checkedAt = Date.now();
    const latencyMs = Math.max(0, Math.round(performance.now() - startedAt));

    recordConnectionHealth({
      status: nextStatus as ConnectionStatus,
      checkedAt,
      latencyMs,
      degradedReason: isHealthy ? null : RECONNECT_FAILURE_MESSAGE,
    });
    lastStatusRef.current = nextStatus;

    if (isHealthy) {
      clearError();
      const transportSynced = await syncTransportMode(true);

      if (transportSynced) {
        toast.success('连接成功', { id: toastId });
      } else {
        toast.error(TRANSPORT_PROBE_FAILURE_MESSAGE, { id: toastId });
      }
    } else {
      setError(RECONNECT_FAILURE_MESSAGE);
      toast.error(RECONNECT_FAILURE_MESSAGE, { id: toastId });
    }
  }, [clearError, recordConnectionHealth, setConnectionStatus, setError, syncTransportMode]);

  useEffect(() => {
    void checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  return { reconnect };
}
