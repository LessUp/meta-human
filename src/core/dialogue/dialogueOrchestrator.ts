import { ChatResponsePayload, sendUserInput } from './dialogueService';
import { useDigitalHumanStore } from '../../store/digitalHumanStore';
import { digitalHumanEngine } from '../avatar/DigitalHumanEngine';

export interface DialogueHandleOptions {
  isMuted?: boolean;
  speakWith?: (text: string) => Promise<void> | void;
  addAssistantMessage?: boolean;
}

export interface DialogueTurnOptions extends DialogueHandleOptions {
  sessionId?: string;
  meta?: Record<string, unknown>;
  addUserMessage?: boolean;
  setLoading?: (loading: boolean) => void;
}

export async function runDialogueTurn(
  userText: string,
  options: DialogueTurnOptions = {}
): Promise<ChatResponsePayload | undefined> {
  const content = userText.trim();
  if (!content) {
    return undefined;
  }

  const store = useDigitalHumanStore.getState();
  const {
    sessionId = store.sessionId,
    meta,
    isMuted = store.isMuted,
    speakWith,
    addUserMessage = true,
    addAssistantMessage = true,
    setLoading,
  } = options;

  if (addUserMessage) {
    store.addChatMessage('user', content);
  }

  store.setLoading(true);
  setLoading?.(true);
  store.setBehavior('thinking');

  try {
    const response = await sendUserInput({
      sessionId,
      userText: content,
      meta,
    });

    await handleDialogueResponse(response, {
      isMuted,
      speakWith,
      addAssistantMessage,
    });

    return response;
  } finally {
    store.setLoading(false);
    setLoading?.(false);

    if (useDigitalHumanStore.getState().currentBehavior === 'thinking') {
      useDigitalHumanStore.getState().setBehavior('idle');
    }
  }
}

export async function handleDialogueResponse(
  res: ChatResponsePayload,
  options: DialogueHandleOptions = {}
): Promise<void> {
  const store = useDigitalHumanStore.getState();
  const {
    isMuted = false,
    speakWith,
    addAssistantMessage = true,
  } = options;

  if (addAssistantMessage && res.replyText) {
    store.addChatMessage('assistant', res.replyText);
  }

  if (res.emotion) {
    digitalHumanEngine.setEmotion(res.emotion);
  }

  if (res.action && res.action !== 'idle') {
    digitalHumanEngine.playAnimation(res.action);
  }

  if (res.replyText && !isMuted && speakWith) {
    await speakWith(res.replyText);
  }
}
