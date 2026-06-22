import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ChatTransportMode } from '../core/dialogue/chatTransport';
import {
  createIdleDialogueTurnSnapshot,
  type DialogueTurnSnapshot,
} from '../core/dialogue/dialogueTurnLifecycle';

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';
export type ImmersiveMode = 'standard' | 'entering-ar' | 'ar-active';

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
  /** Currently active dialogue service endpoint */
  activeEndpoint: string | null;
  /** Number of successful failovers during this runtime */
  failoverCount: number;
  /** Timestamp of the latest failover */
  lastFailoverAt: number | null;
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

export interface RuntimeApiConfig {
  baseUrl: string;
  fallbacks: string;
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
  dialogueTurn: DialogueTurnSnapshot;
  renderPerformance: RenderPerformanceMetrics;
  modelLoadMetrics: ModelLoadMetrics;
  immersiveMode: ImmersiveMode;
  immersiveSession: XRSession | null;
  immersiveError: string | null;
  runtimeApiConfig: RuntimeApiConfig | null;
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
  recordEndpointRouting: (input: {
    activeEndpoint: string;
    didFailover?: boolean;
    recordedAt?: number;
  }) => void;
  startChatPerformanceTrace: () => void;
  markChatFirstToken: () => void;
  finalizeChatPerformanceTrace: (status?: 'completed' | 'failed') => void;
  setDialogueTurn: (snapshot: DialogueTurnSnapshot) => void;
  // Render performance tracking
  updateRenderPerformance: (metrics: Partial<RenderPerformanceMetrics>) => void;
  // Model load tracking
  startModelLoad: (modelUrl: string) => void;
  completeModelLoad: (loadTimeMs: number, modelSizeBytes?: number) => void;
  failModelLoad: (error: string) => void;
  startImmersiveAr: () => void;
  setImmersiveSession: (session: XRSession) => void;
  clearImmersiveSession: (error?: string | null) => void;
  clearError: () => void;
  setRuntimeApiConfig: (config: RuntimeApiConfig | null) => void;
  resetSystemState: () => void;
}

const ERROR_THROTTLE_MS = 2000;
const ENABLE_DEVTOOLS = import.meta.env.DEV && import.meta.env.MODE !== 'test';
const RUNTIME_API_CONFIG_KEY = 'metahuman_runtime_api_config';

function loadRuntimeApiConfig(): RuntimeApiConfig | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(RUNTIME_API_CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RuntimeApiConfig>;
    if (typeof parsed?.baseUrl === 'string' && parsed.baseUrl.trim()) {
      return { baseUrl: parsed.baseUrl.trim(), fallbacks: parsed.fallbacks ?? '' };
    }
  } catch {
    // ignore malformed storage
  }
  return null;
}

function persistRuntimeApiConfig(config: RuntimeApiConfig | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (config) {
      window.localStorage.setItem(RUNTIME_API_CONFIG_KEY, JSON.stringify(config));
    } else {
      window.localStorage.removeItem(RUNTIME_API_CONFIG_KEY);
    }
  } catch {
    // ignore quota / privacy mode errors
  }
}

const createInitialConnectionDiagnostics = (): ConnectionDiagnostics => ({
  lastHealthCheckAt: null,
  lastHealthCheckLatencyMs: null,
  lastDegradedAt: null,
  lastDegradedReason: null,
  activeEndpoint: null,
  failoverCount: 0,
  lastFailoverAt: null,
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
      dialogueTurn: createIdleDialogueTurnSnapshot(),
      renderPerformance: createInitialRenderPerformance(),
      modelLoadMetrics: createInitialModelLoadMetrics(),
      immersiveMode: 'standard',
      immersiveSession: null,
      immersiveError: null,
      runtimeApiConfig: loadRuntimeApiConfig(),

      setConnected: (connected) => set({ isConnected: connected }),

      setConnectionStatus: (status) =>
        set({
          connectionStatus: status,
          isConnected: status === 'connected',
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      setChatTransportMode: (chatTransportMode) => set({ chatTransportMode }),

      recordConnectionHealth: ({
        status,
        checkedAt = Date.now(),
        latencyMs = null,
        degradedReason,
      }) =>
        set((state) => {
          const isDegraded = status === 'disconnected' || status === 'error';

          return {
            connectionStatus: status,
            isConnected: status === 'connected',
            connectionDiagnostics: {
              ...state.connectionDiagnostics,
              lastHealthCheckAt: checkedAt,
              lastHealthCheckLatencyMs: latencyMs,
              lastDegradedAt: isDegraded ? checkedAt : state.connectionDiagnostics.lastDegradedAt,
              lastDegradedReason: isDegraded
                ? (degradedReason ?? state.connectionDiagnostics.lastDegradedReason)
                : state.connectionDiagnostics.lastDegradedReason,
            },
          };
        }),

      recordEndpointRouting: ({ activeEndpoint, didFailover = false, recordedAt = Date.now() }) =>
        set((state) => ({
          connectionDiagnostics: {
            ...state.connectionDiagnostics,
            activeEndpoint,
            failoverCount: didFailover
              ? state.connectionDiagnostics.failoverCount + 1
              : state.connectionDiagnostics.failoverCount,
            lastFailoverAt: didFailover ? recordedAt : state.connectionDiagnostics.lastFailoverAt,
          },
        })),

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

      setDialogueTurn: (dialogueTurn) => set({ dialogueTurn }),

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

      startImmersiveAr: () =>
        set({
          immersiveMode: 'entering-ar',
          immersiveError: null,
        }),

      setImmersiveSession: (immersiveSession) =>
        set({
          immersiveMode: 'ar-active',
          immersiveSession,
          immersiveError: null,
        }),

      clearImmersiveSession: (immersiveError = null) =>
        set({
          immersiveMode: 'standard',
          immersiveSession: null,
          immersiveError,
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

      setRuntimeApiConfig: (config) => {
        persistRuntimeApiConfig(config);
        set({ runtimeApiConfig: config });
      },

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
          dialogueTurn: createIdleDialogueTurnSnapshot(),
          renderPerformance: createInitialRenderPerformance(),
          modelLoadMetrics: createInitialModelLoadMetrics(),
          immersiveMode: 'standard',
          immersiveSession: null,
          immersiveError: null,
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
export const selectDialogueTurn = (s: SystemState) => s.dialogueTurn;
export const selectRenderPerformance = (s: SystemState) => s.renderPerformance;
export const selectModelLoadMetrics = (s: SystemState) => s.modelLoadMetrics;
