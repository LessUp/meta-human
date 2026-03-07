import { useDigitalHumanStore, type EmotionType, type ExpressionType, type BehaviorType } from '../../store/digitalHumanStore';

// 表情与情感的映射
const EMOTION_TO_EXPRESSION: Record<EmotionType, ExpressionType> = {
  'neutral': 'neutral',
  'happy': 'smile',
  'surprised': 'surprise',
  'sad': 'sad',
  'angry': 'angry',
};

// 动作持续时间配置
const ANIMATION_DURATIONS: Record<string, number> = {
  'wave': 3000,
  'greet': 3000,
  'nod': 2000,
  'shakeHead': 2000,
  'dance': 6000,
  'think': 3000,
  'speak': 0,
  'idle': 0,
  'bow': 3000,
  'clap': 3000,
  'thumbsUp': 3000,
  'headTilt': 2500,
  'shrug': 2500,
  'lookAround': 4000,
  'cheer': 4000,
  'sleep': 5000,
  'crossArms': 3000,
  'point': 3000,
};

// 有效的表情类型
const VALID_EXPRESSIONS: ExpressionType[] = [
  'neutral', 'smile', 'laugh', 'surprise', 'sad', 'angry',
  'blink', 'eyebrow_raise', 'eye_blink', 'mouth_open', 'head_nod'
];

// 有效的情感类型
const VALID_EMOTIONS: EmotionType[] = ['neutral', 'happy', 'surprised', 'sad', 'angry'];

// 有效的行为类型
const VALID_BEHAVIORS: BehaviorType[] = [
  'idle', 'greeting', 'listening', 'thinking', 'speaking', 'excited',
  'wave', 'greet', 'think', 'nod', 'shakeHead', 'dance', 'speak', 'waveHand', 'raiseHand',
  'bow', 'clap', 'thumbsUp', 'headTilt', 'shrug', 'lookAround', 'cheer', 'sleep', 'crossArms', 'point'
];

// 动画队列项接口
interface AnimationQueueItem {
  name: string;
  duration: number;
  autoReset: boolean;
  onComplete?: () => void;
}

// 动画选项接口
export interface AnimationOptions {
  duration?: number;
  autoReset?: boolean;
  blendDuration?: number;
  onComplete?: () => void;
}

// 播放动画选项
export interface PlayAnimationOptions extends AnimationOptions {
  immediate?: boolean;
}

export class DigitalHumanEngine {
  private animationQueue: AnimationQueueItem[] = [];
  private currentAnimation: string = 'idle';
  private isProcessingQueue: boolean = false;
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

  // 获取动画队列长度
  getQueueLength(): number {
    return this.animationQueue.length;
  }

  // 清空动画队列
  clearAnimationQueue(): void {
    this.animationQueue = [];
    this.isProcessingQueue = false;
    this.clearAnimationTimeout();
  }

  // 添加动画到队列
  queueAnimation(name: string, options: AnimationOptions = {}): void {
    const {
      duration = ANIMATION_DURATIONS[name] || 3000,
      autoReset = true,
      onComplete,
    } = options;

    this.animationQueue.push({
      name,
      duration,
      autoReset,
      onComplete,
    });

    // 如果没有在处理队列，开始处理
    if (!this.isProcessingQueue) {
      this.processAnimationQueue();
    }
  }

  // 处理动画队列
  private async processAnimationQueue(): Promise<void> {
    if (this.isProcessingQueue || this.animationQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.animationQueue.length > 0) {
      const item = this.animationQueue.shift()!;
      await this.playAnimationInternal(item.name, item.duration, item.autoReset);
      item.onComplete?.();
    }

    this.isProcessingQueue = false;
  }

  // 内部播放动画方法
  private playAnimationInternal(
    name: string,
    duration: number,
    autoReset: boolean
  ): Promise<void> {
    return new Promise((resolve) => {
      const store = useDigitalHumanStore.getState();

      this.clearAnimationTimeout();
      this.currentAnimation = name;

      store.setAnimation(name);
      store.setPlaying(true);

      // 设置对应的行为状态
      const behaviorMap: Record<string, BehaviorType> = {
        'wave': 'greeting',
        'greet': 'greeting',
        'nod': 'listening',
        'shakeHead': 'idle',
        'dance': 'excited',
        'think': 'thinking',
        'speak': 'speaking',
        'bow': 'bow',
        'clap': 'clap',
        'thumbsUp': 'thumbsUp',
        'headTilt': 'headTilt',
        'shrug': 'shrug',
        'lookAround': 'lookAround',
        'cheer': 'cheer',
        'sleep': 'sleep',
        'crossArms': 'crossArms',
        'point': 'point',
      };

      if (behaviorMap[name]) {
        store.setBehavior(behaviorMap[name]);
      }

      // 自动恢复到 idle 状态
      if (autoReset && duration > 0) {
        this.animationTimeout = setTimeout(() => {
          store.setAnimation('idle');
          store.setBehavior('idle');
          this.currentAnimation = 'idle';
          this.notifyAnimationComplete();
          resolve();
        }, duration);
      } else if (duration === 0) {
        resolve();
      } else {
        this.animationTimeout = setTimeout(() => {
          this.notifyAnimationComplete();
          resolve();
        }, duration);
      }
    });
  }

  private notifyAnimationComplete(): void {
    const callbacks = [...this.animationCompleteCallbacks];
    this.animationCompleteCallbacks = [];
    callbacks.forEach(cb => cb());
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

  playAnimation(name: string, autoReset: boolean = true): void {
    const store = useDigitalHumanStore.getState();

    this.clearAnimationQueue();
    this.clearAnimationTimeout();
    this.currentAnimation = name;

    store.setAnimation(name);
    store.setPlaying(true);

    const behaviorMap: Record<string, BehaviorType> = {
      'wave': 'greeting',
      'greet': 'greeting',
      'nod': 'listening',
      'shakeHead': 'idle',
      'dance': 'excited',
      'think': 'thinking',
      'speak': 'speaking',
      'bow': 'bow',
      'clap': 'clap',
      'thumbsUp': 'thumbsUp',
      'headTilt': 'headTilt',
      'shrug': 'shrug',
      'lookAround': 'lookAround',
      'cheer': 'cheer',
      'sleep': 'sleep',
      'crossArms': 'crossArms',
      'point': 'point',
    };

    if (behaviorMap[name]) {
      store.setBehavior(behaviorMap[name]);
    }

    // 自动恢复到 idle 状态
    if (autoReset) {
      const duration = ANIMATION_DURATIONS[name] || 3000;
      if (duration > 0) {
        this.animationTimeout = setTimeout(() => {
          store.setAnimation('idle');
          store.setBehavior('idle');
          this.currentAnimation = 'idle';
          this.notifyAnimationComplete();
        }, duration);
      }
    }
  }

  // 设置表情（带验证）
  setExpression(expression: string): boolean {
    const store = useDigitalHumanStore.getState();

    if (VALID_EXPRESSIONS.includes(expression as ExpressionType)) {
      store.setExpression(expression as ExpressionType);
      return true;
    } else {
      console.warn(`无效的表情类型: ${expression}, 使用默认 neutral`);
      store.setExpression('neutral');
      return false;
    }
  }

  setExpressionIntensity(intensity: number): void {
    const { setExpressionIntensity } = useDigitalHumanStore.getState();
    setExpressionIntensity(intensity);
  }

  // 设置情感（带验证和自动表情映射）
  setEmotion(emotion: string): boolean {
    const store = useDigitalHumanStore.getState();

    if (VALID_EMOTIONS.includes(emotion as EmotionType)) {
      store.setEmotion(emotion as EmotionType);
      // 自动设置对应的表情
      const mappedExpression = EMOTION_TO_EXPRESSION[emotion as EmotionType];
      if (mappedExpression) {
        store.setExpression(mappedExpression);
      }
      return true;
    } else {
      console.warn(`无效的情感类型: ${emotion}, 使用默认 neutral`);
      store.setEmotion('neutral');
      store.setExpression('neutral');
      return false;
    }
  }

  // 设置行为（带验证）
  setBehavior(behavior: string, _params?: unknown): boolean {
    const store = useDigitalHumanStore.getState();

    if (VALID_BEHAVIORS.includes(behavior as BehaviorType)) {
      store.setBehavior(behavior as BehaviorType);
      return true;
    } else {
      console.warn(`无效的行为类型: ${behavior}, 使用默认 idle`);
      store.setBehavior('idle');
      return false;
    }
  }

  // 组合动作：打招呼
  performGreeting(): void {
    this.setEmotion('happy');
    this.playAnimation('wave');
  }

  // 组合动作：思考
  performThinking(): void {
    this.setEmotion('neutral');
    this.setBehavior('thinking');
    this.playAnimation('think');
  }

  // 组合动作：聆听
  performListening(): void {
    this.setEmotion('neutral');
    this.setBehavior('listening');
    this.playAnimation('nod', false);
  }

  // 组合动作：鞠躬
  performBow(): void {
    this.setEmotion('neutral');
    this.playAnimation('bow');
  }

  // 组合动作：拍手
  performClap(): void {
    this.setEmotion('happy');
    this.playAnimation('clap');
  }

  // 组合动作：竖大拇指
  performThumbsUp(): void {
    this.setEmotion('happy');
    this.playAnimation('thumbsUp');
  }

  // 组合动作：欢呼
  performCheer(): void {
    this.setEmotion('happy');
    this.setExpression('laugh');
    this.playAnimation('cheer');
  }

  // 组合动作：耸肩
  performShrug(): void {
    this.setEmotion('surprised');
    this.playAnimation('shrug');
  }

  // 组合动作：睡觉
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
