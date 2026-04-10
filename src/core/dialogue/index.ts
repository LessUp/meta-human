export {
  sendUserInput,
  checkServerHealth,
  clearRemoteSession,
  streamUserInput,
  DialogueApiError,
} from './dialogueService';
export {
  getChatTransport,
  getDefaultChatTransport,
  getPreferredChatTransportMode,
  httpChatTransport,
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
export type { ChatTransport, ChatTransportMode } from './chatTransport';

export {
  runDialogueTurn,
  runDialogueTurnStream,
  handleDialogueResponse,
} from './dialogueOrchestrator';
export type { DialogueHandleOptions, DialogueTurnOptions } from './dialogueOrchestrator';
