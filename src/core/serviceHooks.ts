/**
 * 服务容器 Hooks。
 *
 * 通过 React Context 获取服务实例。
 */

import { useContext } from 'react';
import { DigitalHumanEngine } from './avatar/DigitalHumanEngine';
import { TTSService, ASRService } from './audio/audioService';
import { ServicesContext } from './servicesContext';

// ============================================================================
// Hooks
// ============================================================================

/**
 * 获取服务容器。
 * 必须在 ServicesProvider 内使用。
 */
export function useServices(): { engine: DigitalHumanEngine; tts: TTSService; asr: ASRService } {
  const services = useContext(ServicesContext);
  if (!services) {
    throw new Error('useServices must be used within ServicesProvider');
  }
  return services;
}

/**
 * 获取 DigitalHumanEngine。
 */
export function useEngine(): DigitalHumanEngine {
  return useServices().engine;
}

/**
 * 获取 TTSService。
 */
export function useTTS(): TTSService {
  return useServices().tts;
}

/**
 * 获取 ASRService。
 */
export function useASR(): ASRService {
  return useServices().asr;
}
