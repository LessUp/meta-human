/**
 * @deprecated 此文件为兼容层，请迁移到新模块：
 * - TTS: import { createTTSService } from '@/core/audio/tts-service'
 * - ASR: import { createASRService } from '@/core/audio/asr-service'
 * - 语音管线: import { createSpeechPipeline } from '@/core/audio/speech-pipeline'
 */

import { getCoreInstances } from "../index";

// 重新导出类型（兼容旧接口）
export type {
  TTSConfig,
  ASRCallbacks,
  ASRConfig,
  ASRStartOptions,
} from "../types";

/**
 * @deprecated 使用 createTTSService() 代替
 */
export class TTSService {
  private get _tts() {
    return getCoreInstances().tts;
  }

  updateConfig(config: any) {
    this._tts.updateConfig(config);
  }
  getVoices() {
    return this._tts.getVoices();
  }
  isSupported() {
    return this._tts.isSupported();
  }
  isSpeaking() {
    return this._tts.isSpeaking();
  }
  getQueueLength() {
    return this._tts.getQueueLength();
  }
  clearQueue() {
    this._tts.clearQueue();
  }
  speak(text: string, config?: any) {
    return this._tts.speak(text, config);
  }
  speakWithOptions(text: string, options?: any) {
    return this._tts.speak(text, options);
  }
  stop() {
    this._tts.stop();
  }
  pause() {
    this._tts.pause();
  }
  resume() {
    this._tts.resume();
  }
}

/**
 * @deprecated 使用 createASRService() 代替
 */
export class ASRService {
  private get _asr() {
    return getCoreInstances().asr;
  }

  setCallbacks(callbacks: any) {
    this._asr.setCallbacks(callbacks);
  }
  checkSupport() {
    return this._asr.checkSupport();
  }
  checkPermission() {
    return this._asr.checkPermission();
  }
  requestPermission() {
    return this._asr.requestPermission();
  }
  start(options?: any) {
    return this._asr.start(options);
  }
  stop() {
    this._asr.stop();
  }
  abort() {
    this._asr.abort();
  }
  setSendToBackend(_send: boolean) {
    // 兼容旧接口，新架构通过事件总线处理
  }
  performGreeting() {
    getCoreInstances().engine.performGreeting();
  }
  performDance() {
    getCoreInstances().engine.setEmotion("happy");
    getCoreInstances().engine.playAnimation("dance");
  }
  performNod() {
    getCoreInstances().engine.playAnimation("nod");
  }
  performShakeHead() {
    getCoreInstances().engine.playAnimation("shakeHead");
  }
  performThinking() {
    getCoreInstances().engine.performThinking();
  }
}

// 兼容旧的单例导出
export const ttsService = new TTSService();
export const asrService = new ASRService();
