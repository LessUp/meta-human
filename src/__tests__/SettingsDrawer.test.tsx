import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SettingsDrawer from '@/components/SettingsDrawer';

vi.mock('@/hooks', () => ({
  useFocusTrap: () => ({ current: null }),
  useTheme: () => ({
    isDark: true,
    toggleTheme: vi.fn(),
  }),
}));

vi.mock('@/components/ControlPanel', () => ({
  default: () => <div data-testid="control-panel" />,
}));

vi.mock('@/components/ExpressionControlPanel', () => ({
  default: () => <div data-testid="expression-panel" />,
}));

vi.mock('@/components/BehaviorControlPanel', () => ({
  default: () => <div data-testid="behavior-panel" />,
}));

vi.mock('@/components/VisionMirrorPanel', () => ({
  default: () => <div data-testid="vision-panel" />,
}));

vi.mock('@/components/VoiceInteractionPanel', () => ({
  default: () => <div data-testid="voice-panel" />,
}));

describe('SettingsDrawer', () => {
  it('includes an avatar tab for custom avatar management', () => {
    render(
      <SettingsDrawer
        show={true}
        activeTab="basic"
        onTabChange={vi.fn()}
        onClose={vi.fn()}
        onPlayPause={vi.fn()}
        onReset={vi.fn()}
        onToggleRecording={vi.fn()}
        onToggleMute={vi.fn()}
        onToggleAutoRotate={vi.fn()}
        onVoiceCommand={vi.fn()}
        onChatSend={vi.fn()}
        onExpressionChange={vi.fn()}
        onBehaviorChange={vi.fn()}
        onAvatarUpload={vi.fn()}
        onUseBuiltInAvatar={vi.fn()}
        avatarFileName={null}
        avatarLoadStatus="ready"
        avatarLoadError={null}
        onEmotionChange={vi.fn()}
        onHeadMotion={vi.fn()}
      />,
    );

    expect(screen.getByRole('tab', { name: 'avatar' })).toBeInTheDocument();
  });

  it('forwards avatar upload and built-in reset actions from the avatar tab', () => {
    const onAvatarUpload = vi.fn();
    const onUseBuiltInAvatar = vi.fn();

    render(
      <SettingsDrawer
        show={true}
        activeTab="avatar"
        onTabChange={vi.fn()}
        onClose={vi.fn()}
        onPlayPause={vi.fn()}
        onReset={vi.fn()}
        onToggleRecording={vi.fn()}
        onToggleMute={vi.fn()}
        onToggleAutoRotate={vi.fn()}
        onVoiceCommand={vi.fn()}
        onChatSend={vi.fn()}
        onExpressionChange={vi.fn()}
        onBehaviorChange={vi.fn()}
        onAvatarUpload={onAvatarUpload}
        onUseBuiltInAvatar={onUseBuiltInAvatar}
        avatarFileName="avatar.glb"
        avatarLoadStatus="error"
        avatarLoadError="load failed"
        onEmotionChange={vi.fn()}
        onHeadMotion={vi.fn()}
      />,
    );

    const input = screen.getByLabelText('上传自定义头像');
    const file = new File(['avatar'], 'avatar.glb', { type: 'model/gltf-binary' });
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: '使用内置头像' }));

    expect(onAvatarUpload).toHaveBeenCalledWith(file);
    expect(onUseBuiltInAvatar).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('alert')).toHaveTextContent('load failed');
  });
});
