export { DigitalHumanEngine } from './DigitalHumanEngine';
export type { EngineEventType, StateAdapter } from './DigitalHumanEngine';
export {
  AVATAR_EMOTIONS,
  AVATAR_EXPRESSIONS,
  AVATAR_ACTIONS,
  AVATAR_BEHAVIORS,
  EMOTION_TO_EXPRESSION,
  ACTION_TO_BEHAVIOR,
  normalizeAvatarEmotion,
  normalizeAvatarExpression,
  normalizeAvatarAction,
  normalizeAvatarBehavior,
  mapEmotionToExpression,
} from './avatarContract';
export type {
  AvatarContract,
  AvatarEventHandler,
  AvatarEventType,
  EmotionType,
  ExpressionType,
  AvatarAction,
  BehaviorType,
} from './avatarContract';
export type { EngineStateAdapter } from './avatarStateAdapter';
export { createEngineStateAdapter } from './avatarStateAdapter';
export {
  ANIMATION_DURATIONS,
  VALID_EXPRESSIONS,
  VALID_EMOTIONS,
  VALID_BEHAVIORS,
  ANIMATION_TO_BEHAVIOR,
} from './constants';
