// avatarStore — 模型/动画/表情/行为/情绪状态
// 参考 AIRI model-store 的领域分离设计
import { create } from 'zustand';
import type { AvatarType, BehaviorType, EmotionType, ExpressionType } from './types';

interface AvatarState {
  // 模型
  isPlaying: boolean;
  autoRotate: boolean;
  currentAnimation: string;
  avatarType: AvatarType;
  vrmModelUrl: string | null;

  // 表情/情绪/行为
  currentEmotion: EmotionType;
  currentExpression: ExpressionType;
  expressionIntensity: number;
  currentBehavior: BehaviorType;

  // 动作
  setPlaying: (playing: boolean) => void;
  setAutoRotate: (rotate: boolean) => void;
  setAnimation: (animation: string) => void;
  setAvatarType: (type: AvatarType) => void;
  setVrmModelUrl: (url: string | null) => void;
  setEmotion: (emotion: EmotionType) => void;
  setExpression: (expression: ExpressionType) => void;
  setExpressionIntensity: (intensity: number) => void;
  setBehavior: (behavior: BehaviorType) => void;

  // 控制
  play: () => void;
  pause: () => void;
  toggleAutoRotate: () => void;
  reset: () => void;
}

export const useAvatarStore = create<AvatarState>((set, get) => ({
  isPlaying: false,
  autoRotate: false,
  currentAnimation: 'idle',
  avatarType: 'cyber',
  vrmModelUrl: null,
  currentEmotion: 'neutral',
  currentExpression: 'neutral',
  expressionIntensity: 0.8,
  currentBehavior: 'idle',

  setPlaying: (playing) => set({ isPlaying: playing }),
  setAutoRotate: (rotate) => set({ autoRotate: rotate }),
  setAnimation: (animation) => set({ currentAnimation: animation }),
  setAvatarType: (type) => set({ avatarType: type }),
  setVrmModelUrl: (url) => set({ vrmModelUrl: url, avatarType: url ? 'vrm' : 'cyber' }),
  setEmotion: (emotion) => set({ currentEmotion: emotion }),
  setExpression: (expression) => set({ currentExpression: expression }),
  setExpressionIntensity: (intensity) => set({ expressionIntensity: Math.max(0, Math.min(1, intensity)) }),
  setBehavior: (behavior) => set({ currentBehavior: behavior }),

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  toggleAutoRotate: () => set({ autoRotate: !get().autoRotate }),
  reset: () => set({
    isPlaying: false,
    currentAnimation: 'idle',
    currentEmotion: 'neutral',
    currentExpression: 'neutral',
    expressionIntensity: 0.8,
    currentBehavior: 'idle',
  }),
}));
