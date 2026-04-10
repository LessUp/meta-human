import type { EmotionType, ExpressionType, BehaviorType } from '../../store/digitalHumanStore';
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

/**
 * Abstraction over state mutations.
 * Decouples the engine from any specific state management library.
 */
export interface StateAdapter {
  play(): void;
  pause(): void;
  reset(): void;
  setExpression(expr: ExpressionType): void;
  setExpressionIntensity(intensity: number): void;
  setEmotion(emo: EmotionType): void;
  setBehavior(beh: BehaviorType): void;
  setAnimation(anim: string): void;
  setPlaying(playing: boolean): void;
}

export class DigitalHumanEngine {
  private readonly state: StateAdapter;
  private animationTimeout: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Map<EngineEventType, Set<EngineEventHandler>>();

  constructor(stateAdapter: StateAdapter) {
    this.state = stateAdapter;
  }

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
    this.state.play();
  }

  pause(): void {
    this.state.pause();
  }

  reset(): void {
    this.state.reset();
    this.clearAnimationTimeout();
  }

  setExpression(expression: string): void {
    if (VALID_EXPRESSIONS.includes(expression as ExpressionType)) {
      this.state.setExpression(expression as ExpressionType);
    } else {
      console.warn(`Unknown expression: ${expression}, falling back to neutral`);
      this.state.setExpression('neutral');
    }
    this.emit('expression:change', expression);
  }

  setExpressionIntensity(intensity: number): void {
    this.state.setExpressionIntensity(intensity);
  }

  setEmotion(emotion: string): void {
    if (VALID_EMOTIONS.includes(emotion as EmotionType)) {
      this.state.setEmotion(emotion as EmotionType);
      const mappedExpression = EMOTION_TO_EXPRESSION[emotion as EmotionType];
      if (mappedExpression) {
        this.state.setExpression(mappedExpression);
      }
    } else {
      console.warn(`Unknown emotion: ${emotion}, falling back to neutral`);
      this.state.setEmotion('neutral');
      this.state.setExpression('neutral');
    }
    this.emit('emotion:change', emotion);
  }

  setBehavior(behavior: string, _params?: unknown): void {
    if (VALID_BEHAVIORS.includes(behavior as BehaviorType)) {
      this.state.setBehavior(behavior as BehaviorType);
    } else {
      console.warn(`Unknown behavior: ${behavior}, falling back to idle`);
      this.state.setBehavior('idle');
    }
    this.emit('behavior:change', behavior);
  }

  playAnimation(name: string, autoReset: boolean = true): void {
    this.clearAnimationTimeout();

    this.state.setAnimation(name);
    this.state.setPlaying(true);
    this.emit('animation:start', name);

    if (ANIMATION_TO_BEHAVIOR[name]) {
      this.state.setBehavior(ANIMATION_TO_BEHAVIOR[name]);
    }

    if (autoReset) {
      const duration = ANIMATION_DURATIONS[name] ?? 3000;
      if (duration > 0) {
        this.animationTimeout = setTimeout(() => {
          this.state.setAnimation('idle');
          this.state.setBehavior('idle');
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
