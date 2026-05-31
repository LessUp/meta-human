import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServicesProvider } from '@/services';
import type { Services } from '@/core/services';
import type { ServiceComposition } from '@/core/serviceComposition';
import { useVoiceInteraction } from '@/hooks/useVoiceInteraction';

function createVoice(name: string, lang: string): SpeechSynthesisVoice {
  return {
    default: false,
    lang,
    localService: true,
    name,
    voiceURI: name,
  } as SpeechSynthesisVoice;
}

function createTestComposition(voices: SpeechSynthesisVoice[]): ServiceComposition {
  const services: Services = {
    dialogue: {
      abortPendingTurn: vi.fn(),
    } as unknown as Services['dialogue'],
    engine: {
      dispose: vi.fn(),
    } as unknown as Services['engine'],
    tts: {
      dispose: vi.fn(),
      getVoices: vi.fn(() => voices),
      speakWithOptions: vi.fn(),
    } as unknown as Services['tts'],
    asr: {
      dispose: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    } as unknown as Services['asr'],
  };

  return {
    services,
    dispose: vi.fn(),
  };
}

describe('useVoiceInteraction', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('prefers voices matching the current UI language and speaks with that language', () => {
    localStorage.setItem('preferred-lang', 'en');
    const composition = createTestComposition([
      createVoice('Chinese Voice', 'zh-CN'),
      createVoice('English Voice', 'en-US'),
    ]);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ServicesProvider composition={composition}>{children}</ServicesProvider>
    );

    const { result } = renderHook(() => useVoiceInteraction(), { wrapper });

    expect(result.current.voice?.name).toBe('English Voice');

    act(() => {
      result.current.speak('Hello there');
    });

    expect(composition.services.tts.speakWithOptions).toHaveBeenCalledWith(
      'Hello there',
      expect.objectContaining({
        lang: 'en',
        voiceName: 'English Voice',
      }),
    );
  });

  it('persists speech preferences across remounts', () => {
    localStorage.setItem('preferred-lang', 'en');
    const chineseVoice = createVoice('Chinese Voice', 'zh-CN');
    const englishVoice = createVoice('English Voice', 'en-US');
    const composition = createTestComposition([chineseVoice, englishVoice]);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ServicesProvider composition={composition}>{children}</ServicesProvider>
    );

    const firstMount = renderHook(() => useVoiceInteraction(), { wrapper });

    act(() => {
      firstMount.result.current.setVoice(chineseVoice);
      firstMount.result.current.setRate(1.4);
      firstMount.result.current.setPitch(0.8);
      firstMount.result.current.setVolume(0.6);
    });

    firstMount.unmount();

    const secondMount = renderHook(() => useVoiceInteraction(), { wrapper });

    expect(secondMount.result.current.voice?.name).toBe('Chinese Voice');
    expect(secondMount.result.current.rate).toBe(1.4);
    expect(secondMount.result.current.pitch).toBe(0.8);
    expect(secondMount.result.current.volume).toBe(0.6);
  });
});
