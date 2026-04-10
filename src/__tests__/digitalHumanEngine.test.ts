import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DigitalHumanEngine } from '../core/avatar/DigitalHumanEngine';
import type { StateAdapter } from '../core/avatar/DigitalHumanEngine';
import type { ExpressionType, EmotionType, BehaviorType } from '../store/digitalHumanStore';

function createMockState(): StateAdapter & Record<string, ReturnType<typeof vi.fn>> {
  return {
    play: vi.fn(),
    pause: vi.fn(),
    reset: vi.fn(),
    setExpression: vi.fn(),
    setExpressionIntensity: vi.fn(),
    setEmotion: vi.fn(),
    setBehavior: vi.fn(),
    setAnimation: vi.fn(),
    setPlaying: vi.fn(),
  };
}

describe('DigitalHumanEngine', () => {
  let state: ReturnType<typeof createMockState>;
  let engine: DigitalHumanEngine;

  beforeEach(() => {
    state = createMockState();
    engine = new DigitalHumanEngine(state);
  });

  afterEach(() => {
    engine.dispose();
  });

  // --- Delegation to StateAdapter ---

  it('play delegates to state.play', () => {
    engine.play();
    expect(state.play).toHaveBeenCalledTimes(1);
  });

  it('pause delegates to state.pause', () => {
    engine.pause();
    expect(state.pause).toHaveBeenCalledTimes(1);
  });

  it('reset delegates to state.reset', () => {
    engine.reset();
    expect(state.reset).toHaveBeenCalledTimes(1);
  });

  it('setExpressionIntensity delegates to state', () => {
    engine.setExpressionIntensity(0.5);
    expect(state.setExpressionIntensity).toHaveBeenCalledWith(0.5);
  });

  // --- setExpression validation ---

  it('setExpression accepts valid expressions', () => {
    engine.setExpression('smile');
    expect(state.setExpression).toHaveBeenCalledWith('smile');
  });

  it('setExpression falls back to neutral for invalid expression', () => {
    engine.setExpression('invalid_expr');
    expect(state.setExpression).toHaveBeenCalledWith('neutral');
  });

  // --- setEmotion + mapping ---

  it('setEmotion happy sets emotion and maps to smile expression', () => {
    engine.setEmotion('happy');
    expect(state.setEmotion).toHaveBeenCalledWith('happy');
    expect(state.setExpression).toHaveBeenCalledWith('smile');
  });

  it('setEmotion surprised maps to surprise expression', () => {
    engine.setEmotion('surprised');
    expect(state.setEmotion).toHaveBeenCalledWith('surprised');
    expect(state.setExpression).toHaveBeenCalledWith('surprise');
  });

  it('setEmotion neutral maps to neutral expression', () => {
    engine.setEmotion('neutral');
    expect(state.setEmotion).toHaveBeenCalledWith('neutral');
    expect(state.setExpression).toHaveBeenCalledWith('neutral');
  });

  it('setEmotion falls back to neutral for unknown emotion', () => {
    engine.setEmotion('confused');
    expect(state.setEmotion).toHaveBeenCalledWith('neutral');
    expect(state.setExpression).toHaveBeenCalledWith('neutral');
  });

  // --- setBehavior validation ---

  it('setBehavior accepts valid behaviors', () => {
    engine.setBehavior('thinking');
    expect(state.setBehavior).toHaveBeenCalledWith('thinking');
  });

  it('setBehavior falls back to idle for unknown behavior', () => {
    engine.setBehavior('flying');
    expect(state.setBehavior).toHaveBeenCalledWith('idle');
  });

  // --- playAnimation ---

  it('playAnimation sets animation and playing state', () => {
    engine.playAnimation('wave', false);
    expect(state.setAnimation).toHaveBeenCalledWith('wave');
    expect(state.setPlaying).toHaveBeenCalledWith(true);
  });

  it('playAnimation maps animation to behavior', () => {
    engine.playAnimation('wave', false);
    expect(state.setBehavior).toHaveBeenCalledWith('greeting');
  });

  it('playAnimation with autoReset schedules idle reset', () => {
    vi.useFakeTimers();
    engine.playAnimation('wave', true);

    expect(state.setAnimation).toHaveBeenCalledWith('wave');

    vi.advanceTimersByTime(3000);

    expect(state.setAnimation).toHaveBeenCalledWith('idle');
    expect(state.setBehavior).toHaveBeenCalledWith('idle');

    vi.useRealTimers();
  });

  it('playAnimation clears previous timeout on subsequent call', () => {
    vi.useFakeTimers();

    engine.playAnimation('wave', true);
    engine.playAnimation('nod', true);

    // Only nod's timeout should fire
    vi.advanceTimersByTime(2000);
    expect(state.setAnimation).toHaveBeenLastCalledWith('idle');

    vi.useRealTimers();
  });

  it('playAnimation with duration 0 does not schedule idle timeout', () => {
    // ANIMATION_DURATIONS['speak'] = 0; with ?? the value 0 is preserved,
    // so duration > 0 is false and no timeout is scheduled.
    vi.useFakeTimers();

    engine.playAnimation('speak', true);
    expect(state.setAnimation).toHaveBeenCalledWith('speak');

    vi.advanceTimersByTime(10000);
    expect(state.setAnimation).not.toHaveBeenCalledWith('idle');

    vi.useRealTimers();
  });

  // --- Event Emitter ---

  it('emits expression:change event', () => {
    const handler = vi.fn();
    engine.on('expression:change', handler);

    engine.setExpression('smile');
    expect(handler).toHaveBeenCalledWith({ type: 'expression:change', value: 'smile' });
  });

  it('emits emotion:change event', () => {
    const handler = vi.fn();
    engine.on('emotion:change', handler);

    engine.setEmotion('happy');
    expect(handler).toHaveBeenCalledWith({ type: 'emotion:change', value: 'happy' });
  });

  it('emits behavior:change event', () => {
    const handler = vi.fn();
    engine.on('behavior:change', handler);

    engine.setBehavior('thinking');
    expect(handler).toHaveBeenCalledWith({ type: 'behavior:change', value: 'thinking' });
  });

  it('emits animation:start and animation:end events', () => {
    vi.useFakeTimers();
    const startHandler = vi.fn();
    const endHandler = vi.fn();
    engine.on('animation:start', startHandler);
    engine.on('animation:end', endHandler);

    engine.playAnimation('nod', true);
    expect(startHandler).toHaveBeenCalledWith({ type: 'animation:start', value: 'nod' });

    vi.advanceTimersByTime(2000);
    expect(endHandler).toHaveBeenCalledWith({ type: 'animation:end', value: 'nod' });

    vi.useRealTimers();
  });

  it('unsubscribe removes event handler', () => {
    const handler = vi.fn();
    const unsub = engine.on('expression:change', handler);

    unsub();
    engine.setExpression('smile');

    expect(handler).not.toHaveBeenCalled();
  });

  it('event handler error does not crash engine', () => {
    const badHandler = vi.fn(() => { throw new Error('oops'); });
    const goodHandler = vi.fn();

    engine.on('expression:change', badHandler);
    engine.on('expression:change', goodHandler);

    // Should not throw
    engine.setExpression('smile');

    expect(badHandler).toHaveBeenCalled();
    expect(goodHandler).toHaveBeenCalled();
  });

  // --- Convenience methods ---

  it('performGreeting sets happy emotion and wave animation', () => {
    engine.performGreeting();
    expect(state.setEmotion).toHaveBeenCalledWith('happy');
    expect(state.setAnimation).toHaveBeenCalledWith('wave');
  });

  it('performThinking sets neutral emotion and thinking behavior', () => {
    engine.performThinking();
    expect(state.setEmotion).toHaveBeenCalledWith('neutral');
    expect(state.setBehavior).toHaveBeenCalledWith('thinking');
    expect(state.setAnimation).toHaveBeenCalledWith('think');
  });

  it('performListening sets neutral emotion and listening behavior', () => {
    engine.performListening();
    expect(state.setEmotion).toHaveBeenCalledWith('neutral');
    expect(state.setBehavior).toHaveBeenCalledWith('listening');
  });

  // --- Dispose ---

  it('dispose clears animation timeout and listeners', () => {
    vi.useFakeTimers();
    const handler = vi.fn();
    engine.on('expression:change', handler);
    engine.playAnimation('wave', true);

    engine.dispose();

    vi.advanceTimersByTime(10000);
    // After dispose, the timeout should have been cleared
    expect(state.setAnimation).not.toHaveBeenCalledWith('idle');

    // Events should not fire after dispose
    engine.setExpression('smile');
    expect(handler).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('reset clears animation timeout', () => {
    vi.useFakeTimers();
    engine.playAnimation('wave', true);
    engine.reset();

    vi.advanceTimersByTime(10000);
    expect(state.setAnimation).not.toHaveBeenCalledWith('idle');

    vi.useRealTimers();
  });
});
