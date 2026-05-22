/**
 * 服务容器 Context。
 *
 * React Context 用于提供服务实例。
 */

import { createContext } from 'react';
import { DigitalHumanEngine } from './avatar/DigitalHumanEngine';
import { TTSService, ASRService } from './audio/audioService';
import { DialogueOrchestrator } from './dialogue/dialogueOrchestrator';

// ============================================================================
// 服务接口
// ============================================================================

export interface Services {
  engine: DigitalHumanEngine;
  tts: TTSService;
  asr: ASRService;
  dialogue: DialogueOrchestrator;
}

// ============================================================================
// Context
// ============================================================================

/**
 * 服务 Context。
 * 由 ServicesProvider 提供，通过 useServices 等 hooks 消费。
 */
export const ServicesContext = createContext<Services | null>(null);
