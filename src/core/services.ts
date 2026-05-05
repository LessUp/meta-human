/**
 * Service instantiation and dependency injection.
 *
 * This module is the single place where services are wired to stores.
 * Tests can create their own service instances with test adapters.
 */

import { DigitalHumanEngine, type StateAdapter } from './avatar/DigitalHumanEngine';
import {
  TTSService,
  ASRService,
  type TTSCallbacks,
  type ASRStateAdapter,
} from './audio/audioService';
import { useDigitalHumanStore } from '../store/digitalHumanStore';
import { useChatSessionStore } from '../store/chatSessionStore';
import { useSystemStore } from '../store/systemStore';

// ============================================================================
// Store Adapters
// ============================================================================

/**
 * Create a StateAdapter backed by the Zustand digitalHumanStore.
 */
export function createDigitalHumanStoreAdapter(): StateAdapter {
  return {
    play: () => useDigitalHumanStore.getState().play(),
    pause: () => useDigitalHumanStore.getState().pause(),
    reset: () => useDigitalHumanStore.getState().reset(),
    setExpression: (expr) => useDigitalHumanStore.getState().setExpression(expr),
    setExpressionIntensity: (n) => useDigitalHumanStore.getState().setExpressionIntensity(n),
    setEmotion: (emo) => useDigitalHumanStore.getState().setEmotion(emo),
    setBehavior: (beh) => useDigitalHumanStore.getState().setBehavior(beh),
    setAnimation: (anim) => useDigitalHumanStore.getState().setAnimation(anim),
    setPlaying: (p) => useDigitalHumanStore.getState().setPlaying(p),
  };
}

/**
 * Create TTS callbacks backed by Zustand stores.
 */
export function createTTSCallbacksFromStores(): TTSCallbacks {
  return {
    onSpeakStart: () => {
      useDigitalHumanStore.getState().setSpeaking(true);
      useDigitalHumanStore.getState().setBehavior('speaking');
    },
    onSpeakEnd: () => {
      useDigitalHumanStore.getState().setSpeaking(false);
      useDigitalHumanStore.getState().setBehavior('idle');
    },
    onError: (msg) => {
      useSystemStore.getState().setError(msg);
    },
  };
}

/**
 * Create an ASRStateAdapter backed by Zustand stores.
 */
export function createASRStateAdapterFromStores(): ASRStateAdapter {
  return {
    setRecording: (r) => useDigitalHumanStore.getState().setRecording(r),
    setBehavior: (b) =>
      useDigitalHumanStore
        .getState()
        .setBehavior(b as import('../store/digitalHumanStore').BehaviorType),
    setSpeaking: (s) => useDigitalHumanStore.getState().setSpeaking(s),
    setError: (m) => useSystemStore.getState().setError(m),
    setEmotion: (e) =>
      useDigitalHumanStore
        .getState()
        .setEmotion(e as import('../store/digitalHumanStore').EmotionType),
    setExpression: (x) =>
      useDigitalHumanStore
        .getState()
        .setExpression(x as import('../store/digitalHumanStore').ExpressionType),
    setAnimation: (a) => useDigitalHumanStore.getState().setAnimation(a),
    play: () => useDigitalHumanStore.getState().play(),
    pause: () => useDigitalHumanStore.getState().pause(),
    reset: () => useDigitalHumanStore.getState().reset(),
    setMuted: (m) => useDigitalHumanStore.getState().setMuted(m),
    get isMuted() {
      return useDigitalHumanStore.getState().isMuted;
    },
    get sessionId() {
      return useChatSessionStore.getState().sessionId;
    },
    get currentBehavior() {
      return useDigitalHumanStore.getState().currentBehavior;
    },
    addChatMessage: (role, text, isStreaming) =>
      useChatSessionStore.getState().addChatMessage(role, text, isStreaming),
    updateChatMessage: (id, updates) =>
      useChatSessionStore.getState().updateChatMessage(id, updates),
  };
}

// ============================================================================
// Service Factories
// ============================================================================

/**
 * Create a DigitalHumanEngine with store-backed adapter.
 */
export function createDigitalHumanEngine(): DigitalHumanEngine {
  return new DigitalHumanEngine(createDigitalHumanStoreAdapter());
}

/**
 * Create TTSService with store-backed callbacks.
 */
export function createTTSService(): TTSService {
  return new TTSService({}, createTTSCallbacksFromStores());
}

/**
 * Create ASRService with store-backed adapter and TTS dependency.
 */
export function createASRService(tts: TTSService): ASRService {
  return new ASRService({}, createASRStateAdapterFromStores(), tts);
}

// ============================================================================
// Default Singletons (for production use)
// ============================================================================

/**
 * Pre-configured DigitalHumanEngine using default store adapters.
 * Use this for production. Tests should create their own instances.
 */
export const digitalHumanEngine = createDigitalHumanEngine();

/**
 * Pre-configured TTSService using default store callbacks.
 */
export const ttsService = createTTSService();

/**
 * Pre-configured ASRService using default store adapter.
 */
export const asrService = createASRService(ttsService);
