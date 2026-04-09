import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// 表情类型定义
export type EmotionType = 'neutral' | 'happy' | 'surprised' | 'sad' | 'angry';
export type ExpressionType = 'neutral' | 'smile' | 'laugh' | 'surprise' | 'sad' | 'angry' | 'blink' | 'eyebrow_raise' | 'eye_blink' | 'mouth_open' | 'head_nod';
export type BehaviorType = 'idle' | 'greeting' | 'listening' | 'thinking' | 'speaking' | 'excited' | 'wave' | 'greet' | 'think' | 'nod' | 'shakeHead' | 'dance' | 'speak' | 'waveHand' | 'raiseHand';
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';
export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: number;
  role: ChatRole;
  text: string;
  timestamp: number;
  isStreaming?: boolean;
}

interface DigitalHumanState {
  // 模型状态
  isPlaying: boolean;
  autoRotate: boolean;
  currentAnimation: string;

  // 语音状态
  isRecording: boolean;
  isMuted: boolean;
  isSpeaking: boolean;

  // 行为状态
  currentEmotion: EmotionType;
  currentExpression: ExpressionType;
  expressionIntensity: number;
  currentBehavior: BehaviorType;

  // 会话状态
  sessionId: string;
  chatHistory: ChatMessage[];

  // 系统状态
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  isLoading: boolean;
  error: string | null;
  lastErrorTime: number | null;

  // 动作
  setPlaying: (playing: boolean) => void;
  setAutoRotate: (rotate: boolean) => void;
  setAnimation: (animation: string) => void;
  setRecording: (recording: boolean) => void;
  setMuted: (muted: boolean) => void;
  setSpeaking: (speaking: boolean) => void;
  setEmotion: (emotion: EmotionType) => void;
  setExpression: (expression: ExpressionType) => void;
  setExpressionIntensity: (intensity: number) => void;
  setBehavior: (behavior: BehaviorType) => void;
  setConnected: (connected: boolean) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // 会话管理
  initSession: () => void;
  addChatMessage: (role: ChatRole, text: string, isStreaming?: boolean) => void;
  updateChatMessage: (id: number, updates: Partial<Pick<ChatMessage, 'text' | 'isStreaming'>>) => void;
  clearChatHistory: () => void;

  // 控制方法
  play: () => void;
  pause: () => void;
  reset: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  toggleMute: () => void;
  toggleAutoRotate: () => void;
}

// 生成唯一会话ID
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

let nextChatMessageId = 0;
let recordingTimeoutId: ReturnType<typeof setTimeout> | null = null;

const ERROR_THROTTLE_MS = 2000;

const generateChatMessageId = (): number => {
  nextChatMessageId += 1;
  return Date.now() + nextChatMessageId;
};

const clearRecordingTimeout = (): void => {
  if (recordingTimeoutId) {
    clearTimeout(recordingTimeoutId);
    recordingTimeoutId = null;
  }
};

const getSafeLocalStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

// 从 localStorage 获取或创建会话ID
const getOrCreateSessionId = (): string => {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return generateSessionId();
  }
  const stored = storage.getItem('metahuman_session_id');
  if (stored) return stored;
  const newId = generateSessionId();
  storage.setItem('metahuman_session_id', newId);
  return newId;
};

export const useDigitalHumanStore = create<DigitalHumanState>()(devtools((set, get) => ({
  // 初始状态
  isPlaying: false,
  autoRotate: false,
  currentAnimation: 'idle',
  isRecording: false,
  isMuted: false,
  isSpeaking: false,
  currentEmotion: 'neutral',
  currentExpression: 'neutral',
  expressionIntensity: 0.8,
  currentBehavior: 'idle',
  sessionId: getOrCreateSessionId(),
  chatHistory: [],
  isConnected: true,
  connectionStatus: 'connected',
  isLoading: false,
  error: null,
  lastErrorTime: null,

  // 状态设置方法
  setPlaying: (playing) => set({ isPlaying: playing }),
  setAutoRotate: (rotate) => set({ autoRotate: rotate }),
  setAnimation: (animation) => set({ currentAnimation: animation }),
  setRecording: (recording) => {
    if (!recording) {
      clearRecordingTimeout();
    }
    set({ isRecording: recording });
  },
  setMuted: (muted) => set({ isMuted: muted }),
  setSpeaking: (speaking) => set({ isSpeaking: speaking }),
  setEmotion: (emotion) => set({ currentEmotion: emotion }),
  setExpression: (expression) => set({ currentExpression: expression }),
  setExpressionIntensity: (intensity) => set({ expressionIntensity: Math.max(0, Math.min(1, intensity)) }),
  setBehavior: (behavior) => set({ currentBehavior: behavior }),
  setConnected: (connected) => set({ isConnected: connected }),
  setConnectionStatus: (status) => set({
    connectionStatus: status,
    isConnected: status === 'connected'
  }),
  setLoading: (loading) => set({ isLoading: loading }),
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

  // 会话管理
  initSession: () => {
    const newId = generateSessionId();
    const storage = getSafeLocalStorage();
    if (storage) {
      storage.setItem('metahuman_session_id', newId);
    }
    set({
      sessionId: newId,
      chatHistory: [],
      error: null,
      lastErrorTime: null,
      connectionStatus: 'connected',
      isConnected: true,
      isLoading: false,
    });
  },

  addChatMessage: (role, text, isStreaming = false) => set((state) => {
    const normalizedText = text.trim();
    if (!normalizedText && !isStreaming) {
      return state;
    }

    const timestamp = Date.now();

    return {
      chatHistory: [
        ...state.chatHistory,
        { id: generateChatMessageId(), role, text: normalizedText, timestamp, isStreaming }
      ]
    };
  }),

  updateChatMessage: (id, updates) => set((state) => ({
    chatHistory: state.chatHistory.map((msg) =>
      msg.id === id ? { ...msg, ...updates } : msg
    ),
  })),

  clearChatHistory: () => set({ chatHistory: [] }),

  // 控制方法
  play: () => {
    set({ isPlaying: true });
  },

  pause: () => {
    set({ isPlaying: false });
  },

  reset: () => {
    set({
      isPlaying: false,
      currentAnimation: 'idle',
      currentEmotion: 'neutral',
      currentExpression: 'neutral',
      expressionIntensity: 0.8,
      currentBehavior: 'idle',
      error: null,
      lastErrorTime: null
    });
  },

  startRecording: () => {
    clearRecordingTimeout();
    set({ isRecording: true });
    recordingTimeoutId = setTimeout(() => {
      if (get().isRecording) {
        get().stopRecording();
      }
      recordingTimeoutId = null;
    }, 30000);
  },

  stopRecording: () => {
    clearRecordingTimeout();
    set({ isRecording: false });
  },

  toggleMute: () => {
    const { isMuted } = get();
    set({ isMuted: !isMuted });
  },

  toggleAutoRotate: () => {
    const { autoRotate } = get();
    set({ autoRotate: !autoRotate });
  }
}), { name: 'digital-human-store', enabled: import.meta.env.DEV }));

// Typed selectors for performance-sensitive components
export const selectIsPlaying = (s: DigitalHumanState) => s.isPlaying;
export const selectCurrentExpression = (s: DigitalHumanState) => s.currentExpression;
export const selectCurrentBehavior = (s: DigitalHumanState) => s.currentBehavior;
export const selectCurrentEmotion = (s: DigitalHumanState) => s.currentEmotion;
export const selectConnectionStatus = (s: DigitalHumanState) => s.connectionStatus;
export const selectChatHistory = (s: DigitalHumanState) => s.chatHistory;
export const selectIsRecording = (s: DigitalHumanState) => s.isRecording;
export const selectIsSpeaking = (s: DigitalHumanState) => s.isSpeaking;
export const selectIsLoading = (s: DigitalHumanState) => s.isLoading;
export const selectError = (s: DigitalHumanState) => s.error;
