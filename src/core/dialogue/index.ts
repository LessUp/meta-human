export {
  sendUserInput,
  checkServerHealth,
  clearRemoteSession,
  streamUserInput,
  DialogueApiError,
  resetDialogueServiceRoutingForTests,
  applyRuntimeApiEndpoints,
  resetRuntimeApiEndpoints,
} from './dialogueService';
export { DialogueEndpointRouter } from './dialogueEndpointRouter';
export { normalizeDialogueRequestPayload } from './dialoguePayload';
export {
  sendDialogueHttpRequest,
  sendDialogueStreamRequest,
  normalizeDialogueError,
  fetchWithTimeout,
} from './dialogueHttpClient';
export {
  getCachedChatTransportCapabilities,
  getChatTransport,
  getDefaultChatTransport,
  getPreferredChatTransportMode,
  httpChatTransport,
  probeChatTransportCapabilities,
  resetChatTransportProbeCache,
  resolveChatTransportMode,
  setChatTransportOverride,
  sseChatTransport,
  webSocketChatTransport,
} from './chatTransport';
export type {
  ChatRequestPayload,
  ChatResponsePayload,
  DialogueServiceResult,
  DialogueServiceConfig,
  StreamCallbacks,
} from './dialogueService';
export type {
  DialogueMessage,
  DialogueMessageRole,
  DialogueRequestPayload,
} from './dialoguePayload';
export type { ChatTransport, ChatTransportCapabilities, ChatTransportMode } from './chatTransport';
export type {
  DialogueTurnMode,
  DialogueTurnSnapshot,
  DialogueTurnStatus,
} from './dialogueTurnLifecycle';

export { DialogueOrchestrator, handleDialogueResponse } from './dialogueOrchestrator';
export type {
  DialogueHandleOptions,
  DialogueTurnOptions,
  DialogueOrchestratorDependencies,
} from './dialogueOrchestrator';
export {
  CHARACTER_PRESETS,
  DEFAULT_CHARACTER_ID,
  getCharacterPreset,
  isValidCharacterId,
} from './characterPresets';
export type { CharacterPreset } from './characterPresets';
