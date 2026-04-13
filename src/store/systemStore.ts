import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ChatTransportMode } from '../core/dialogue/chatTransport';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface ChatPerformanceMetrics {
  status: 'idle' | 'pending' | 'completed' | 'failed';
  firstTokenMs: number | null;
  responseCompleteMs: number | null;
  startedAt: number | null;
  completedAt: number | null;
}

interface SystemState {
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  isLoading: boolean;
  error: string | null;
  lastErrorTime: number | null;
  chatTransportMode: Exclude<ChatTransportMode, 'auto'>;
  chatPerformance: ChatPerformanceMetrics;
  setConnected: (connected: boolean) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setChatTransportMode: (mode: Exclude<ChatTransportMode, 'auto'>) => void;
  startChatPerformanceTrace: () => void;
  markChatFirstToken: () => void;
  finalizeChatPerformanceTrace: (status?: 'completed' | 'failed') => void;
  clearError: () => void;
  resetSystemState: () => void;
}

const ERROR_THROTTLE_MS = 2000;
const ENABLE_DEVTOOLS = import.meta.env.DEV && import.meta.env.MODE !== 'test';

export const useSystemStore = create<SystemState>()(
  devtools(
    (set, get) => ({
      isConnected: true,
      connectionStatus: 'connected',
      isLoading: false,
      error: null,
      lastErrorTime: null,
      chatTransportMode: 'sse',
      chatPerformance: {
        status: 'idle',
        firstTokenMs: null,
        responseCompleteMs: null,
        startedAt: null,
        completedAt: null,
      },

      setConnected: (connected) => set({ isConnected: connected }),

      setConnectionStatus: (status) =>
        set({
          connectionStatus: status,
          isConnected: status === 'connected',
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      setChatTransportMode: (chatTransportMode) => set({ chatTransportMode }),

      startChatPerformanceTrace: () =>
        set({
          chatPerformance: {
            status: 'pending',
            firstTokenMs: null,
            responseCompleteMs: null,
            startedAt: performance.now(),
            completedAt: null,
          },
        }),

      markChatFirstToken: () =>
        set((state) => {
          const { chatPerformance } = state;

          if (chatPerformance.startedAt === null || chatPerformance.firstTokenMs !== null) {
            return state;
          }

          return {
            chatPerformance: {
              ...chatPerformance,
              firstTokenMs: Math.max(0, Math.round(performance.now() - chatPerformance.startedAt)),
            },
          };
        }),

      finalizeChatPerformanceTrace: (status = 'completed') =>
        set((state) => {
          const { chatPerformance } = state;

          if (chatPerformance.startedAt === null) {
            return state;
          }

          return {
            chatPerformance: {
              ...chatPerformance,
              status,
              responseCompleteMs: Math.max(
                0,
                Math.round(performance.now() - chatPerformance.startedAt),
              ),
              completedAt: Date.now(),
            },
          };
        }),

      setError: (error) => {
        if (!error) {
          set({ error: null, lastErrorTime: null });
          return;
        }

        const { error: prevError, lastErrorTime } = get();
        const now = Date.now();

        if (prevError === error && lastErrorTime && now - lastErrorTime < ERROR_THROTTLE_MS) {
          return;
        }

        set({ error, lastErrorTime: now });
      },

      clearError: () => set({ error: null, lastErrorTime: null }),

      resetSystemState: () =>
        set({
          error: null,
          lastErrorTime: null,
          connectionStatus: 'connected',
          isConnected: true,
          isLoading: false,
        }),
    }),
    { name: 'system-store', enabled: ENABLE_DEVTOOLS },
  ),
);

export const selectConnectionStatus = (s: SystemState) => s.connectionStatus;
export const selectIsLoading = (s: SystemState) => s.isLoading;
export const selectError = (s: SystemState) => s.error;
