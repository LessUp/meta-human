import { useDigitalHumanStore } from '../../store/digitalHumanStore';
import type { BehaviorType, EmotionType, ExpressionType } from './avatarContract';

export interface EngineStateAdapter {
  play(): void;
  pause(): void;
  reset(): void;
  setExpression(expression: ExpressionType): void;
  setExpressionIntensity(intensity: number): void;
  setEmotion(emotion: EmotionType): void;
  setBehavior(behavior: BehaviorType): void;
  setAnimation(animation: string): void;
  setPlaying(playing: boolean): void;
}

export function createEngineStateAdapter(): EngineStateAdapter {
  return {
    play: () => useDigitalHumanStore.getState().play(),
    pause: () => useDigitalHumanStore.getState().pause(),
    reset: () => useDigitalHumanStore.getState().reset(),
    setExpression: (expression) => useDigitalHumanStore.getState().setExpression(expression),
    setExpressionIntensity: (intensity) =>
      useDigitalHumanStore.getState().setExpressionIntensity(intensity),
    setEmotion: (emotion) => useDigitalHumanStore.getState().setEmotion(emotion),
    setBehavior: (behavior) => useDigitalHumanStore.getState().setBehavior(behavior),
    setAnimation: (animation) => useDigitalHumanStore.getState().setAnimation(animation),
    setPlaying: (playing) => useDigitalHumanStore.getState().setPlaying(playing),
  };
}
