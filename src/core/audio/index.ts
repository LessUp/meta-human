import { useDigitalHumanStore } from '../../store/digitalHumanStore';
import type { BehaviorType, EmotionType, ExpressionType } from '../../store/digitalHumanStore';
import { useChatSessionStore } from '../../store/chatSessionStore';
import { useSystemStore } from '../../store/systemStore';
import { TTSService, ASRService } from './audioService';
import type { TTSCallbacks, ASRStateAdapter } from './audioService';

export { TTSService, ASRService } from './audioService';
export type {
  TTSConfig,
  ASRConfig,
  ASRCallbacks,
  TTSCallbacks,
  ASRStateAdapter,
} from './audioService';

/** Create TTS callbacks backed by the Zustand store. */
function createTTSCallbacks(): TTSCallbacks {
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

/** Create an ASRStateAdapter backed by the Zustand store. */
function createASRStateAdapter(): ASRStateAdapter {
  return {
    setRecording: (r) => useDigitalHumanStore.getState().setRecording(r),
    setBehavior: (b) => useDigitalHumanStore.getState().setBehavior(b as BehaviorType),
    setSpeaking: (s) => useDigitalHumanStore.getState().setSpeaking(s),
    setError: (m) => useSystemStore.getState().setError(m),
    setEmotion: (e) => useDigitalHumanStore.getState().setEmotion(e as EmotionType),
    setExpression: (x) => useDigitalHumanStore.getState().setExpression(x as ExpressionType),
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
    addChatMessage: (role, text, isStreaming) => useChatSessionStore.getState().addChatMessage(role, text, isStreaming),
    updateChatMessage: (id, updates) => useChatSessionStore.getState().updateChatMessage(id, updates),
  };
}

/** Pre-configured singleton TTS service using the default store callbacks. */
export const ttsService = new TTSService({}, createTTSCallbacks());

/** Pre-configured singleton ASR service using the default store adapter. */
export const asrService = new ASRService({}, createASRStateAdapter(), ttsService);
