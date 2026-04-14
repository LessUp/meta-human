import type { EmotionType, ExpressionType, BehaviorType } from '../../store/digitalHumanStore';

export const EMOTION_TO_EXPRESSION: Record<EmotionType, ExpressionType> = {
  neutral: 'neutral',
  happy: 'smile',
  surprised: 'surprise',
  sad: 'sad',
  angry: 'angry',
};

export const ANIMATION_DURATIONS: Record<string, number> = {
  wave: 3000,
  greet: 3000,
  nod: 2000,
  shakeHead: 2000,
  dance: 6000,
  think: 3000,
  speak: 0,
  idle: 0,
};

export const VALID_EXPRESSIONS: ExpressionType[] = [
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
];

export const VALID_EMOTIONS: EmotionType[] = ['neutral', 'happy', 'surprised', 'sad', 'angry'];

export const VALID_BEHAVIORS: BehaviorType[] = [
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
];

export const ANIMATION_TO_BEHAVIOR: Record<string, BehaviorType> = {
  wave: 'greeting',
  greet: 'greeting',
  nod: 'listening',
  shakeHead: 'idle',
  dance: 'excited',
  think: 'thinking',
  speak: 'speaking',
};
