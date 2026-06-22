import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { UserEmotion } from '@/core/vision/visionMapper';
import { DEFAULT_CHARACTER_ID } from '@/core/dialogue/characterPresets';
import type {
  AvatarAction,
  BehaviorType,
  EmotionType,
  ExpressionType,
} from '@/core/avatar/avatarContract';

// Named constants
const RECORDING_TIMEOUT_MS = 30000;
const DEFAULT_EXPRESSION_INTENSITY = 0.8;
const ENABLE_DEVTOOLS =
  typeof import.meta !== 'undefined' &&
  import.meta.env?.DEV === true &&
  import.meta.env?.MODE !== 'test';

export type {
  AvatarAction,
  BehaviorType,
  EmotionType,
  ExpressionType,
} from '@/core/avatar/avatarContract';
export type VisionMotionType = Extract<
  AvatarAction,
  'nod' | 'shakeHead' | 'raiseHand' | 'waveHand'
>;

export interface VisionContextSnapshot {
  emotion: UserEmotion;
  motion: VisionMotionType | null;
  updatedAt: number | null;
}

export interface SpeechConfigSnapshot {
  voiceName: string | null;
  rate: number;
  pitch: number;
  volume: number;
}

export type AvatarSource =
  | { kind: 'procedural' }
  | { kind: 'custom'; modelUrl: string; fileName: string };

export type AvatarLoadStatus = 'idle' | 'ready' | 'error';

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
  visionContext: VisionContextSnapshot;
  speechConfig: SpeechConfigSnapshot;
  avatarSource: AvatarSource;
  avatarLoadStatus: AvatarLoadStatus;
  avatarLoadError: string | null;

  // Lipsync 嘴型开合度（0=闭嘴，1=张大），由 TTS 驱动
  mouthOpen: number;

  // 角色预设
  activeCharacterId: string;

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
  recordVisionEmotion: (emotion: UserEmotion) => void;
  recordVisionMotion: (motion: VisionMotionType) => void;
  clearVisionContext: () => void;
  setSpeechConfig: (config: Partial<SpeechConfigSnapshot>) => void;
  setCustomAvatar: (input: { modelUrl: string; fileName: string }) => void;
  useProceduralAvatar: () => void;
  setAvatarLoadState: (status: AvatarLoadStatus, error?: string | null) => void;
  setMouthOpen: (open: number) => void;
  setActiveCharacter: (id: string) => void;

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
      visionContext: {
        emotion: 'neutral',
        motion: null,
        updatedAt: null,
      },
      speechConfig: {
        voiceName: null,
        rate: 1,
        pitch: 1,
        volume: 0.8,
      },
      avatarSource: { kind: 'procedural' },
      avatarLoadStatus: 'ready',
      avatarLoadError: null,
      mouthOpen: 0,
      activeCharacterId: DEFAULT_CHARACTER_ID,

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
        set({ expressionIntensity: Math.max(0, Math.min(1, intensity || 0)) }),
      setBehavior: (behavior) => set({ currentBehavior: behavior }),
      recordVisionEmotion: (emotion) =>
        set((state) => ({
          visionContext: {
            ...state.visionContext,
            emotion,
            updatedAt: Date.now(),
          },
        })),
      recordVisionMotion: (motion) =>
        set((state) => ({
          visionContext: {
            ...state.visionContext,
            motion,
            updatedAt: Date.now(),
          },
        })),
      clearVisionContext: () =>
        set({
          visionContext: {
            emotion: 'neutral',
            motion: null,
            updatedAt: null,
          },
        }),
      setSpeechConfig: (config) =>
        set((state) => ({
          speechConfig: {
            voiceName: config.voiceName ?? state.speechConfig.voiceName,
            rate: config.rate ?? state.speechConfig.rate,
            pitch: config.pitch ?? state.speechConfig.pitch,
            volume: config.volume ?? state.speechConfig.volume,
          },
        })),
      setCustomAvatar: ({ modelUrl, fileName }) =>
        set({
          avatarSource: { kind: 'custom', modelUrl, fileName },
          avatarLoadStatus: 'idle',
          avatarLoadError: null,
        }),
      useProceduralAvatar: () =>
        set({
          avatarSource: { kind: 'procedural' },
          avatarLoadStatus: 'ready',
          avatarLoadError: null,
        }),
      setAvatarLoadState: (status, error = null) =>
        set({
          avatarLoadStatus: status,
          avatarLoadError: error,
        }),
      setMouthOpen: (open) => set({ mouthOpen: Math.max(0, Math.min(1, open)) }),
      setActiveCharacter: (id) => set({ activeCharacterId: id }),

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
          mouthOpen: 0,
          visionContext: {
            emotion: 'neutral',
            motion: null,
            updatedAt: null,
          },
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
