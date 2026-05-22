import type { EmotionType, ExpressionType, BehaviorType } from '../../store/digitalHumanStore';
import { loggers } from '../../lib/logger';
import {
  EMOTION_TO_EXPRESSION,
  ANIMATION_DURATIONS,
  VALID_EXPRESSIONS,
  VALID_EMOTIONS,
  VALID_BEHAVIORS,
  ANIMATION_TO_BEHAVIOR,
} from './constants';
import type { EngineStateAdapter } from '../adapters';

// Re-export for backward compatibility
export type { EngineStateAdapter as StateAdapter } from '../adapters';

export type EngineEventType =
  | 'expression:change'
  | 'emotion:change'
  | 'behavior:change'
  | 'animation:start'
  | 'animation:end';

type EngineEventHandler = (payload: { type: string; value: string }) => void;

const logger = loggers.avatar;

export class DigitalHumanEngine {
  private readonly state: EngineStateAdapter;
  private animationTimeout: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Map<EngineEventType, Set<EngineEventHandler>>();

  constructor(stateAdapter: EngineStateAdapter) {
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
        logger.error(`event handler error (${event}):`, err);
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
    const normalizedExpression = VALID_EXPRESSIONS.includes(expression as ExpressionType)
      ? (expression as ExpressionType)
      : 'neutral';

    if (normalizedExpression === 'neutral' && expression !== 'neutral') {
      logger.warn(`Unknown expression: ${expression}, falling back to neutral`);
    }

    this.state.setExpression(normalizedExpression);
    this.emit('expression:change', normalizedExpression);
  }

  setExpressionIntensity(intensity: number): void {
    this.state.setExpressionIntensity(intensity);
  }

  setEmotion(emotion: string): void {
    const normalizedEmotion = VALID_EMOTIONS.includes(emotion as EmotionType)
      ? (emotion as EmotionType)
      : 'neutral';

    if (normalizedEmotion === 'neutral' && emotion !== 'neutral') {
      logger.warn(`Unknown emotion: ${emotion}, falling back to neutral`);
    }

    this.state.setEmotion(normalizedEmotion);
    const mappedExpression = EMOTION_TO_EXPRESSION[normalizedEmotion];
    this.state.setExpression(mappedExpression ?? 'neutral');
    this.emit('emotion:change', normalizedEmotion);
  }

  setBehavior(behavior: string, _params?: unknown): void {
    const normalizedBehavior = VALID_BEHAVIORS.includes(behavior as BehaviorType)
      ? (behavior as BehaviorType)
      : 'idle';

    if (normalizedBehavior === 'idle' && behavior !== 'idle') {
      logger.warn(`Unknown behavior: ${behavior}, falling back to idle`);
    }

    this.state.setBehavior(normalizedBehavior);
    this.emit('behavior:change', normalizedBehavior);
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
