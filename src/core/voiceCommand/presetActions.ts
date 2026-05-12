/**
 * Preset action runner.
 *
 * Orchestrates preset animations (greeting, dance, nod, shakeHead).
 * Extracted from ASRService to provide a clean seam.
 */

import { loggers } from '../../lib/logger';
import type { AvatarControls } from './types';

const logger = loggers.audio;

/**
 * Preset action timings (in milliseconds).
 */
const PRESET_TIMINGS = {
  greeting: {
    duration: 4000,
    speech: '您好！很高兴见到您！有什么可以帮助您的吗？',
  },
  dance: {
    duration: 6000,
    speech: '让我为您跳一支舞！',
  },
  nod: {
    duration: 2000,
    speech: '好的，我明白了。',
  },
  shakeHead: {
    duration: 2000,
    speech: '不太确定呢。',
  },
} as const;

/**
 * Runs preset actions for the digital human.
 *
 * Each action:
 * 1. Sets emotion/expression/animation/behavior
 * 2. Speaks a phrase
 * 3. Schedules a reset to idle state
 */
export class PresetActionRunner {
  private readonly avatar: AvatarControls;
  private readonly timers: ReturnType<typeof setTimeout>[] = [];

  constructor(avatar: AvatarControls) {
    this.avatar = avatar;
  }

  /**
   * Clear all pending timers.
   * Call this when disposing or aborting.
   */
  clearTimers(): void {
    this.timers.forEach(clearTimeout);
    this.timers.length = 0;
  }

  /**
   * Run the greeting preset action.
   */
  greeting(): void {
    logger.info('Preset action: greeting');

    this.avatar.setEmotion('happy');
    this.avatar.setExpression('smile');
    this.avatar.setBehavior('greeting');
    this.avatar.setAnimation('wave');
    this.avatar.speak(PRESET_TIMINGS.greeting.speech);

    this.scheduleReset(PRESET_TIMINGS.greeting.duration, () => {
      this.avatar.setEmotion('neutral');
      this.avatar.setExpression('neutral');
      this.avatar.setBehavior('idle');
      this.avatar.setAnimation('idle');
    });
  }

  /**
   * Run the dance preset action.
   */
  dance(): void {
    logger.info('Preset action: dance');

    this.avatar.setAnimation('dance');
    this.avatar.setBehavior('excited');
    this.avatar.setEmotion('happy');
    this.avatar.speak(PRESET_TIMINGS.dance.speech);

    this.scheduleReset(PRESET_TIMINGS.dance.duration, () => {
      this.avatar.setAnimation('idle');
      this.avatar.setBehavior('idle');
      this.avatar.setEmotion('neutral');
    });
  }

  /**
   * Run the nod preset action.
   */
  nod(): void {
    logger.info('Preset action: nod');

    this.avatar.setAnimation('nod');
    this.avatar.setBehavior('listening');
    this.avatar.speak(PRESET_TIMINGS.nod.speech);

    this.scheduleReset(PRESET_TIMINGS.nod.duration, () => {
      this.avatar.setAnimation('idle');
      this.avatar.setBehavior('idle');
    });
  }

  /**
   * Run the shakeHead preset action.
   */
  shakeHead(): void {
    logger.info('Preset action: shakeHead');

    this.avatar.setAnimation('shakeHead');
    this.avatar.speak(PRESET_TIMINGS.shakeHead.speech);

    this.scheduleReset(PRESET_TIMINGS.shakeHead.duration, () => {
      this.avatar.setAnimation('idle');
    });
  }

  /**
   * Reset expression to neutral after a delay.
   * Used for expression commands.
   */
  scheduleExpressionReset(expression: string, delayMs: number = 3000): void {
    if (expression !== 'neutral') {
      this.scheduleReset(delayMs, () => {
        this.avatar.setExpression('neutral');
      });
    }
  }

  private scheduleReset(delay: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, delay));
  }
}
