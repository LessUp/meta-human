export const AVATAR_EMOTIONS = ['neutral', 'happy', 'surprised', 'sad', 'angry'] as const;
export type EmotionType = (typeof AVATAR_EMOTIONS)[number];

export const AVATAR_EXPRESSIONS = [
  'neutral',
  'smile',
  'laugh',
  'surprise',
  'sad',
  'angry',
  'blink',
  'eyebrow_raise',
  'eye_blink',
  'mouth_open',
  'head_nod',
] as const;
export type ExpressionType = (typeof AVATAR_EXPRESSIONS)[number];

export const AVATAR_ACTIONS = [
  'idle',
  'wave',
  'greet',
  'think',
  'nod',
  'shakeHead',
  'dance',
  'speak',
  'waveHand',
  'raiseHand',
] as const;
export type AvatarAction = (typeof AVATAR_ACTIONS)[number];

export const AVATAR_BEHAVIORS = [
  'idle',
  'greeting',
  'listening',
  'thinking',
  'speaking',
  'excited',
  'wave',
  'greet',
  'think',
  'nod',
  'shakeHead',
  'dance',
  'speak',
  'waveHand',
  'raiseHand',
] as const;
export type BehaviorType = (typeof AVATAR_BEHAVIORS)[number];

export const EMOTION_TO_EXPRESSION: Record<EmotionType, ExpressionType> = {
  neutral: 'neutral',
  happy: 'smile',
  surprised: 'surprise',
  sad: 'sad',
  angry: 'angry',
};

export const ACTION_TO_BEHAVIOR: Partial<Record<AvatarAction, BehaviorType>> = {
  wave: 'greeting',
  greet: 'greeting',
  nod: 'listening',
  shakeHead: 'idle',
  dance: 'excited',
  think: 'thinking',
  speak: 'speaking',
  waveHand: 'waveHand',
  raiseHand: 'raiseHand',
};

const normalizeFromList = <T extends readonly string[]>(
  value: string,
  values: T,
  fallback: T[number],
): T[number] => {
  return values.includes(value as T[number]) ? (value as T[number]) : fallback;
};

export const normalizeAvatarEmotion = (value: string): EmotionType =>
  normalizeFromList(value, AVATAR_EMOTIONS, 'neutral');

export const normalizeAvatarExpression = (value: string): ExpressionType =>
  normalizeFromList(value, AVATAR_EXPRESSIONS, 'neutral');

export const normalizeAvatarAction = (value: string): AvatarAction =>
  normalizeFromList(value, AVATAR_ACTIONS, 'idle');

export const normalizeAvatarBehavior = (value: string): BehaviorType =>
  normalizeFromList(value, AVATAR_BEHAVIORS, 'idle');

export const mapEmotionToExpression = (emotion: EmotionType): ExpressionType =>
  EMOTION_TO_EXPRESSION[emotion];

export type AvatarEventType =
  | 'expression:change'
  | 'emotion:change'
  | 'behavior:change'
  | 'animation:start'
  | 'animation:end';

export type AvatarEventHandler = (payload: { type: string; value: string }) => void;

export interface AvatarContract {
  play(): void;
  pause(): void;
  reset(): void;
  setExpression(expression: string): void;
  setExpressionIntensity(intensity: number): void;
  setEmotion(emotion: string): void;
  setBehavior(behavior: string, params?: unknown): void;
  playAnimation(name: string, autoReset?: boolean): void;
  on(event: AvatarEventType, handler: AvatarEventHandler): () => void;
  off(event: AvatarEventType, handler: AvatarEventHandler): void;
  dispose(): void;
}
