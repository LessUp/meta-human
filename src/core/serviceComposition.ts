import {
  createASRStateAdapter,
  createEngineStateAdapter,
  createTTSCallbacks,
  type ASRStateAdapter,
  type EngineStateAdapter,
  type TTSCallbacks,
} from './adapters';
import { TTSService, ASRService } from './audio/audioService';
import { DigitalHumanEngine } from './avatar/DigitalHumanEngine';
import { DialogueOrchestrator } from './dialogue/dialogueOrchestrator';

// ============================================================================
// Services Interface
// ============================================================================

/**
 * Runtime services container interface.
 */
export interface Services {
  engine: DigitalHumanEngine;
  tts: TTSService;
  asr: ASRService;
  dialogue: DialogueOrchestrator;
}

export interface ServiceAdapters {
  ttsCallbacks: TTSCallbacks;
  asrStateAdapter: ASRStateAdapter;
  engineStateAdapter: EngineStateAdapter;
}

export interface ServiceFactories {
  createDialogue(): DialogueOrchestrator;
  createTTS(args: Pick<ServiceAdapters, 'ttsCallbacks'>): TTSService;
  createASR(args: {
    asrStateAdapter: ASRStateAdapter;
    tts: TTSService;
    dialogue: DialogueOrchestrator;
  }): ASRService;
  createEngine(args: Pick<ServiceAdapters, 'engineStateAdapter'>): DigitalHumanEngine;
}

export interface ServiceComposition {
  services: Services;
  dispose(): void;
}

export interface CreateServiceCompositionOptions {
  adapters?: Partial<ServiceAdapters>;
  factories?: Partial<ServiceFactories>;
}

export function createDefaultServiceAdapters(): ServiceAdapters {
  return {
    ttsCallbacks: createTTSCallbacks(),
    asrStateAdapter: createASRStateAdapter(),
    engineStateAdapter: createEngineStateAdapter(),
  };
}

export function createDefaultServiceFactories(): ServiceFactories {
  return {
    createDialogue: () => new DialogueOrchestrator(),
    createTTS: ({ ttsCallbacks }) => new TTSService({}, ttsCallbacks),
    createASR: ({ asrStateAdapter, tts, dialogue }) =>
      new ASRService({}, asrStateAdapter, tts, dialogue),
    createEngine: ({ engineStateAdapter }) => new DigitalHumanEngine(engineStateAdapter),
  };
}

export function disposeServices(services: Services): void {
  services.asr.dispose();
  services.tts.dispose();
  services.engine.dispose();
  services.dialogue.reset();
}

export function createServiceComposition(
  options: CreateServiceCompositionOptions = {},
): ServiceComposition {
  const adapters = {
    ...createDefaultServiceAdapters(),
    ...options.adapters,
  };
  const factories = {
    ...createDefaultServiceFactories(),
    ...options.factories,
  };
  const dialogue = factories.createDialogue();
  const tts = factories.createTTS({ ttsCallbacks: adapters.ttsCallbacks });
  const asr = factories.createASR({
    asrStateAdapter: adapters.asrStateAdapter,
    tts,
    dialogue,
  });
  const engine = factories.createEngine({
    engineStateAdapter: adapters.engineStateAdapter,
  });
  const services: Services = {
    engine,
    tts,
    asr,
    dialogue,
  };

  return {
    services,
    dispose: () => disposeServices(services),
  };
}
