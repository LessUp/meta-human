import { describe, expect, it, vi } from 'vitest';
import { ASRService, TTSService } from '@/core/audio/audioService';
import { DigitalHumanEngine } from '@/core/avatar/DigitalHumanEngine';
import type { ASRStateAdapter, EngineStateAdapter, TTSCallbacks } from '@/core/adapters';
import { DialogueOrchestrator } from '@/core/dialogue/dialogueOrchestrator';
import {
  createServiceComposition,
  type ServiceFactories,
  type ServiceAdapters,
} from '@/core/serviceComposition';

function createTestAdapters(): ServiceAdapters {
  const ttsCallbacks: TTSCallbacks = {
    onSpeakStart: vi.fn(),
    onSpeakEnd: vi.fn(),
    onError: vi.fn(),
  };
  const asrStateAdapter: ASRStateAdapter = {
    setRecording: vi.fn(),
    setBehavior: vi.fn(),
    setSpeaking: vi.fn(),
    setError: vi.fn(),
    setEmotion: vi.fn(),
    setExpression: vi.fn(),
    setAnimation: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    reset: vi.fn(),
    setMuted: vi.fn(),
    get isMuted() {
      return false;
    },
    get sessionId() {
      return 'session-1';
    },
    get currentBehavior() {
      return 'idle';
    },
    addChatMessage: vi.fn(() => 1),
    updateChatMessage: vi.fn(),
  };
  const engineStateAdapter: EngineStateAdapter = {
    play: vi.fn(),
    pause: vi.fn(),
    reset: vi.fn(),
    setExpression: vi.fn(),
    setExpressionIntensity: vi.fn(),
    setEmotion: vi.fn(),
    setBehavior: vi.fn(),
    setAnimation: vi.fn(),
    setPlaying: vi.fn(),
  };

  return {
    ttsCallbacks,
    asrStateAdapter,
    engineStateAdapter,
  };
}

describe('serviceComposition', () => {
  it('creates the default runtime services with the default wiring', () => {
    const composition = createServiceComposition();

    expect(composition.services.engine).toBeInstanceOf(DigitalHumanEngine);
    expect(composition.services.tts).toBeInstanceOf(TTSService);
    expect(composition.services.asr).toBeInstanceOf(ASRService);
    expect(composition.services.dialogue).toBeInstanceOf(DialogueOrchestrator);

    composition.dispose();
  });

  it('allows tests to inject adapters and factories through an explicit seam', () => {
    const adapters = createTestAdapters();
    const dialogue = {
      abortPendingTurn: vi.fn(),
      isTurnPending: vi.fn(() => false),
      reset: vi.fn(),
      runDialogueTurn: vi.fn(),
      runDialogueTurnStream: vi.fn(),
    } as unknown as DialogueOrchestrator;
    const tts = { dispose: vi.fn() } as unknown as TTSService;
    const asr = { dispose: vi.fn() } as unknown as ASRService;
    const engine = { dispose: vi.fn() } as unknown as DigitalHumanEngine;
    const factories: ServiceFactories = {
      createDialogue: vi.fn(() => dialogue),
      createTTS: vi.fn(({ ttsCallbacks }) => {
        expect(ttsCallbacks).toBe(adapters.ttsCallbacks);
        return tts;
      }),
      createASR: vi.fn(({ asrStateAdapter, tts: createdTTS, dialogue: createdDialogue }) => {
        expect(asrStateAdapter).toBe(adapters.asrStateAdapter);
        expect(createdTTS).toBe(tts);
        expect(createdDialogue).toBe(dialogue);
        return asr;
      }),
      createEngine: vi.fn(({ engineStateAdapter }) => {
        expect(engineStateAdapter).toBe(adapters.engineStateAdapter);
        return engine;
      }),
    };

    const composition = createServiceComposition({ adapters, factories });

    expect(composition.services).toEqual({
      engine,
      tts,
      asr,
      dialogue,
    });
  });

  it('owns disposal for the composed services', () => {
    const services = {
      engine: { dispose: vi.fn() } as unknown as DigitalHumanEngine,
      tts: { dispose: vi.fn() } as unknown as TTSService,
      asr: { dispose: vi.fn() } as unknown as ASRService,
      dialogue: {
        abortPendingTurn: vi.fn(),
        isTurnPending: vi.fn(() => false),
        reset: vi.fn(),
        runDialogueTurn: vi.fn(),
        runDialogueTurnStream: vi.fn(),
      } as unknown as DialogueOrchestrator,
    };

    const factories: ServiceFactories = {
      createDialogue: () => services.dialogue,
      createTTS: () => services.tts,
      createASR: () => services.asr,
      createEngine: () => services.engine,
    };

    const composition = createServiceComposition({
      adapters: createTestAdapters(),
      factories,
    });

    composition.dispose();

    expect(services.dialogue.reset).toHaveBeenCalledTimes(1);
    expect(services.asr.dispose).toHaveBeenCalledTimes(1);
    expect(services.tts.dispose).toHaveBeenCalledTimes(1);
    expect(services.engine.dispose).toHaveBeenCalledTimes(1);
  });
});
