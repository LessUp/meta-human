// store/ barrel export
// 统一 facade（向后兼容）
export { useDigitalHumanStore } from './digitalHumanStore';

// 领域子 store（推荐在新代码中直接使用）
export { useAvatarStore } from './avatarStore';
export { useVoiceStore } from './voiceStore';
export { useChatStore } from './chatStore';
export { useConnectionStore } from './connectionStore';
export { useErrorStore } from './errorStore';
export { usePerformanceStore } from './performanceStore';

// 类型
export type * from './types';

// 工具
export { generateSessionId, generateErrorId, StateDebouncer, ErrorTimerManager } from './utils';
