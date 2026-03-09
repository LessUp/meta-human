import { useEffect, useCallback } from 'react';
import { useDigitalHumanStore } from '@/store/digitalHumanStore';
import { checkServerHealth } from '@/core/dialogue/dialogueService';
import { toast } from 'sonner';

/**
 * 服务器连接状态管理 Hook
 * 负责健康检查、自动重连和连接状态指示
 */
export function useConnection() {
  const {
    connectionStatus,
    setConnectionStatus,
  } = useDigitalHumanStore();

  // 初始化连接检查 + 定期轮询
  useEffect(() => {
    const checkConnection = async () => {
      const result = await checkServerHealth();
      setConnectionStatus(result.healthy ? 'connected' : 'disconnected');
      if (!result.healthy) {
        toast.warning('服务器连接不稳定，部分功能可能受限');
      }
    };
    checkConnection();

    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, [setConnectionStatus]);

  // 手动重连
  const handleReconnect = useCallback(async () => {
    setConnectionStatus('connecting');
    toast.loading('正在重新连接...');
    const result = await checkServerHealth();
    setConnectionStatus(result.healthy ? 'connected' : 'error');
    if (result.healthy) {
      toast.success('连接成功');
    } else {
      toast.error('连接失败，请稍后重试');
    }
  }, [setConnectionStatus]);

  return {
    connectionStatus,
    handleReconnect,
  };
}
