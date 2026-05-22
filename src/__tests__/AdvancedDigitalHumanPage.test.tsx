import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdvancedDigitalHumanPage from '@/pages/AdvancedDigitalHumanPage';
import { useDigitalHumanStore } from '@/store/digitalHumanStore';

const useChatStreamMock = vi.fn();

vi.mock('@/components/viewer', () => ({
  DigitalHumanViewer: () => <div data-testid="viewer" />,
}));

vi.mock('@/components/TopHUD', () => ({
  default: () => <div data-testid="top-hud" />,
}));

vi.mock('@/components/SettingsDrawer', () => ({
  default: () => <div data-testid="settings-drawer" />,
}));

vi.mock('@/components/ChatDock', () => ({
  default: () => <div data-testid="chat-dock" />,
}));

vi.mock('@/hooks/useConnectionHealth', () => ({
  useConnectionHealth: () => ({
    reconnect: vi.fn(),
  }),
}));

vi.mock('@/hooks/useAdvancedDigitalHumanController', () => ({
  useAdvancedDigitalHumanController: () => ({
    activeTab: 'basic',
    autoRotate: false,
    closeSettings: vi.fn(),
    handleBehaviorChange: vi.fn(),
    handleEmotionChange: vi.fn(),
    handleExpressionChange: vi.fn(),
    handleHeadMotion: vi.fn(),
    handleModelLoad: vi.fn(),
    handleNewSession: vi.fn(),
    handlePlayPause: vi.fn(),
    handleReset: vi.fn(),
    handleToggleRecording: vi.fn(),
    handleVoiceCommand: vi.fn(),
    setActiveTab: vi.fn(),
    showSettings: false,
    toggleMute: vi.fn(),
    toggleSettings: vi.fn(),
    toggleAutoRotate: vi.fn(),
    setConnectionStatus: vi.fn(),
    setError: vi.fn(),
    clearError: vi.fn(),
    sessionId: 'session_test',
  }),
}));

vi.mock('@/hooks/useChatStream', () => ({
  useChatStream: (...args: unknown[]) => useChatStreamMock(...args),
}));

describe('AdvancedDigitalHumanPage', () => {
  beforeEach(() => {
    useChatStreamMock.mockReset();
    useChatStreamMock.mockReturnValue({
      chatInput: '',
      setChatInput: vi.fn(),
      isChatLoading: false,
      handleChatSend: vi.fn(),
    });

    useDigitalHumanStore.setState({
      isMuted: true,
    });
  });

  it('passes the muted state from the store into useChatStream', () => {
    render(<AdvancedDigitalHumanPage />);

    expect(useChatStreamMock).toHaveBeenCalledWith(
      expect.objectContaining({
        isMuted: true,
      }),
    );
  });
});
