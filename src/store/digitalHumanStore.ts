// digitalHumanStore — 统一 Facade（向后兼容）
// 参考 AIRI 项目的领域分离架构，将单体 store 拆分为独立领域子 store
// 本文件作为组合入口，让现有代码无需修改即可继续使用
//
// 领域子 store（推荐在新代码中直接使用）：
//   - avatarStore     → 模型/动画/表情/行为/情绪
//   - voiceStore      → 录音/静音/语音合成
//   - chatStore       → 会话管理/聊天历史
//   - connectionStore → 连接状态/重连
//   - errorStore      → 错误队列/自动清除
//   - performanceStore→ FPS/性能指标
//
import { create } from "zustand";

// 重新导出类型（保持向后兼容）
export type {
  EmotionType,
  ExpressionType,
  BehaviorType,
  ConnectionStatus,
  AvatarType,
  ErrorItem,
  ConnectionDetails,
  PerformanceMetrics,
  ChatMessage,
} from "./types";
import type {
  EmotionType,
  ExpressionType,
  BehaviorType,
  ConnectionStatus,
  AvatarType,
  ConnectionDetails,
  PerformanceMetrics,
  ChatMessage,
  ErrorItem,
} from "./types";

// 导入领域子 store
import { useAvatarStore } from "./avatarStore";
import { useVoiceStore } from "./voiceStore";
import { useChatStore } from "./chatStore";
import { useConnectionStore } from "./connectionStore";
import { useErrorStore } from "./errorStore";
import { usePerformanceStore } from "./performanceStore";

// ============================================================
// 统一状态接口（向后兼容）
// ============================================================

interface DigitalHumanState {
  // 模型状态（委托 → avatarStore）
  isPlaying: boolean;
  autoRotate: boolean;
  currentAnimation: string;
  avatarType: AvatarType;
  vrmModelUrl: string | null;
  currentEmotion: EmotionType;
  currentExpression: ExpressionType;
  expressionIntensity: number;
  currentBehavior: BehaviorType;

  // 语音状态（委托 → voiceStore）
  isRecording: boolean;
  isMuted: boolean;
  isSpeaking: boolean;

  // 会话状态（委托 → chatStore）
  sessionId: string;
  chatHistory: ChatMessage[];
  maxChatHistoryLength: number;

  // 系统状态（委托 → connectionStore）
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  connectionDetails: ConnectionDetails;
  isLoading: boolean;

  // 错误管理（委托 → errorStore）
  error: string | null;
  lastErrorTime: number | null;
  errorQueue: ErrorItem[];
  maxErrorQueueLength: number;

  // 性能指标（委托 → performanceStore）
  performanceMetrics: PerformanceMetrics;

  // 动作（委托到各子 store）
  setPlaying: (playing: boolean) => void;
  setAutoRotate: (rotate: boolean) => void;
  setAnimation: (animation: string) => void;
  setAvatarType: (type: AvatarType) => void;
  setVrmModelUrl: (url: string | null) => void;
  setRecording: (recording: boolean) => void;
  setMuted: (muted: boolean) => void;
  setSpeaking: (speaking: boolean) => void;
  setEmotion: (emotion: EmotionType) => void;
  setExpression: (expression: ExpressionType) => void;
  setExpressionIntensity: (intensity: number) => void;
  setBehavior: (behavior: BehaviorType) => void;
  setConnected: (connected: boolean) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setConnectionDetails: (details: Partial<ConnectionDetails>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  addError: (
    message: string,
    severity?: "info" | "warning" | "error",
    autoHideMs?: number,
  ) => void;
  dismissError: (errorId: string) => void;
  clearAllErrors: () => void;
  initSession: () => void;
  addChatMessage: (role: "user" | "assistant", text: string) => void;
  clearChatHistory: () => void;
  updatePerformanceMetrics: (metrics: Partial<PerformanceMetrics>) => void;
  play: () => void;
  pause: () => void;
  reset: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  toggleMute: () => void;
  toggleAutoRotate: () => void;
}

// ============================================================
// 统一 Facade Store
// 内部订阅所有子 store，聚合状态并委托动作
// ============================================================

export const useDigitalHumanStore = create<DigitalHumanState>(() => {
  // 获取各子 store 的当前快照
  const avatar = useAvatarStore.getState();
  const voice = useVoiceStore.getState();
  const chat = useChatStore.getState();
  const connection = useConnectionStore.getState();
  const error = useErrorStore.getState();
  const perf = usePerformanceStore.getState();

  return {
    // ---- 聚合状态 ----
    // avatarStore
    isPlaying: avatar.isPlaying,
    autoRotate: avatar.autoRotate,
    currentAnimation: avatar.currentAnimation,
    avatarType: avatar.avatarType,
    vrmModelUrl: avatar.vrmModelUrl,
    currentEmotion: avatar.currentEmotion,
    currentExpression: avatar.currentExpression,
    expressionIntensity: avatar.expressionIntensity,
    currentBehavior: avatar.currentBehavior,
    // voiceStore
    isRecording: voice.isRecording,
    isMuted: voice.isMuted,
    isSpeaking: voice.isSpeaking,
    // chatStore
    sessionId: chat.sessionId,
    chatHistory: chat.chatHistory,
    maxChatHistoryLength: chat.maxChatHistoryLength,
    // connectionStore
    isConnected: connection.isConnected,
    connectionStatus: connection.connectionStatus,
    connectionDetails: connection.connectionDetails,
    isLoading: connection.isLoading,
    // errorStore
    error: error.error,
    lastErrorTime: error.lastErrorTime,
    errorQueue: error.errorQueue,
    maxErrorQueueLength: error.maxErrorQueueLength,
    // performanceStore
    performanceMetrics: perf.performanceMetrics,

    // ---- 委托动作到子 store ----
    // avatarStore
    setPlaying: (p) => useAvatarStore.getState().setPlaying(p),
    setAutoRotate: (r) => useAvatarStore.getState().setAutoRotate(r),
    setAnimation: (a) => useAvatarStore.getState().setAnimation(a),
    setAvatarType: (t) => useAvatarStore.getState().setAvatarType(t),
    setVrmModelUrl: (u) => useAvatarStore.getState().setVrmModelUrl(u),
    setEmotion: (e) => useAvatarStore.getState().setEmotion(e),
    setExpression: (e) => useAvatarStore.getState().setExpression(e),
    setExpressionIntensity: (i) =>
      useAvatarStore.getState().setExpressionIntensity(i),
    setBehavior: (b) => useAvatarStore.getState().setBehavior(b),
    play: () => useAvatarStore.getState().play(),
    pause: () => useAvatarStore.getState().pause(),
    toggleAutoRotate: () => useAvatarStore.getState().toggleAutoRotate(),
    reset: () => {
      useAvatarStore.getState().reset();
      useErrorStore.getState().clearError();
    },
    // voiceStore
    setRecording: (r) => useVoiceStore.getState().setRecording(r),
    setMuted: (m) => useVoiceStore.getState().setMuted(m),
    setSpeaking: (s) => useVoiceStore.getState().setSpeaking(s),
    startRecording: () => useVoiceStore.getState().startRecording(),
    stopRecording: () => useVoiceStore.getState().stopRecording(),
    toggleMute: () => useVoiceStore.getState().toggleMute(),
    // chatStore
    initSession: () => useChatStore.getState().initSession(),
    addChatMessage: (r, t) => useChatStore.getState().addChatMessage(r, t),
    clearChatHistory: () => useChatStore.getState().clearChatHistory(),
    // connectionStore
    setConnected: (c) => useConnectionStore.getState().setConnected(c),
    setConnectionStatus: (s) =>
      useConnectionStore.getState().setConnectionStatus(s),
    setConnectionDetails: (d) =>
      useConnectionStore.getState().setConnectionDetails(d),
    setLoading: (l) => useConnectionStore.getState().setLoading(l),
    // errorStore
    setError: (e) => useErrorStore.getState().setError(e),
    clearError: () => useErrorStore.getState().clearError(),
    addError: (m, s, a) => useErrorStore.getState().addError(m, s, a),
    dismissError: (id) => useErrorStore.getState().dismissError(id),
    clearAllErrors: () => useErrorStore.getState().clearAllErrors(),
    // performanceStore
    updatePerformanceMetrics: (m) =>
      usePerformanceStore.getState().updatePerformanceMetrics(m),
  };
});

// ============================================================
// 子 store → facade 状态同步
// 当任意子 store 变化时，自动同步到 facade
// ============================================================

useAvatarStore.subscribe((s) => {
  useDigitalHumanStore.setState({
    isPlaying: s.isPlaying,
    autoRotate: s.autoRotate,
    currentAnimation: s.currentAnimation,
    avatarType: s.avatarType,
    vrmModelUrl: s.vrmModelUrl,
    currentEmotion: s.currentEmotion,
    currentExpression: s.currentExpression,
    expressionIntensity: s.expressionIntensity,
    currentBehavior: s.currentBehavior,
  });
});

useVoiceStore.subscribe((s) => {
  useDigitalHumanStore.setState({
    isRecording: s.isRecording,
    isMuted: s.isMuted,
    isSpeaking: s.isSpeaking,
  });
});

useChatStore.subscribe((s) => {
  useDigitalHumanStore.setState({
    sessionId: s.sessionId,
    chatHistory: s.chatHistory,
    maxChatHistoryLength: s.maxChatHistoryLength,
  });
});

useConnectionStore.subscribe((s) => {
  useDigitalHumanStore.setState({
    isConnected: s.isConnected,
    connectionStatus: s.connectionStatus,
    connectionDetails: s.connectionDetails,
    isLoading: s.isLoading,
  });
});

useErrorStore.subscribe((s) => {
  useDigitalHumanStore.setState({
    error: s.error,
    lastErrorTime: s.lastErrorTime,
    errorQueue: s.errorQueue,
    maxErrorQueueLength: s.maxErrorQueueLength,
  });
});

usePerformanceStore.subscribe((s) => {
  useDigitalHumanStore.setState({
    performanceMetrics: s.performanceMetrics,
  });
});
