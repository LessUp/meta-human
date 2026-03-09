/**
 * 数字人行为模块统一导出
 */

export { createDigitalHumanEngine, type DigitalHumanEngine, type EngineOptions } from './engine'
export { createAnimationQueue, type AnimationQueue, type AnimationQueueCallbacks, ANIMATION_DURATIONS } from './animation-queue'
export {
  EMOTION_TO_EXPRESSION,
  ANIMATION_TO_BEHAVIOR,
  VALID_EXPRESSIONS,
  VALID_EMOTIONS,
  VALID_BEHAVIORS,
  PRESET_ACTIONS,
  type PresetAction,
} from './presets'
