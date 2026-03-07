import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DigitalHumanEngine } from '../core/avatar/DigitalHumanEngine';
import { useDigitalHumanStore } from '../store/digitalHumanStore';

let engine: DigitalHumanEngine;

beforeEach(() => {
  vi.useFakeTimers();
  engine = new DigitalHumanEngine();
  useDigitalHumanStore.getState().reset();
});

afterEach(() => {
  engine.reset();
  vi.useRealTimers();
});

describe('DigitalHumanEngine — 基础控制', () => {
  it('play 将 isPlaying 设为 true', () => {
    engine.play();
    expect(useDigitalHumanStore.getState().isPlaying).toBe(true);
  });

  it('pause 将 isPlaying 设为 false', () => {
    engine.play();
    engine.pause();
    expect(useDigitalHumanStore.getState().isPlaying).toBe(false);
  });

  it('reset 重置所有状态并清空队列', () => {
    engine.play();
    engine.playAnimation('wave');
    engine.reset();
    expect(useDigitalHumanStore.getState().isPlaying).toBe(false);
    expect(useDigitalHumanStore.getState().currentAnimation).toBe('idle');
    expect(engine.getQueueLength()).toBe(0);
  });
});

describe('DigitalHumanEngine — 表情验证', () => {
  it('setExpression 有效表情返回 true', () => {
    expect(engine.setExpression('smile')).toBe(true);
    expect(useDigitalHumanStore.getState().currentExpression).toBe('smile');
  });

  it('setExpression 无效表情回退到 neutral', () => {
    expect(engine.setExpression('invalid_expression')).toBe(false);
    expect(useDigitalHumanStore.getState().currentExpression).toBe('neutral');
  });

  it('setExpression 支持所有有效表情类型', () => {
    const validExpressions = ['neutral', 'smile', 'laugh', 'surprise', 'sad', 'angry', 'blink', 'eyebrow_raise', 'eye_blink', 'mouth_open', 'head_nod'];
    for (const expr of validExpressions) {
      expect(engine.setExpression(expr)).toBe(true);
      expect(useDigitalHumanStore.getState().currentExpression).toBe(expr);
    }
  });

  it('setExpressionIntensity 更新强度', () => {
    engine.setExpressionIntensity(0.5);
    expect(useDigitalHumanStore.getState().expressionIntensity).toBe(0.5);
  });
});

describe('DigitalHumanEngine — 情感验证', () => {
  it('setEmotion 有效情感返回 true 并映射表情', () => {
    expect(engine.setEmotion('happy')).toBe(true);
    expect(useDigitalHumanStore.getState().currentEmotion).toBe('happy');
    expect(useDigitalHumanStore.getState().currentExpression).toBe('smile');
  });

  it('setEmotion surprised 映射到 surprise 表情', () => {
    engine.setEmotion('surprised');
    expect(useDigitalHumanStore.getState().currentExpression).toBe('surprise');
  });

  it('setEmotion 无效情感回退到 neutral', () => {
    expect(engine.setEmotion('invalid_emotion')).toBe(false);
    expect(useDigitalHumanStore.getState().currentEmotion).toBe('neutral');
    expect(useDigitalHumanStore.getState().currentExpression).toBe('neutral');
  });
});

describe('DigitalHumanEngine — 行为验证', () => {
  it('setBehavior 有效行为返回 true', () => {
    expect(engine.setBehavior('greeting')).toBe(true);
    expect(useDigitalHumanStore.getState().currentBehavior).toBe('greeting');
  });

  it('setBehavior 无效行为回退到 idle', () => {
    expect(engine.setBehavior('invalid_behavior')).toBe(false);
    expect(useDigitalHumanStore.getState().currentBehavior).toBe('idle');
  });

  it('setBehavior 支持所有新增行为类型', () => {
    const newBehaviors = ['bow', 'clap', 'thumbsUp', 'headTilt', 'shrug', 'lookAround', 'cheer', 'sleep', 'crossArms', 'point'];
    for (const b of newBehaviors) {
      expect(engine.setBehavior(b)).toBe(true);
      expect(useDigitalHumanStore.getState().currentBehavior).toBe(b);
    }
  });
});

describe('DigitalHumanEngine — playAnimation', () => {
  it('播放动画并设置对应行为', () => {
    engine.playAnimation('wave');
    const state = useDigitalHumanStore.getState();
    expect(state.currentAnimation).toBe('wave');
    expect(state.currentBehavior).toBe('greeting');
    expect(state.isPlaying).toBe(true);
  });

  it('播放 dance 映射到 excited 行为', () => {
    engine.playAnimation('dance');
    expect(useDigitalHumanStore.getState().currentBehavior).toBe('excited');
  });

  it('autoReset=true 时到期后恢复 idle', () => {
    engine.playAnimation('wave', true);
    expect(useDigitalHumanStore.getState().currentAnimation).toBe('wave');

    vi.advanceTimersByTime(3100); // wave 持续 3000ms
    expect(useDigitalHumanStore.getState().currentAnimation).toBe('idle');
    expect(useDigitalHumanStore.getState().currentBehavior).toBe('idle');
  });

  it('autoReset=false 时不自动恢复', () => {
    engine.playAnimation('nod', false);
    vi.advanceTimersByTime(5000);
    expect(useDigitalHumanStore.getState().currentAnimation).toBe('nod');
  });

  it('新动画会清除前一个动画的定时器', () => {
    engine.playAnimation('wave');
    engine.playAnimation('dance');

    vi.advanceTimersByTime(3100); // wave 的超时不应生效
    expect(useDigitalHumanStore.getState().currentAnimation).toBe('dance');

    vi.advanceTimersByTime(3000); // dance 6000ms 总共推进 6100ms
    expect(useDigitalHumanStore.getState().currentAnimation).toBe('idle');
  });
});

describe('DigitalHumanEngine — 动画队列', () => {
  it('queueAnimation 添加到队列', () => {
    engine.queueAnimation('wave');
    // 队列正在处理中，第一个已经弹出
    expect(useDigitalHumanStore.getState().currentAnimation).toBe('wave');
  });

  it('队列按顺序执行', async () => {
    engine.queueAnimation('wave', { duration: 100 });
    engine.queueAnimation('dance', { duration: 100 });

    expect(useDigitalHumanStore.getState().currentAnimation).toBe('wave');

    await vi.advanceTimersByTimeAsync(150);
    expect(useDigitalHumanStore.getState().currentAnimation).toBe('dance');
  });

  it('clearAnimationQueue 清空队列', () => {
    engine.queueAnimation('wave', { duration: 100 });
    engine.queueAnimation('dance', { duration: 100 });
    engine.clearAnimationQueue();
    expect(engine.getQueueLength()).toBe(0);
  });
});

describe('DigitalHumanEngine — 组合动作', () => {
  it('performGreeting 设置 happy 情感 + wave 动画', () => {
    engine.performGreeting();
    const state = useDigitalHumanStore.getState();
    expect(state.currentEmotion).toBe('happy');
    expect(state.currentAnimation).toBe('wave');
    expect(state.currentBehavior).toBe('greeting');
  });

  it('performBow 设置 neutral 情感 + bow 动画', () => {
    engine.performBow();
    const state = useDigitalHumanStore.getState();
    expect(state.currentEmotion).toBe('neutral');
    expect(state.currentAnimation).toBe('bow');
  });

  it('performClap 设置 happy 情感 + clap 动画', () => {
    engine.performClap();
    const state = useDigitalHumanStore.getState();
    expect(state.currentEmotion).toBe('happy');
    expect(state.currentAnimation).toBe('clap');
  });

  it('performThumbsUp 设置 happy 情感 + thumbsUp 动画', () => {
    engine.performThumbsUp();
    const state = useDigitalHumanStore.getState();
    expect(state.currentEmotion).toBe('happy');
    expect(state.currentAnimation).toBe('thumbsUp');
  });

  it('performCheer 设置 happy + laugh + cheer', () => {
    engine.performCheer();
    const state = useDigitalHumanStore.getState();
    expect(state.currentEmotion).toBe('happy');
    expect(state.currentExpression).toBe('laugh');
    expect(state.currentAnimation).toBe('cheer');
  });

  it('performShrug 设置 surprised + shrug', () => {
    engine.performShrug();
    const state = useDigitalHumanStore.getState();
    expect(state.currentEmotion).toBe('surprised');
    expect(state.currentAnimation).toBe('shrug');
  });

  it('performSleep 设置 neutral + sad + sleep', () => {
    engine.performSleep();
    const state = useDigitalHumanStore.getState();
    expect(state.currentEmotion).toBe('neutral');
    expect(state.currentExpression).toBe('sad');
    expect(state.currentAnimation).toBe('sleep');
  });

  it('performThinking 设置 thinking 行为', () => {
    engine.performThinking();
    expect(useDigitalHumanStore.getState().currentBehavior).toBe('thinking');
  });

  it('performListening 设置 listening 行为 + nod 动画', () => {
    engine.performListening();
    const state = useDigitalHumanStore.getState();
    expect(state.currentBehavior).toBe('listening');
    expect(state.currentAnimation).toBe('nod');
  });

  it('组合动作到期后自动恢复 idle', () => {
    engine.performGreeting();
    vi.advanceTimersByTime(3100);
    expect(useDigitalHumanStore.getState().currentAnimation).toBe('idle');
  });
});

describe('DigitalHumanEngine — waitForCurrentAnimation', () => {
  it('idle 状态立即 resolve', async () => {
    const resolved = vi.fn();
    engine.waitForCurrentAnimation().then(resolved);
    await vi.advanceTimersByTimeAsync(0);
    expect(resolved).toHaveBeenCalled();
  });

  it('动画播放期间等待到完成', async () => {
    engine.playAnimation('wave');
    const resolved = vi.fn();
    engine.waitForCurrentAnimation().then(resolved);

    await vi.advanceTimersByTimeAsync(1000);
    expect(resolved).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2100);
    expect(resolved).toHaveBeenCalled();
  });
});
