import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requestImmersiveArSession } from '@/core/performance/arSession';

describe('requestImmersiveArSession', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('requests an immersive-ar session with a dom overlay fallback when xr is available', async () => {
    const requestSession = vi.fn().mockResolvedValue({ kind: 'session' });

    const session = await requestImmersiveArSession({
      xr: {
        requestSession,
      },
    } as unknown as Navigator);

    expect(requestSession).toHaveBeenCalledWith(
      'immersive-ar',
      expect.objectContaining({
        requiredFeatures: ['local-floor'],
        optionalFeatures: ['dom-overlay'],
      }),
    );
    expect(session).toEqual({ kind: 'session' });
  });
});
