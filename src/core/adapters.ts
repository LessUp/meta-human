/**
 * 集中式 Adapter 定义。
 *
 * 所有服务层与状态层的适配器接口和工厂函数。
 * 提供清晰的依赖视图，便于测试 mock。
 */

import { useChatSessionStore } from '../store/chatSessionStore';
import {
  useDigitalHumanStore,
  type EmotionType,
  type ExpressionType,
  type BehaviorType,
} from '../store/digitalHumanStore';
import { useSystemStore } from '../store/systemStore';

// ============================================================================
// TTS Callbacks
// ============================================================================

/**
 * TTS 状态变化回调。
 * 解耦 TTSService 与任何特定 store。
 */
export interface TTSCallbacks {
  onSpeakStart?: () => void;
  onSpeakEnd?: () => void;
  onError?: (message: string) => void;
}

// ============================================================================
// ASR State Adapter
// ============================================================================

/**
 * ASRService 状态访问器。
 * 解耦 ASRService 与任何特定 store。
 */
export interface ASRStateAdapter {
  // 状态设置
  setRecording(recording: boolean): void;
  setBehavior(behavior: string): void;
  setSpeaking(speaking: boolean): void;
  setError(message: string): void;
  setEmotion(emotion: string): void;
  setExpression(expression: string): void;
  setAnimation(animation: string): void;

  // 播放控制
  play(): void;
  pause(): void;
  reset(): void;
  setMuted(muted: boolean): void;

  // 状态读取
  /** 当前是否静音（用于对话发送） */
  isMuted: boolean;
  /** 当前会话 ID（用于对话发送） */
  sessionId: string;
  /** 当前行为（用于思考重置检查） */
  currentBehavior: string;

  // 聊天消息操作（用于语音发起的对话轮次）
  addChatMessage?: (
    role: 'user' | 'assistant',
    text: string,
    isStreaming?: boolean,
  ) => number | null;
  updateChatMessage?: (
    id: number,
    updates: Partial<{ text: string; isStreaming: boolean }>,
  ) => void;
}

// ============================================================================
// Engine State Adapter
// ============================================================================

/**
 * DigitalHumanEngine 状态适配器。
 * 解耦引擎与任何特定状态管理库。
 */
export interface EngineStateAdapter {
  play(): void;
  pause(): void;
  reset(): void;
  setExpression(expr: ExpressionType): void;
  setExpressionIntensity(intensity: number): void;
  setEmotion(emo: EmotionType): void;
  setBehavior(beh: BehaviorType): void;
  setAnimation(anim: string): void;
  setPlaying(playing: boolean): void;
}

// ============================================================================
// Adapter Factory
// ============================================================================

/**
 * 创建 TTS 回调适配器。
 */
export function createTTSCallbacks(): TTSCallbacks {
  return {
    onSpeakStart: () => {
      useDigitalHumanStore.getState().setSpeaking(true);
      useDigitalHumanStore.getState().setBehavior('speaking');
    },
    onSpeakEnd: () => {
      useDigitalHumanStore.getState().setSpeaking(false);
      useDigitalHumanStore.getState().setBehavior('idle');
    },
    onError: (msg) => {
      useSystemStore.getState().setError(msg);
    },
  };
}

/**
 * 创建 ASR 状态适配器。
 */
export function createASRStateAdapter(): ASRStateAdapter {
  return {
    get isMuted() {
      return useDigitalHumanStore.getState().isMuted;
    },
    get sessionId() {
      return useChatSessionStore.getState().sessionId;
    },
    get currentBehavior() {
      return useDigitalHumanStore.getState().currentBehavior;
    },
    setRecording: (r) => useDigitalHumanStore.getState().setRecording(r),
    setBehavior: (b) => useDigitalHumanStore.getState().setBehavior(b as BehaviorType),
    setSpeaking: (s) => useDigitalHumanStore.getState().setSpeaking(s),
    setError: (m) => useSystemStore.getState().setError(m),
    setEmotion: (e) => useDigitalHumanStore.getState().setEmotion(e as EmotionType),
    setExpression: (x) => useDigitalHumanStore.getState().setExpression(x as ExpressionType),
    setAnimation: (a) => useDigitalHumanStore.getState().setAnimation(a),
    play: () => useDigitalHumanStore.getState().play(),
    pause: () => useDigitalHumanStore.getState().pause(),
    reset: () => useDigitalHumanStore.getState().reset(),
    setMuted: (m) => useDigitalHumanStore.getState().setMuted(m),
    addChatMessage: (role, text, isStreaming) =>
      useChatSessionStore.getState().addChatMessage(role, text, isStreaming),
    updateChatMessage: (id, updates) =>
      useChatSessionStore.getState().updateChatMessage(id, updates),
  };
}

/**
 * 创建 Engine 状态适配器。
 */
export function createEngineStateAdapter(): EngineStateAdapter {
  return {
    play: () => useDigitalHumanStore.getState().play(),
    pause: () => useDigitalHumanStore.getState().pause(),
    reset: () => useDigitalHumanStore.getState().reset(),
    setExpression: (expr) => useDigitalHumanStore.getState().setExpression(expr),
    setExpressionIntensity: (n) => useDigitalHumanStore.getState().setExpressionIntensity(n),
    setEmotion: (emo) => useDigitalHumanStore.getState().setEmotion(emo),
    setBehavior: (beh) => useDigitalHumanStore.getState().setBehavior(beh),
    setAnimation: (anim) => useDigitalHumanStore.getState().setAnimation(anim),
    setPlaying: (p) => useDigitalHumanStore.getState().setPlaying(p),
  };
}
