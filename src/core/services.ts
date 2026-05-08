/**
 * 服务实例导出。
 *
 * 提供两种使用方式：
 * 1. 推荐方式：通过 ServicesProvider + useServices() hooks
 * 2. 向后兼容：直接导入全局单例（旧代码可用）
 *
 * 注意：测试时应使用 ServicesProvider 注入 mock 服务，
 * 而不是依赖全局单例。
 */

// 导出新的 Context Provider（推荐）
export { ServicesProvider } from './ServicesProvider';
export { ServicesContext } from './servicesContext';

// 导出 hooks（推荐）
export { useServices, useEngine, useTTS, useASR } from './serviceHooks';

// 导出工厂函数（供测试使用）
export { createServices, type Services } from './createServices';

// 导出类型（供外部使用）
export type { StateAdapter } from './avatar/DigitalHumanEngine';
export type { TTSCallbacks, ASRStateAdapter } from './audio/audioService';

// ============================================================================
// 向后兼容：全局单例
// ============================================================================

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

/**
 * @deprecated 使用 useServices() hooks 替代
 */
function createDigitalHumanStoreAdapter(): StateAdapter {
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
 * @deprecated 使用 useServices() hooks 替代
 */
function createTTSCallbacksFromStores(): TTSCallbacks {
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
 * @deprecated 使用 useServices() hooks 替代
 */
function createASRStateAdapterFromStores(): ASRStateAdapter {
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

/**
 * @deprecated 使用 useServices() hooks 替代
 */
export const digitalHumanEngine = new DigitalHumanEngine(createDigitalHumanStoreAdapter());

/**
 * @deprecated 使用 useServices() hooks 替代
 */
export const ttsService = new TTSService({}, createTTSCallbacksFromStores());

/**
 * @deprecated 使用 useServices() hooks 替代
 */
export const asrService = new ASRService({}, createASRStateAdapterFromStores(), ttsService);
