import {
  ANIMATION_DURATIONS,
  EMOTION_TO_EXPRESSION,
  VALID_BEHAVIORS,
  VALID_EMOTIONS,
  VALID_EXPRESSIONS,
  applyAvatarCommand,
  behaviorToAvatarCommand,
  clampExpressionIntensity,
} from './avatarPresentation';
import type { AvatarCommand, AvatarPresentationState } from './avatarPresentation';
import { useDigitalHumanStore, type BehaviorType, type EmotionType, type ExpressionType } from '../../store/digitalHumanStore';

interface AnimationQueueItem {
  name: string;
  duration: number;
  autoReset: boolean;
  onComplete?: () => void;
}

export interface AnimationOptions {
  duration?: number;
  autoReset?: boolean;
  blendDuration?: number;
  onComplete?: () => void;
}

export interface PlayAnimationOptions extends AnimationOptions {
  immediate?: boolean;
}

export class DigitalHumanEngine {
  private animationQueue: AnimationQueueItem[] = [];
  private currentAnimation = 'idle';
  private isProcessingQueue = false;
  private animationTimeout: ReturnType<typeof setTimeout> | null = null;
  private animationCompleteCallbacks: (() => void)[] = [];

  play(): void {
    const { play } = useDigitalHumanStore.getState();
    play();
  }

  pause(): void {
    const { pause } = useDigitalHumanStore.getState();
    pause();
  }

  reset(): void {
    const { reset } = useDigitalHumanStore.getState();
    reset();
    this.clearAnimationQueue();
    this.clearAnimationTimeout();
    this.currentAnimation = 'idle';
  }

  getQueueLength(): number {
    return this.animationQueue.length;
  }

  clearAnimationQueue(): void {
    this.animationQueue = [];
    this.isProcessingQueue = false;
    this.clearAnimationTimeout();
  }

  queueAnimation(name: string, options: AnimationOptions = {}): void {
    const {
      duration = ANIMATION_DURATIONS[name] ?? 3000,
      autoReset = true,
      onComplete,
    } = options;

    this.animationQueue.push({
      name,
      duration,
      autoReset,
      onComplete,
    });

    if (!this.isProcessingQueue) {
      void this.processAnimationQueue();
    }
  }

  applyCommand(command: AvatarCommand, overrides: Partial<AvatarPresentationState> = {}): void {
    this.commitCommand(command, overrides);
  }

  private getAvatarState(): AvatarPresentationState {
    const store = useDigitalHumanStore.getState();

    return {
      avatarType: store.avatarType ?? 'cyber',
      currentAnimation: store.currentAnimation ?? 'idle',
      currentBehavior: store.currentBehavior ?? 'idle',
      currentEmotion: store.currentEmotion ?? 'neutral',
      currentExpression: store.currentExpression ?? 'neutral',
      expressionIntensity: store.expressionIntensity ?? 0.8,
      isRecording: store.isRecording ?? false,
      isSpeaking: store.isSpeaking ?? false,
    };
  }

  private commitCommand(command: AvatarCommand, overrides: Partial<AvatarPresentationState> = {}): void {
    const store = useDigitalHumanStore.getState();
    const currentState = this.getAvatarState();
    const nextState = {
      ...applyAvatarCommand(currentState, command),
      ...overrides,
    };

    if (nextState.currentEmotion !== currentState.currentEmotion) {
      store.setEmotion(nextState.currentEmotion);
    }

    if (nextState.currentExpression !== currentState.currentExpression) {
      store.setExpression(nextState.currentExpression);
    }

    if (
      nextState.expressionIntensity !== currentState.expressionIntensity &&
      typeof store.setExpressionIntensity === 'function'
    ) {
      store.setExpressionIntensity(nextState.expressionIntensity);
    }

    if (nextState.currentBehavior !== currentState.currentBehavior) {
      store.setBehavior(nextState.currentBehavior);
    }

    if (nextState.currentAnimation !== currentState.currentAnimation) {
      store.setAnimation(nextState.currentAnimation);
    }

    if (nextState.isSpeaking !== currentState.isSpeaking && typeof store.setSpeaking === 'function') {
      store.setSpeaking(nextState.isSpeaking);
    }
  }

  private startAnimation(name: string): void {
    const store = useDigitalHumanStore.getState();

    this.currentAnimation = name;
    store.setPlaying(true);

    if (VALID_BEHAVIORS.includes(name as BehaviorType)) {
      this.commitCommand(behaviorToAvatarCommand(name as BehaviorType), { currentAnimation: name });
      return;
    }

    store.setAnimation(name);
  }

  private restoreIdleState(): void {
    const store = useDigitalHumanStore.getState();
    const nextBehavior: BehaviorType = store.isSpeaking ? 'speaking' : 'idle';

    this.currentAnimation = 'idle';
    store.setAnimation('idle');
    store.setBehavior(nextBehavior);
  }

  private async processAnimationQueue(): Promise<void> {
    if (this.isProcessingQueue || this.animationQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.animationQueue.length > 0) {
      const item = this.animationQueue.shift();
      if (!item) break;
      await this.playAnimationInternal(item.name, item.duration, item.autoReset);
      item.onComplete?.();
    }

    this.isProcessingQueue = false;
  }

  private playAnimationInternal(name: string, duration: number, autoReset: boolean): Promise<void> {
    return new Promise((resolve) => {
      this.clearAnimationTimeout();
      this.startAnimation(name);

      if (autoReset && duration > 0) {
        this.animationTimeout = setTimeout(() => {
          this.restoreIdleState();
          this.notifyAnimationComplete();
          resolve();
        }, duration);
        return;
      }

      if (duration > 0) {
        this.animationTimeout = setTimeout(() => {
          this.notifyAnimationComplete();
          resolve();
        }, duration);
        return;
      }

      resolve();
    });
  }

  private notifyAnimationComplete(): void {
    const callbacks = [...this.animationCompleteCallbacks];
    this.animationCompleteCallbacks = [];
    callbacks.forEach((callback) => callback());
  }

  waitForCurrentAnimation(): Promise<void> {
    return new Promise((resolve) => {
      if (this.currentAnimation === 'idle' || !this.animationTimeout) {
        resolve();
        return;
      }

      this.animationCompleteCallbacks.push(resolve);
    });
  }

  playAnimation(name: string, autoReset = true): void {
    this.clearAnimationQueue();
    this.clearAnimationTimeout();
    this.startAnimation(name);

    if (!autoReset) {
      return;
    }

    const duration = ANIMATION_DURATIONS[name] ?? 3000;
    if (duration > 0) {
      this.animationTimeout = setTimeout(() => {
        this.restoreIdleState();
        this.notifyAnimationComplete();
      }, duration);
    }
  }

  setExpression(expression: string): boolean {
    if (VALID_EXPRESSIONS.includes(expression as ExpressionType)) {
      this.commitCommand({ facialCue: expression as ExpressionType });
      return true;
    }

    console.warn(`无效的表情类型: ${expression}, 使用默认 neutral`);
    this.commitCommand({ facialCue: 'neutral' });
    return false;
  }

  setExpressionIntensity(intensity: number): void {
    this.commitCommand({ intensity: clampExpressionIntensity(intensity) });
  }

  setEmotion(emotion: string): boolean {
    if (VALID_EMOTIONS.includes(emotion as EmotionType)) {
      const nextEmotion = emotion as EmotionType;
      this.commitCommand({
        mood: nextEmotion,
        facialCue: EMOTION_TO_EXPRESSION[nextEmotion],
      });
      return true;
    }

    console.warn(`无效的情感类型: ${emotion}, 使用默认 neutral`);
    this.commitCommand({ mood: 'neutral', facialCue: 'neutral' });
    return false;
  }

  setBehavior(behavior: string, _params?: unknown): boolean {
    if (VALID_BEHAVIORS.includes(behavior as BehaviorType)) {
      const nextBehavior = behavior as BehaviorType;
      this.commitCommand(behaviorToAvatarCommand(nextBehavior), {
        currentBehavior: nextBehavior,
        currentAnimation: nextBehavior,
      });
      return true;
    }

    console.warn(`无效的行为类型: ${behavior}, 使用默认 idle`);
    this.commitCommand(behaviorToAvatarCommand('idle'), {
      currentBehavior: 'idle',
      currentAnimation: 'idle',
    });
    return false;
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

  performBow(): void {
    this.setEmotion('neutral');
    this.playAnimation('bow');
  }

  performClap(): void {
    this.setEmotion('happy');
    this.playAnimation('clap');
  }

  performThumbsUp(): void {
    this.setEmotion('happy');
    this.playAnimation('thumbsUp');
  }

  performCheer(): void {
    this.setEmotion('happy');
    this.setExpression('laugh');
    this.playAnimation('cheer');
  }

  performShrug(): void {
    this.setEmotion('surprised');
    this.playAnimation('shrug');
  }

  performSleep(): void {
    this.setEmotion('neutral');
    this.setExpression('sad');
    this.playAnimation('sleep');
  }

  private clearAnimationTimeout(): void {
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
      this.animationTimeout = null;
    }
  }
}

export const digitalHumanEngine = new DigitalHumanEngine();
