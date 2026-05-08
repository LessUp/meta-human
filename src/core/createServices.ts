/**
 * 服务容器工厂。
 *
 * 创建服务实例，服务直接依赖 Zustand store。
 */

import { DigitalHumanEngine } from './avatar/DigitalHumanEngine';
import { TTSService, ASRService } from './audio/audioService';
import { useDigitalHumanStore } from '../store/digitalHumanStore';
import { useChatSessionStore } from '../store/chatSessionStore';
import { useSystemStore } from '../store/systemStore';

// ============================================================================
// 服务接口
// ============================================================================

export interface Services {
  engine: DigitalHumanEngine;
  tts: TTSService;
  asr: ASRService;
}

// ============================================================================
// 服务工厂
// ============================================================================

/**
 * 创建服务实例。
 * 服务直接操作 Zustand store，无需适配器层。
 */
export function createServices(): Services {
  // TTS 服务：回调直接更新 store
  const tts = new TTSService(
    {},
    {
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
    },
  );

  // ASR 服务：直接操作 store
  const asr = new ASRService(
    {},
    {
      get isMuted() {
        return useDigitalHumanStore.getState().isMuted;
      },
      get sessionId() {
        return useChatSessionStore.getState().sessionId;
      },
      get currentBehavior() {
        return useDigitalHumanStore.getState().currentBehavior;
      },
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
      addChatMessage: (role, text, isStreaming) =>
        useChatSessionStore.getState().addChatMessage(role, text, isStreaming),
      updateChatMessage: (id, updates) =>
        useChatSessionStore.getState().updateChatMessage(id, updates),
    },
    tts,
  );

  // DigitalHumanEngine：直接操作 store
  const engine = new DigitalHumanEngine({
    play: () => useDigitalHumanStore.getState().play(),
    pause: () => useDigitalHumanStore.getState().pause(),
    reset: () => useDigitalHumanStore.getState().reset(),
    setExpression: (expr) => useDigitalHumanStore.getState().setExpression(expr),
    setExpressionIntensity: (n) => useDigitalHumanStore.getState().setExpressionIntensity(n),
    setEmotion: (emo) => useDigitalHumanStore.getState().setEmotion(emo),
    setBehavior: (beh) => useDigitalHumanStore.getState().setBehavior(beh),
    setAnimation: (anim) => useDigitalHumanStore.getState().setAnimation(anim),
    setPlaying: (p) => useDigitalHumanStore.getState().setPlaying(p),
  });

  return { engine, tts, asr };
}
