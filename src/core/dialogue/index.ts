export {
  sendUserInput,
  checkServerHealth,
  clearRemoteSession,
  streamUserInput,
  DialogueApiError,
} from './dialogueService';
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
export type { ChatTransport, ChatTransportCapabilities, ChatTransportMode } from './chatTransport';
export type {
  DialogueTurnMode,
  DialogueTurnSnapshot,
  DialogueTurnStatus,
} from './dialogueTurnLifecycle';

export { DialogueOrchestrator, handleDialogueResponse } from './dialogueOrchestrator';
export type { DialogueHandleOptions, DialogueTurnOptions } from './dialogueOrchestrator';
