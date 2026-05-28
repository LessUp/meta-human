import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import VoiceInteractionPanel from '@/components/VoiceInteractionPanel';

vi.mock('@/hooks/useVoiceInteraction', () => ({
  useVoiceInteraction: () => ({
    isSupported: true,
    isRecording: false,
    isMuted: false,
    transcript: '',
    availableVoices: [],
    voice: null,
    volume: 0.8,
    pitch: 1,
    rate: 1,
    setVolume: vi.fn(),
    setPitch: vi.fn(),
    setRate: vi.fn(),
    setVoice: vi.fn(),
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    toggleRecording: vi.fn(),
    toggleMute: vi.fn(),
    speak: vi.fn(),
  }),
}));

describe('VoiceInteractionPanel', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('surfaces language selection and localizes quick test content', () => {
    localStorage.setItem('preferred-lang', 'en');

    render(<VoiceInteractionPanel onTranscript={vi.fn()} />);

    const languageSelect = screen.getByLabelText('Language');
    expect(languageSelect).toHaveValue('en');
    expect(
      screen.getByRole('button', { name: 'Hello! I am your digital human assistant.' }),
    ).toBeInTheDocument();

    fireEvent.change(languageSelect, { target: { value: 'zh-CN' } });

    expect(localStorage.getItem('preferred-lang')).toBe('zh-CN');
  });
});
