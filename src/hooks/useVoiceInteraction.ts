/**
 * Voice interaction hook.
 *
 * Encapsulates ASR/TTS service calls, providing a clean interface for components.
 * This abstraction allows components to be tested without mocking services directly.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTTS, useASR } from '@/services';
import { useDigitalHumanStore } from '../store/digitalHumanStore';
import { useI18n } from './useI18n';

export interface UseVoiceInteractionOptions {
  /** Called when a transcript is received from ASR */
  onTranscript?: (text: string) => void;
  /** Called when TTS speaks text */
  onSpeak?: (text: string) => void;
}

export interface VoiceInteractionControls {
  /** Whether the browser supports voice features */
  isSupported: boolean;
  /** Whether currently recording */
  isRecording: boolean;
  /** Whether currently muted */
  isMuted: boolean;
  /** Current transcript from ASR */
  transcript: string;
  /** Available voices for TTS */
  availableVoices: SpeechSynthesisVoice[];
  /** Currently selected voice */
  voice: SpeechSynthesisVoice | null;
  /** TTS settings */
  volume: number;
  pitch: number;
  rate: number;
  /** Setters for TTS settings */
  setVolume: (volume: number) => void;
  setPitch: (pitch: number) => void;
  setRate: (rate: number) => void;
  setVoice: (voice: SpeechSynthesisVoice | null) => void;
  /** Actions */
  startRecording: () => void;
  stopRecording: () => void;
  toggleRecording: () => void;
  toggleMute: () => void;
  speak: (text: string) => void;
}

/**
 * Hook for voice interaction (ASR + TTS).
 *
 * @example
 * ```tsx
 * const voice = useVoiceInteraction({
 *   onTranscript: (text) => console.log('Heard:', text),
 * });
 *
 * <button onClick={voice.toggleRecording}>
 *   {voice.isRecording ? 'Stop' : 'Start'}
 * </button>
 * ```
 */
export function useVoiceInteraction(
  options: UseVoiceInteractionOptions = {},
): VoiceInteractionControls {
  const { onTranscript, onSpeak } = options;
  const tts = useTTS();
  const asr = useASR();
  const { lang } = useI18n();

  const isRecording = useDigitalHumanStore((s) => s.isRecording);
  const isMuted = useDigitalHumanStore((s) => s.isMuted);
  const setRecording = useDigitalHumanStore((s) => s.setRecording);
  const toggleMute = useDigitalHumanStore((s) => s.toggleMute);
  const speechConfig = useDigitalHumanStore((s) => s.speechConfig);
  const setSpeechConfig = useDigitalHumanStore((s) => s.setSpeechConfig);

  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Track if component is mounted
  const mountedRef = useRef(true);

  // Use refs for callbacks to avoid stale closures and reduce re-binding
  const onTranscriptRef = useRef(onTranscript);
  const onSpeakRef = useRef(onSpeak);
  onTranscriptRef.current = onTranscript;
  onSpeakRef.current = onSpeak;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Initialize voice support check
  useEffect(() => {
    const hasSpeechRecognition =
      'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const hasSpeechSynthesis = 'speechSynthesis' in window;

    setIsSupported(hasSpeechRecognition && hasSpeechSynthesis);

    if (hasSpeechSynthesis) {
      const voices = tts.getVoices();
      const languagePrefix = lang.toLowerCase().split('-')[0];
      if (mountedRef.current) {
        setAvailableVoices(voices);
        const savedVoice = speechConfig.voiceName
          ? voices.find((v) => v.name === speechConfig.voiceName)
          : null;
        if (!savedVoice) {
          const matchingVoice = voices.find((v) => v.lang.toLowerCase().startsWith(languagePrefix));
          const nextVoice = matchingVoice ?? voices[0] ?? null;
          if (nextVoice) {
            setSpeechConfig({ voiceName: nextVoice.name });
          }
        }
      }
    }

    return () => {
      asr.stop();
    };
  }, [asr, lang, speechConfig.voiceName, setSpeechConfig, tts]);

  const voice =
    availableVoices.find((candidate) => candidate.name === speechConfig.voiceName) ?? null;

  const setVolume = useCallback((volume: number) => setSpeechConfig({ volume }), [setSpeechConfig]);
  const setPitch = useCallback((pitch: number) => setSpeechConfig({ pitch }), [setSpeechConfig]);
  const setRate = useCallback((rate: number) => setSpeechConfig({ rate }), [setSpeechConfig]);
  const setVoice = useCallback(
    (voice: SpeechSynthesisVoice | null) => setSpeechConfig({ voiceName: voice?.name ?? null }),
    [setSpeechConfig],
  );

  // Start recording
  const startRecording = useCallback(() => {
    if (!isSupported) return;

    asr.start({
      mode: 'dictation',
      onResult: (text: string) => {
        if (!mountedRef.current) return;
        setTranscript(text);
        onTranscriptRef.current?.(text);
      },
    });
  }, [isSupported, asr]);

  // Stop recording
  const stopRecording = useCallback(() => {
    asr.stop();
    setRecording(false);
  }, [setRecording, asr]);

  // Toggle recording
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Speak text using TTS
  const speak = useCallback(
    (text: string) => {
      if (isMuted) return;

      tts.speakWithOptions(text, {
        lang,
        volume: speechConfig.volume,
        pitch: speechConfig.pitch,
        rate: speechConfig.rate,
        voiceName: voice?.name,
      });

      onSpeakRef.current?.(text);
    },
    [isMuted, lang, speechConfig.pitch, speechConfig.rate, speechConfig.volume, tts, voice],
  );

  return {
    isSupported,
    isRecording,
    isMuted,
    transcript,
    availableVoices,
    voice,
    volume: speechConfig.volume,
    pitch: speechConfig.pitch,
    rate: speechConfig.rate,
    setVolume,
    setPitch,
    setRate,
    setVoice,
    startRecording,
    stopRecording,
    toggleRecording,
    toggleMute,
    speak,
  };
}
