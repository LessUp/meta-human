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

export interface RenderPerformanceMetrics {
  /** Current FPS estimate */
  currentFPS: number;
  /** Average FPS over the last sampling period */
  averageFPS: number;
  /** Frame time in milliseconds */
  frameTimeMs: number;
  /** Number of draw calls (if available) */
  drawCalls: number | null;
  /** Number of triangles rendered (if available) */
  triangleCount: number | null;
  /** Timestamp of last metrics update */
  lastUpdatedAt: number;
}

export interface ConnectionDiagnostics {
  /** Timestamp of the latest health probe */
  lastHealthCheckAt: number | null;
  /** Health probe latency in milliseconds */
  lastHealthCheckLatencyMs: number | null;
  /** Timestamp when the runtime last entered a degraded state */
  lastDegradedAt: number | null;
  /** Latest degraded reason surfaced to the operator */
  lastDegradedReason: string | null;
}

export interface ModelLoadMetrics {
  /** URL of the loaded model */
  modelUrl: string | null;
  /** Time taken to load the model in ms */
  loadTimeMs: number | null;
  /** Size of the model in bytes (if available) */
  modelSizeBytes: number | null;
  /** Whether the model was loaded from cache */
  fromCache: boolean;
  /** Error message if loading failed */
  error: string | null;
  /** Timestamp when load started */
  startedAt: number | null;
  /** Timestamp when load completed */
  completedAt: number | null;
}

interface SystemState {
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  isLoading: boolean;
  error: string | null;
  lastErrorTime: number | null;
  chatTransportMode: Exclude<ChatTransportMode, 'auto'>;
  connectionDiagnostics: ConnectionDiagnostics;
  chatPerformance: ChatPerformanceMetrics;
  renderPerformance: RenderPerformanceMetrics;
  modelLoadMetrics: ModelLoadMetrics;
  setConnected: (connected: boolean) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setChatTransportMode: (mode: Exclude<ChatTransportMode, 'auto'>) => void;
  recordConnectionHealth: (input: {
    status: ConnectionStatus;
    checkedAt?: number;
    latencyMs?: number | null;
    degradedReason?: string | null;
  }) => void;
  startChatPerformanceTrace: () => void;
  markChatFirstToken: () => void;
  finalizeChatPerformanceTrace: (status?: 'completed' | 'failed') => void;
  // Render performance tracking
  updateRenderPerformance: (metrics: Partial<RenderPerformanceMetrics>) => void;
  // Model load tracking
  startModelLoad: (modelUrl: string) => void;
  completeModelLoad: (loadTimeMs: number, modelSizeBytes?: number) => void;
  failModelLoad: (error: string) => void;
  clearError: () => void;
  resetSystemState: () => void;
}

const ERROR_THROTTLE_MS = 2000;
const ENABLE_DEVTOOLS = import.meta.env.DEV && import.meta.env.MODE !== 'test';

const createInitialConnectionDiagnostics = (): ConnectionDiagnostics => ({
  lastHealthCheckAt: null,
  lastHealthCheckLatencyMs: null,
  lastDegradedAt: null,
  lastDegradedReason: null,
});

const createInitialRenderPerformance = (): RenderPerformanceMetrics => ({
  currentFPS: 0,
  averageFPS: 0,
  frameTimeMs: 0,
  drawCalls: null,
  triangleCount: null,
  lastUpdatedAt: 0,
});

const createInitialModelLoadMetrics = (): ModelLoadMetrics => ({
  modelUrl: null,
  loadTimeMs: null,
  modelSizeBytes: null,
  fromCache: false,
  error: null,
  startedAt: null,
  completedAt: null,
});

const createInitialChatPerformance = (): ChatPerformanceMetrics => ({
  status: 'idle',
  firstTokenMs: null,
  responseCompleteMs: null,
  startedAt: null,
  completedAt: null,
});

export const useSystemStore = create<SystemState>()(
  devtools(
    (set, get) => ({
      isConnected: true,
      connectionStatus: 'connected',
      isLoading: false,
      error: null,
      lastErrorTime: null,
      chatTransportMode: 'sse',
      connectionDiagnostics: createInitialConnectionDiagnostics(),
      chatPerformance: createInitialChatPerformance(),
      renderPerformance: createInitialRenderPerformance(),
      modelLoadMetrics: createInitialModelLoadMetrics(),

      setConnected: (connected) => set({ isConnected: connected }),

      setConnectionStatus: (status) =>
        set({
          connectionStatus: status,
          isConnected: status === 'connected',
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      setChatTransportMode: (chatTransportMode) => set({ chatTransportMode }),

      recordConnectionHealth: ({ status, checkedAt = Date.now(), latencyMs = null, degradedReason }) =>
        set((state) => {
          const isDegraded = status === 'disconnected' || status === 'error';

          return {
            connectionStatus: status,
            isConnected: status === 'connected',
            connectionDiagnostics: {
              lastHealthCheckAt: checkedAt,
              lastHealthCheckLatencyMs: latencyMs,
              lastDegradedAt: isDegraded
                ? checkedAt
                : state.connectionDiagnostics.lastDegradedAt,
              lastDegradedReason: isDegraded
                ? degradedReason ?? state.connectionDiagnostics.lastDegradedReason
                : state.connectionDiagnostics.lastDegradedReason,
            },
          };
        }),

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

      updateRenderPerformance: (metrics) =>
        set((state) => ({
          renderPerformance: {
            ...state.renderPerformance,
            ...metrics,
            lastUpdatedAt: Date.now(),
          },
        })),

      startModelLoad: (modelUrl) =>
        set({
          modelLoadMetrics: {
            modelUrl,
            loadTimeMs: null,
            modelSizeBytes: null,
            fromCache: false,
            error: null,
            startedAt: Date.now(),
            completedAt: null,
          },
        }),

      completeModelLoad: (loadTimeMs, modelSizeBytes) =>
        set((state) => ({
          modelLoadMetrics: {
            ...state.modelLoadMetrics,
            loadTimeMs,
            modelSizeBytes: modelSizeBytes ?? null,
            fromCache: false,
            completedAt: Date.now(),
          },
        })),

      failModelLoad: (error) =>
        set((state) => ({
          modelLoadMetrics: {
            ...state.modelLoadMetrics,
            error,
            completedAt: Date.now(),
          },
        })),

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
          chatTransportMode: 'sse',
          connectionDiagnostics: createInitialConnectionDiagnostics(),
          chatPerformance: createInitialChatPerformance(),
          renderPerformance: createInitialRenderPerformance(),
          modelLoadMetrics: createInitialModelLoadMetrics(),
        }),
    }),
    { name: 'system-store', enabled: ENABLE_DEVTOOLS },
  ),
);

export const selectConnectionStatus = (s: SystemState) => s.connectionStatus;
export const selectConnectionDiagnostics = (s: SystemState) => s.connectionDiagnostics;
export const selectIsLoading = (s: SystemState) => s.isLoading;
export const selectError = (s: SystemState) => s.error;
export const selectChatPerformance = (s: SystemState) => s.chatPerformance;
export const selectRenderPerformance = (s: SystemState) => s.renderPerformance;
export const selectModelLoadMetrics = (s: SystemState) => s.modelLoadMetrics;
