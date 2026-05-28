import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TopHUD from '../components/TopHUD';
import { useDigitalHumanStore } from '../store/digitalHumanStore';
import { useChatSessionStore } from '../store/chatSessionStore';
import { useSystemStore } from '../store/systemStore';

const getDeviceCapabilitiesMock = vi.fn(() => ({
  supportsTouchInput: false,
  supportsWebXR: false,
}));

vi.mock('../core/performance', () => ({
  getDeviceCapabilities: () => getDeviceCapabilitiesMock(),
}));

describe('TopHUD', () => {
  beforeEach(() => {
    getDeviceCapabilitiesMock.mockReset();
    getDeviceCapabilitiesMock.mockReturnValue({
      supportsTouchInput: false,
      supportsWebXR: false,
    });
    useDigitalHumanStore.setState({
      currentBehavior: 'idle',
    });
    useChatSessionStore.setState({
      sessionId: 'session_test',
      chatHistory: [],
    });
    useSystemStore.setState({
      isConnected: true,
      connectionStatus: 'connected',
      isLoading: false,
      error: null,
      lastErrorTime: null,
      chatTransportMode: 'sse',
      chatPerformance: {
        status: 'idle',
        firstTokenMs: null,
        responseCompleteMs: null,
        startedAt: null,
        completedAt: null,
      },
    });
  });

  it('shows the current transport mode from system store', () => {
    render(
      <TopHUD
        onToggleSettings={vi.fn()}
        onReconnect={vi.fn()}
        onNewSession={vi.fn()}
        onToggleImmersiveAr={vi.fn()}
      />,
    );

    expect(screen.getByText('协议:')).toBeInTheDocument();
    expect(screen.getByText('SSE')).toBeInTheDocument();
  });

  it('maps websocket mode to a user-facing label', () => {
    useSystemStore.setState({ chatTransportMode: 'websocket' });

    render(
      <TopHUD
        onToggleSettings={vi.fn()}
        onReconnect={vi.fn()}
        onNewSession={vi.fn()}
        onToggleImmersiveAr={vi.fn()}
      />,
    );

    expect(screen.getByText('WebSocket')).toBeInTheDocument();
  });

  it('shows latest chat timing metrics when available', () => {
    useSystemStore.setState({
      chatPerformance: {
        status: 'completed',
        firstTokenMs: 120,
        responseCompleteMs: 560,
        startedAt: 1000,
        completedAt: 1560,
      },
    });

    render(
      <TopHUD
        onToggleSettings={vi.fn()}
        onReconnect={vi.fn()}
        onNewSession={vi.fn()}
        onToggleImmersiveAr={vi.fn()}
      />,
    );

    expect(screen.getByText('120ms')).toBeInTheDocument();
    expect(screen.getByText('560ms')).toBeInTheDocument();
  });

  it('surfaces an AR-ready badge when touch and WebXR are both available', () => {
    getDeviceCapabilitiesMock.mockReturnValue({
      supportsTouchInput: true,
      supportsWebXR: true,
    });

    render(
      <TopHUD
        onToggleSettings={vi.fn()}
        onReconnect={vi.fn()}
        onNewSession={vi.fn()}
        onToggleImmersiveAr={vi.fn()}
      />,
    );

    expect(screen.getByText('AR Ready')).toBeInTheDocument();
  });

  it('shows an enter-ar action when immersive AR is available but not active yet', () => {
    getDeviceCapabilitiesMock.mockReturnValue({
      supportsTouchInput: true,
      supportsWebXR: true,
    });
    useSystemStore.setState({
      ...(useSystemStore.getState() as unknown as Record<string, unknown>),
      immersiveMode: 'standard',
    } as unknown as Partial<ReturnType<typeof useSystemStore.getState>>);

    render(
      <TopHUD
        onToggleSettings={vi.fn()}
        onReconnect={vi.fn()}
        onNewSession={vi.fn()}
        onToggleImmersiveAr={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: '进入 AR 模式' })).toBeInTheDocument();
  });

  it('shows the active service endpoint and failover count when routing diagnostics are available', () => {
    useSystemStore.setState({
      ...(useSystemStore.getState() as unknown as Record<string, unknown>),
      connectionDiagnostics: {
        lastHealthCheckAt: null,
        lastHealthCheckLatencyMs: null,
        lastDegradedAt: null,
        lastDegradedReason: null,
        activeEndpoint: 'http://backup:8000',
        failoverCount: 2,
        lastFailoverAt: 123456,
      },
    } as unknown as Partial<ReturnType<typeof useSystemStore.getState>>);

    render(
      <TopHUD
        onToggleSettings={vi.fn()}
        onReconnect={vi.fn()}
        onNewSession={vi.fn()}
        onToggleImmersiveAr={vi.fn()}
      />,
    );

    expect(screen.getByText('backup:8000')).toBeInTheDocument();
    expect(screen.getByText('2次')).toBeInTheDocument();
  });
});
