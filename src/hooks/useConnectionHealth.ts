import { useEffect, useRef, useCallback } from 'react';
import { useSystemStore } from '../store/systemStore';
import { checkServerHealth } from '../core/dialogue/dialogueService';
import { resolveChatTransportMode } from '../core/dialogue/chatTransport';
import { toast } from 'sonner';

export function useConnectionHealth() {
  const setConnectionStatus = useSystemStore((s) => s.setConnectionStatus);
  const setChatTransportMode = useSystemStore((s) => s.setChatTransportMode);
  const lastStatusRef = useRef<string | null>(null);

  const syncTransportMode = useCallback(
    async (forceProbe = false) => {
      const mode = await resolveChatTransportMode(undefined, { forceProbe });
      setChatTransportMode(mode);
    },
    [setChatTransportMode],
  );

  const checkConnection = useCallback(async () => {
    const isHealthy = await checkServerHealth();
    const nextStatus = isHealthy ? 'connected' : 'disconnected';
    const previousStatus = lastStatusRef.current;

    setConnectionStatus(nextStatus as any);

    if (!isHealthy && previousStatus !== 'disconnected') {
      toast.warning('服务器连接不稳定，部分功能可能受限');
    }

    if (isHealthy && previousStatus && previousStatus !== 'connected') {
      toast.success('服务器连接已恢复');
    }

    if (isHealthy) {
      void syncTransportMode();
    }

    lastStatusRef.current = nextStatus;
  }, [setConnectionStatus, syncTransportMode]);

  const reconnect = useCallback(async () => {
    setConnectionStatus('connecting');
    const toastId = toast.loading('正在重新连接...');
    const isHealthy = await checkServerHealth();
    const nextStatus = isHealthy ? 'connected' : 'error';

    setConnectionStatus(nextStatus as any);
    lastStatusRef.current = nextStatus;

    if (isHealthy) {
      await syncTransportMode(true);
      toast.success('连接成功', { id: toastId });
    } else {
      toast.error('连接失败，请稍后重试', { id: toastId });
    }
  }, [setConnectionStatus, syncTransportMode]);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  return { reconnect };
}
