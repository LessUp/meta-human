import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PresetActionRunner } from '@/core/voiceCommand/presetActions';
import type { AvatarControls } from '@/core/voiceCommand/types';

function createAvatarControls(): AvatarControls {
  return {
    setEmotion: vi.fn(),
    setExpression: vi.fn(),
    setAnimation: vi.fn(),
    setBehavior: vi.fn(),
    speak: vi.fn(),
  };
}

describe('PresetActionRunner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('drops completed timers before clearTimers runs', () => {
    const avatar = createAvatarControls();
    const runner = new PresetActionRunner(avatar);
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    runner.scheduleExpressionReset('smile', 1000);
    vi.advanceTimersByTime(1000);
    clearTimeoutSpy.mockClear();

    runner.clearTimers();

    expect(avatar.setExpression).toHaveBeenCalledWith('neutral');
    expect(clearTimeoutSpy).not.toHaveBeenCalled();
  });
});
