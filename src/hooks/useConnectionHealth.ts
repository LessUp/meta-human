import { useEffect, useRef, useCallback } from 'react';
import { useDigitalHumanStore } from '../store/digitalHumanStore';
import { checkServerHealth } from '../core/dialogue/dialogueService';
import { toast } from 'sonner';

export function useConnectionHealth() {
  const setConnectionStatus = useDigitalHumanStore((s) => s.setConnectionStatus);
  const lastStatusRef = useRef<string | null>(null);

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

    lastStatusRef.current = nextStatus;
  }, [setConnectionStatus]);

  const reconnect = useCallback(async () => {
    setConnectionStatus('connecting');
    const toastId = toast.loading('正在重新连接...');
    const isHealthy = await checkServerHealth();
    const nextStatus = isHealthy ? 'connected' : 'error';

    setConnectionStatus(nextStatus as any);
    lastStatusRef.current = nextStatus;

    if (isHealthy) {
      toast.success('连接成功', { id: toastId });
    } else {
      toast.error('连接失败，请稍后重试', { id: toastId });
    }
  }, [setConnectionStatus]);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [checkConnection]);

  return { reconnect };
}
