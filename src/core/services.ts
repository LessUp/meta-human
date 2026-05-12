/**
 * 服务实例导出。
 *
 * 通过 ServicesProvider + useServices() hooks 使用服务。
 * 测试时应使用 ServicesProvider 注入 mock 服务。
 */

// Context Provider
export { ServicesProvider } from './ServicesProvider';
export { ServicesContext } from './servicesContext';

// Hooks
export { useServices, useEngine, useTTS, useASR } from './serviceHooks';

// 工厂函数（供测试使用）
export { createServices, type Services } from './createServices';

// 类型（供外部使用）
export type { StateAdapter } from './avatar/DigitalHumanEngine';
export type { TTSCallbacks, ASRStateAdapter } from './audio/audioService';
