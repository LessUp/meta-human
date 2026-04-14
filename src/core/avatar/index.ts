import { useDigitalHumanStore } from '../../store/digitalHumanStore';
import { DigitalHumanEngine } from './DigitalHumanEngine';
import type { StateAdapter } from './DigitalHumanEngine';

export { DigitalHumanEngine } from './DigitalHumanEngine';
export type { EngineEventType, StateAdapter } from './DigitalHumanEngine';
export {
  EMOTION_TO_EXPRESSION,
  ANIMATION_DURATIONS,
  VALID_EXPRESSIONS,
  VALID_EMOTIONS,
  VALID_BEHAVIORS,
  ANIMATION_TO_BEHAVIOR,
} from './constants';

/** Create a StateAdapter backed by the Zustand store. */
function createStoreAdapter(): StateAdapter {
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

/** Pre-configured singleton using the default store adapter. */
export const digitalHumanEngine = new DigitalHumanEngine(createStoreAdapter());
