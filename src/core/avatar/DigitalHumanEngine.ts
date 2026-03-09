/**
 * @deprecated 此文件为兼容层，请迁移到新模块：
 * - 引擎: import { createDigitalHumanEngine } from '@/core/avatar/engine'
 * - 动画队列: import { createAnimationQueue } from '@/core/avatar/animation-queue'
 * - 预设: import { PRESET_ACTIONS } from '@/core/avatar/presets'
 */

import { getCoreInstances } from "../index";

// 重新导出类型（兼容旧接口）
export type { AnimationOptions, PlayAnimationOptions } from "../types";

// 兼容旧的类导出（实际上是对新引擎的 Proxy）
export class DigitalHumanEngine {
  private get _engine() {
    return getCoreInstances().engine;
  }

  play() {
    this._engine.play();
  }
  pause() {
    this._engine.pause();
  }
  reset() {
    this._engine.reset();
  }
  getQueueLength() {
    return this._engine.getQueueLength();
  }
  clearAnimationQueue() {
    this._engine.clearAnimationQueue();
  }
  queueAnimation(name: string, options?: any) {
    this._engine.queueAnimation(name, options);
  }
  waitForCurrentAnimation() {
    return this._engine.waitForCurrentAnimation();
  }
  playAnimation(name: string, autoReset?: boolean) {
    this._engine.playAnimation(name, autoReset);
  }
  setExpression(expression: string) {
    return this._engine.setExpression(expression);
  }
  setExpressionIntensity(intensity: number) {
    this._engine.setExpressionIntensity(intensity);
  }
  setEmotion(emotion: string) {
    return this._engine.setEmotion(emotion);
  }
  setBehavior(behavior: string, params?: unknown) {
    return this._engine.setBehavior(behavior, params);
  }
  performGreeting() {
    this._engine.performGreeting();
  }
  performThinking() {
    this._engine.performThinking();
  }
  performListening() {
    this._engine.performListening();
  }
  performBow() {
    this._engine.performBow();
  }
  performClap() {
    this._engine.performClap();
  }
  performThumbsUp() {
    this._engine.performThumbsUp();
  }
  performCheer() {
    this._engine.performCheer();
  }
  performShrug() {
    this._engine.performShrug();
  }
  performSleep() {
    this._engine.performSleep();
  }
}

// 兼容旧的单例导出
export const digitalHumanEngine = new DigitalHumanEngine();
