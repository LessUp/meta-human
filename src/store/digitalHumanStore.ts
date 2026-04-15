import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useChatSessionStore } from './chatSessionStore';
import { useSystemStore } from './systemStore';

// Named constants
const RECORDING_TIMEOUT_MS = 30000;
const DEFAULT_EXPRESSION_INTENSITY = 0.8;
const ENABLE_DEVTOOLS =
  typeof import.meta !== 'undefined' &&
  import.meta.env?.DEV === true &&
  import.meta.env?.MODE !== 'test';

// 表情类型定义
export type EmotionType = 'neutral' | 'happy' | 'surprised' | 'sad' | 'angry';
export type ExpressionType =
  | 'neutral'
  | 'smile'
  | 'laugh'
  | 'surprise'
  | 'sad'
  | 'angry'
  | 'blink'
  | 'eyebrow_raise'
  | 'eye_blink'
  | 'mouth_open'
  | 'head_nod';
export type BehaviorType =
  | 'idle'
  | 'greeting'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'excited'
  | 'wave'
  | 'greet'
  | 'think'
  | 'nod'
  | 'shakeHead'
  | 'dance'
  | 'speak'
  | 'waveHand'
  | 'raiseHand';

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

  // 会话管理
  initSession: () => void;

  // 控制方法
  play: () => void;
  pause: () => void;
  reset: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  toggleMute: () => void;
  toggleAutoRotate: () => void;
}

let recordingTimeoutId: ReturnType<typeof setTimeout> | null = null;

const clearRecordingTimeout = (): void => {
  if (recordingTimeoutId) {
    clearTimeout(recordingTimeoutId);
    recordingTimeoutId = null;
  }
};

export const useDigitalHumanStore = create<DigitalHumanState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      isPlaying: false,
      autoRotate: false,
      currentAnimation: 'idle',
      isRecording: false,
      isMuted: false,
      isSpeaking: false,
      currentEmotion: 'neutral',
      currentExpression: 'neutral',
      expressionIntensity: DEFAULT_EXPRESSION_INTENSITY,
      currentBehavior: 'idle',

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
      setExpressionIntensity: (intensity) =>
        set({ expressionIntensity: Math.max(0, Math.min(1, intensity)) }),
      setBehavior: (behavior) => set({ currentBehavior: behavior }),

      // 会话管理
      initSession: () => {
        useChatSessionStore.getState().initSession();
        useSystemStore.getState().resetSystemState();
      },

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
          expressionIntensity: DEFAULT_EXPRESSION_INTENSITY,
          currentBehavior: 'idle',
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
        }, RECORDING_TIMEOUT_MS);
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
      },
    }),
    { name: 'digital-human-store', enabled: ENABLE_DEVTOOLS },
  ),
);

// Typed selectors for performance-sensitive components
export const selectIsPlaying = (s: DigitalHumanState) => s.isPlaying;
export const selectCurrentExpression = (s: DigitalHumanState) => s.currentExpression;
export const selectCurrentBehavior = (s: DigitalHumanState) => s.currentBehavior;
export const selectCurrentEmotion = (s: DigitalHumanState) => s.currentEmotion;
export const selectIsRecording = (s: DigitalHumanState) => s.isRecording;
export const selectIsSpeaking = (s: DigitalHumanState) => s.isSpeaking;
