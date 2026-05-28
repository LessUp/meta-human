import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ImmersiveSessionBridge } from '@/components/viewer/ImmersiveSessionBridge';

const setSessionMock = vi.fn();
const glMock = {
  xr: {
    enabled: false,
    setSession: setSessionMock,
  },
};

vi.mock('@react-three/fiber', () => ({
  useThree: () => ({
    gl: glMock,
  }),
}));

describe('ImmersiveSessionBridge', () => {
  beforeEach(() => {
    glMock.xr.enabled = false;
    setSessionMock.mockReset();
    setSessionMock.mockResolvedValue(undefined);
  });

  it('enables xr on the renderer and forwards the active session', () => {
    const session = { kind: 'immersive-session' } as unknown as XRSession;

    render(<ImmersiveSessionBridge session={session} />);

    expect(glMock.xr.enabled).toBe(true);
    expect(setSessionMock).toHaveBeenCalledWith(session);
  });

  it('disables xr when no immersive session is active', () => {
    glMock.xr.enabled = true;

    render(<ImmersiveSessionBridge session={null} />);

    expect(glMock.xr.enabled).toBe(false);
    expect(setSessionMock).not.toHaveBeenCalled();
  });
});
