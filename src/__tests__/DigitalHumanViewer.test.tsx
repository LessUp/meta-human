import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DigitalHumanViewer from '@/components/viewer/DigitalHumanViewer';
import { useSystemStore } from '@/store/systemStore';

const immersiveSessionBridgeMock = vi.fn();

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="canvas">{children}</div>
  ),
}));

vi.mock('@react-three/drei', () => ({
  Html: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/viewer/Scene', () => ({
  Scene: () => <div data-testid="scene" />,
}));

vi.mock('@/components/viewer/PerformanceTracker', () => ({
  PerformanceTracker: () => <div data-testid="performance-tracker" />,
}));

vi.mock('@/components/viewer/ImmersiveSessionBridge', () => ({
  ImmersiveSessionBridge: (props: unknown) => {
    immersiveSessionBridgeMock(props);
    return <div data-testid="immersive-session-bridge" />;
  },
}));

describe('DigitalHumanViewer', () => {
  beforeEach(() => {
    immersiveSessionBridgeMock.mockReset();
    useSystemStore.setState({
      immersiveMode: 'standard',
      immersiveSession: null,
      immersiveError: null,
    });
  });

  it('passes the active immersive session into the bridge', () => {
    const session = { kind: 'immersive-session' } as unknown as XRSession;
    useSystemStore.setState({
      immersiveMode: 'ar-active',
      immersiveSession: session,
      immersiveError: null,
    });

    render(<DigitalHumanViewer showControls={false} />);

    expect(immersiveSessionBridgeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        session,
      }),
    );
  });
});
