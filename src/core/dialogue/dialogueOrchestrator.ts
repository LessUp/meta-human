import { ChatResponsePayload } from './dialogueService';
import { useDigitalHumanStore } from '../../store/digitalHumanStore';
import { digitalHumanEngine } from '../avatar/DigitalHumanEngine';

export interface DialogueHandleOptions {
  isMuted?: boolean;
  speakWith?: (text: string) => Promise<void> | void;
  addAssistantMessage?: boolean;
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
