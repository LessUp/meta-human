/**
 * 服务容器工厂。
 *
 * 创建服务实例，使用集中式 adapters 与 Zustand store 交互。
 */

import { DigitalHumanEngine } from './avatar/DigitalHumanEngine';
import { TTSService, ASRService } from './audio/audioService';
import { createTTSCallbacks, createASRStateAdapter, createEngineStateAdapter } from './adapters';
import { DialogueOrchestrator } from './dialogue/dialogueOrchestrator';
import type { Services } from './servicesContext';

// ============================================================================
// 服务工厂
// ============================================================================

/**
 * 创建服务实例。
 * 使用集中式 adapters 操作 Zustand store。
 */
export function createServices(): Services {
  // 创建集中式 adapters
  const ttsCallbacks = createTTSCallbacks();
  const asrStateAdapter = createASRStateAdapter();
  const engineStateAdapter = createEngineStateAdapter();
  const dialogue = new DialogueOrchestrator();

  // TTS 服务
  const tts = new TTSService({}, ttsCallbacks);

  // ASR 服务
  const asr = new ASRService({}, asrStateAdapter, tts, dialogue);

  // DigitalHumanEngine
  const engine = new DigitalHumanEngine(engineStateAdapter);

  return { engine, tts, asr, dialogue };
}
