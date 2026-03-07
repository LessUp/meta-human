/**
 * VRM 表情/情绪系统 — 借鉴 AIRI 项目的平滑过渡机制
 * 支持 lerp + easeInOutCubic 缓动，多表情通道混合
 */
import type { VRMCore } from '@pixiv/three-vrm-core';

// 情绪状态定义
interface EmotionExpression {
  name: string;
  value: number;
  duration?: number;
}

interface EmotionState {
  expressions: EmotionExpression[];
  blendDuration: number;
}

// 缓动函数
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function clampIntensity(value: number): number {
  return Math.min(1, Math.max(0, value));
}

// 预设情绪状态 — 值为"满权重"目标，实际应用值 = value × intensity
// 使用 0.7-0.8 的较低值避免表情过度
const DEFAULT_EMOTION_STATES = new Map<string, EmotionState>([
  ['neutral', {
    expressions: [{ name: 'neutral', value: 1.0 }],
    blendDuration: 0.6,
  }],
  ['happy', {
    expressions: [
      { name: 'happy', value: 0.7 },
      { name: 'aa', value: 0.2 },
    ],
    blendDuration: 0.4,
  }],
  ['sad', {
    expressions: [
      { name: 'sad', value: 0.7 },
      { name: 'oh', value: 0.15 },
    ],
    blendDuration: 0.4,
  }],
  ['angry', {
    expressions: [
      { name: 'angry', value: 0.7 },
      { name: 'ee', value: 0.3 },
    ],
    blendDuration: 0.3,
  }],
  ['surprised', {
    expressions: [
      { name: 'surprised', value: 0.8 },
      { name: 'oh', value: 0.4 },
    ],
    blendDuration: 0.15,
  }],
  ['relaxed', {
    expressions: [
      { name: 'relaxed', value: 0.7 },
    ],
    blendDuration: 0.5,
  }],
  // 项目自定义表情映射
  ['smile', {
    expressions: [{ name: 'happy', value: 0.6 }],
    blendDuration: 0.4,
  }],
  ['laugh', {
    expressions: [
      { name: 'happy', value: 0.9 },
      { name: 'aa', value: 0.35 },
    ],
    blendDuration: 0.3,
  }],
  ['surprise', {
    expressions: [
      { name: 'surprised', value: 0.8 },
      { name: 'oh', value: 0.4 },
    ],
    blendDuration: 0.15,
  }],
  ['blink', {
    expressions: [{ name: 'blink', value: 1.0 }],
    blendDuration: 0.1,
  }],
  ['wink', {
    expressions: [{ name: 'blinkLeft', value: 1.0 }],
    blendDuration: 0.15,
  }],
]);

export interface VRMEmoteController {
  currentEmotion: string | null;
  isTransitioning: boolean;
  setEmotion: (name: string, intensity?: number) => void;
  setEmotionWithReset: (name: string, ms: number, intensity?: number) => void;
  update: (deltaTime: number) => void;
  dispose: () => void;
}

export function useVRMEmote(vrm: VRMCore): VRMEmoteController {
  let currentEmotion: string | null = null;
  let isTransitioning = false;
  let transitionProgress = 0;
  let resetTimeout: ReturnType<typeof setTimeout> | null = null;

  // 过渡起始值和目标值
  const currentValues = new Map<string, number>();
  const targetValues = new Map<string, number>();
  const emotionStates = new Map(DEFAULT_EMOTION_STATES);

  function clearResetTimeout() {
    if (resetTimeout) {
      clearTimeout(resetTimeout);
      resetTimeout = null;
    }
  }

  function setEmotion(emotionName: string, intensity = 1) {
    clearResetTimeout();

    if (!emotionStates.has(emotionName)) {
      console.warn(`表情 "${emotionName}" 未定义`);
      return;
    }

    const state = emotionStates.get(emotionName)!;
    currentEmotion = emotionName;
    isTransitioning = true;
    transitionProgress = 0;

    const normalizedIntensity = clampIntensity(intensity);

    // 捕获当前所有表情值作为过渡起点（而非直接跳到0）
    currentValues.clear();
    targetValues.clear();

    if (vrm.expressionManager) {
      const names = Object.keys(vrm.expressionManager.expressionMap);
      for (const name of names) {
        const val = vrm.expressionManager.getValue(name) || 0;
        currentValues.set(name, val);
        targetValues.set(name, 0); // 默认目标为0
      }
    }

    // 设置目标表情值
    for (const expr of state.expressions) {
      targetValues.set(expr.name, expr.value * normalizedIntensity);
    }
  }

  function setEmotionWithReset(emotionName: string, ms: number, intensity = 1) {
    clearResetTimeout();
    setEmotion(emotionName, intensity);

    resetTimeout = setTimeout(() => {
      setEmotion('neutral');
      resetTimeout = null;
    }, ms);
  }

  function update(deltaTime: number) {
    if (!isTransitioning || !currentEmotion) return;

    const state = emotionStates.get(currentEmotion)!;
    const blendDuration = state.blendDuration || 0.3;

    transitionProgress += deltaTime / blendDuration;
    if (transitionProgress >= 1.0) {
      transitionProgress = 1.0;
      isTransitioning = false;
    }

    // 使用 easeInOutCubic 缓动平滑过渡所有表情通道
    for (const [name, target] of targetValues) {
      const start = currentValues.get(name) || 0;
      const value = lerp(start, target, easeInOutCubic(transitionProgress));
      vrm.expressionManager?.setValue(name, value);
    }
  }

  function dispose() {
    clearResetTimeout();
  }

  return {
    get currentEmotion() { return currentEmotion; },
    get isTransitioning() { return isTransitioning; },
    setEmotion,
    setEmotionWithReset,
    update,
    dispose,
  };
}
