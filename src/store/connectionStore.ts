// connectionStore — 连接状态/重连管理
// 参考 AIRI 领域分离设计
import { create } from 'zustand';
import type { ConnectionDetails, ConnectionStatus } from './types';

// 有效状态转换表
const VALID_TRANSITIONS: Record<ConnectionStatus, ConnectionStatus[]> = {
  disconnected: ['connecting', 'error'],
  connecting: ['connected', 'error', 'disconnected'],
  connected: ['disconnected', 'error'],
  error: ['connecting', 'disconnected', 'connected'],
};

interface ConnectionState {
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  connectionDetails: ConnectionDetails;
  isLoading: boolean;

  setConnected: (connected: boolean) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setConnectionDetails: (details: Partial<ConnectionDetails>) => void;
  setLoading: (loading: boolean) => void;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  isConnected: true,
  connectionStatus: 'connected',
  connectionDetails: {
    lastConnectedAt: null,
    lastErrorAt: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
  },
  isLoading: false,

  setConnected: (connected) => set({ isConnected: connected }),

  setConnectionStatus: (status) => {
    const currentStatus = get().connectionStatus;
    if (VALID_TRANSITIONS[currentStatus]?.includes(status) || currentStatus === status) {
      set({ connectionStatus: status, isConnected: status === 'connected' });
    } else {
      console.warn(`无效的连接状态转换: ${currentStatus} → ${status}`);
    }
  },

  setConnectionDetails: (details) => set((state) => ({
    connectionDetails: { ...state.connectionDetails, ...details },
  })),

  setLoading: (loading) => set({ isLoading: loading }),
}));
