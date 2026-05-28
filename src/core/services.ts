/**
 * 服务实例导出。
 *
 * 通过 ServicesProvider + useServices() hooks 使用服务。
 * 测试时应使用 ServicesProvider 注入 mock 服务。
 */

// Context
export { ServicesContext, type Services } from './servicesContext';

// Provider
export { ServicesProvider } from './ServicesProvider';

// 工厂函数（供测试使用）
export { createServices } from './createServices';
export {
  createDefaultServiceAdapters,
  createDefaultServiceFactories,
  createServiceComposition,
  disposeServices,
  type CreateServiceCompositionOptions,
  type ServiceAdapters,
  type ServiceComposition,
  type ServiceFactories,
} from './serviceComposition';

// Hooks
export { useServices, useEngine, useTTS, useASR, useDialogue } from './serviceHooks';

// 类型（供外部使用）
export type { StateAdapter } from './avatar/DigitalHumanEngine';
export type { TTSCallbacks, ASRStateAdapter } from './audio/audioService';
