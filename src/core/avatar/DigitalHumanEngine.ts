import { useDigitalHumanStore, type EmotionType, type ExpressionType, type BehaviorType } from '../../store/digitalHumanStore';
import {
  EMOTION_TO_EXPRESSION,
  ANIMATION_DURATIONS,
  VALID_EXPRESSIONS,
  VALID_EMOTIONS,
  VALID_BEHAVIORS,
  ANIMATION_TO_BEHAVIOR,
} from './constants';

export type EngineEventType =
  | 'expression:change'
  | 'emotion:change'
  | 'behavior:change'
  | 'animation:start'
  | 'animation:end';

type EngineEventHandler = (payload: { type: string; value: string }) => void;

export class DigitalHumanEngine {
  private animationTimeout: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Map<EngineEventType, Set<EngineEventHandler>>();

  on(event: EngineEventType, handler: EngineEventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off(event: EngineEventType, handler: EngineEventHandler): void {
    this.listeners.get(event)?.delete(handler);
  }

  private emit(event: EngineEventType, value: string): void {
    this.listeners.get(event)?.forEach((handler) => {
      try {
        handler({ type: event, value });
      } catch (err) {
        console.error(`[DigitalHumanEngine] event handler error (${event}):`, err);
      }
    });
  }

  play(): void {
    useDigitalHumanStore.getState().play();
  }

  pause(): void {
    useDigitalHumanStore.getState().pause();
  }

  reset(): void {
    useDigitalHumanStore.getState().reset();
    this.clearAnimationTimeout();
  }

  setExpression(expression: string): void {
    const store = useDigitalHumanStore.getState();
    if (VALID_EXPRESSIONS.includes(expression as ExpressionType)) {
      store.setExpression(expression as ExpressionType);
    } else {
      console.warn(`Unknown expression: ${expression}, falling back to neutral`);
      store.setExpression('neutral');
    }
    this.emit('expression:change', expression);
  }

  setExpressionIntensity(intensity: number): void {
    useDigitalHumanStore.getState().setExpressionIntensity(intensity);
  }

  setEmotion(emotion: string): void {
    const store = useDigitalHumanStore.getState();
    if (VALID_EMOTIONS.includes(emotion as EmotionType)) {
      store.setEmotion(emotion as EmotionType);
      const mappedExpression = EMOTION_TO_EXPRESSION[emotion as EmotionType];
      if (mappedExpression) {
        store.setExpression(mappedExpression);
      }
    } else {
      console.warn(`Unknown emotion: ${emotion}, falling back to neutral`);
      store.setEmotion('neutral');
      store.setExpression('neutral');
    }
    this.emit('emotion:change', emotion);
  }

  setBehavior(behavior: string, _params?: unknown): void {
    const store = useDigitalHumanStore.getState();
    if (VALID_BEHAVIORS.includes(behavior as BehaviorType)) {
      store.setBehavior(behavior as BehaviorType);
    } else {
      console.warn(`Unknown behavior: ${behavior}, falling back to idle`);
      store.setBehavior('idle');
    }
    this.emit('behavior:change', behavior);
  }

  playAnimation(name: string, autoReset: boolean = true): void {
    const store = useDigitalHumanStore.getState();

    this.clearAnimationTimeout();

    store.setAnimation(name);
    store.setPlaying(true);
    this.emit('animation:start', name);

    if (ANIMATION_TO_BEHAVIOR[name]) {
      store.setBehavior(ANIMATION_TO_BEHAVIOR[name]);
    }

    if (autoReset) {
      const duration = ANIMATION_DURATIONS[name] || 3000;
      if (duration > 0) {
        this.animationTimeout = setTimeout(() => {
          store.setAnimation('idle');
          store.setBehavior('idle');
          this.emit('animation:end', name);
        }, duration);
      }
    }
  }

  performGreeting(): void {
    this.setEmotion('happy');
    this.playAnimation('wave');
  }

  performThinking(): void {
    this.setEmotion('neutral');
    this.setBehavior('thinking');
    this.playAnimation('think');
  }

  performListening(): void {
    this.setEmotion('neutral');
    this.setBehavior('listening');
    this.playAnimation('nod', false);
  }

  dispose(): void {
    this.clearAnimationTimeout();
    this.listeners.clear();
  }

  private clearAnimationTimeout(): void {
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
      this.animationTimeout = null;
    }
  }
}

export const digitalHumanEngine = new DigitalHumanEngine();
