import {
  ACTION_TO_BEHAVIOR,
  AVATAR_BEHAVIORS,
  AVATAR_EMOTIONS,
  AVATAR_EXPRESSIONS,
  EMOTION_TO_EXPRESSION,
  type BehaviorType,
  type EmotionType,
  type ExpressionType,
} from './avatarContract';

export { EMOTION_TO_EXPRESSION };

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

export const VALID_EXPRESSIONS: ExpressionType[] = [...AVATAR_EXPRESSIONS];

export const VALID_EMOTIONS: EmotionType[] = [...AVATAR_EMOTIONS];

export const VALID_BEHAVIORS: BehaviorType[] = [...AVATAR_BEHAVIORS];

export const ANIMATION_TO_BEHAVIOR: Record<string, BehaviorType> = {
  wave: ACTION_TO_BEHAVIOR.wave ?? 'greeting',
  greet: ACTION_TO_BEHAVIOR.greet ?? 'greeting',
  nod: ACTION_TO_BEHAVIOR.nod ?? 'listening',
  shakeHead: ACTION_TO_BEHAVIOR.shakeHead ?? 'idle',
  dance: ACTION_TO_BEHAVIOR.dance ?? 'excited',
  think: ACTION_TO_BEHAVIOR.think ?? 'thinking',
  speak: ACTION_TO_BEHAVIOR.speak ?? 'speaking',
};
