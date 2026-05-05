/**
 * Voice interaction hook.
 *
 * Encapsulates ASR/TTS service calls, providing a clean interface for components.
 * This abstraction allows components to be tested without mocking services directly.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ttsService, asrService } from '../core/services';
import { useDigitalHumanStore } from '../store/digitalHumanStore';

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

  const isRecording = useDigitalHumanStore((s) => s.isRecording);
  const isMuted = useDigitalHumanStore((s) => s.isMuted);
  const setRecording = useDigitalHumanStore((s) => s.setRecording);
  const toggleMute = useDigitalHumanStore((s) => s.toggleMute);

  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [volume, setVolume] = useState(0.8);
  const [pitch, setPitch] = useState(1.0);
  const [rate, setRate] = useState(1.0);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
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
      const voices = ttsService.getVoices();
      if (mountedRef.current) {
        setAvailableVoices(voices);
        // Prefer Chinese voice
        const chineseVoice = voices.find((v) => v.lang.includes('zh'));
        if (chineseVoice) {
          setVoice(chineseVoice);
        } else if (voices.length > 0) {
          setVoice(voices[0]);
        }
      }
    }

    return () => {
      asrService.stop();
    };
  }, []);

  // Start recording
  const startRecording = useCallback(() => {
    if (!isSupported) return;

    asrService.start({
      mode: 'dictation',
      onResult: (text: string) => {
        if (!mountedRef.current) return;
        setTranscript(text);
        onTranscriptRef.current?.(text);
      },
    });
  }, [isSupported]); // Removed onTranscript dep - now using ref

  // Stop recording
  const stopRecording = useCallback(() => {
    asrService.stop();
    setRecording(false);
  }, [setRecording]);

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

      ttsService.speakWithOptions(text, {
        lang: 'zh-CN',
        volume,
        pitch,
        rate,
        voiceName: voice?.name,
      });

      onSpeakRef.current?.(text);
    },
    [isMuted, volume, pitch, rate, voice], // Removed onSpeak dep - now using ref
  );

  return {
    isSupported,
    isRecording,
    isMuted,
    transcript,
    availableVoices,
    voice,
    volume,
    pitch,
    rate,
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
