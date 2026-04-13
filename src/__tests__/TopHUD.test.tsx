import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TopHUD from '../components/TopHUD';
import { useDigitalHumanStore } from '../store/digitalHumanStore';
import { useChatSessionStore } from '../store/chatSessionStore';
import { useSystemStore } from '../store/systemStore';

describe('TopHUD', () => {
  beforeEach(() => {
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
    render(<TopHUD onToggleSettings={vi.fn()} onReconnect={vi.fn()} onNewSession={vi.fn()} />);

    expect(screen.getByText('协议:')).toBeInTheDocument();
    expect(screen.getByText('SSE')).toBeInTheDocument();
  });

  it('maps websocket mode to a user-facing label', () => {
    useSystemStore.setState({ chatTransportMode: 'websocket' });

    render(<TopHUD onToggleSettings={vi.fn()} onReconnect={vi.fn()} onNewSession={vi.fn()} />);

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

    render(<TopHUD onToggleSettings={vi.fn()} onReconnect={vi.fn()} onNewSession={vi.fn()} />);

    expect(screen.getByText('120ms')).toBeInTheDocument();
    expect(screen.getByText('560ms')).toBeInTheDocument();
  });
});
