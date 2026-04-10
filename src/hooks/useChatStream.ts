import { useState, useCallback } from 'react';
import { useDigitalHumanStore } from '../store/digitalHumanStore';
import { ttsService } from '../core/audio';
import { digitalHumanEngine } from '../core/avatar';
import { runDialogueTurnStream } from '../core/dialogue/dialogueOrchestrator';
import { toast } from 'sonner';

export interface UseChatStreamOptions {
  sessionId: string;
  isMuted: boolean;
  onConnectionChange: (status: 'connected' | 'error') => void;
  onClearError: () => void;
  onError: (msg: string) => void;
}

export function useChatStream(options: UseChatStreamOptions) {
  const addChatMessage = useDigitalHumanStore((s) => s.addChatMessage);
  const updateChatMessage = useDigitalHumanStore((s) => s.updateChatMessage);
  const removeChatMessage = useDigitalHumanStore((s) => s.removeChatMessage);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const { sessionId, isMuted, onConnectionChange, onClearError, onError } = options;

  const handleChatSend = useCallback(
    async (text?: string) => {
      const content = (text ?? chatInput).trim();
      if (!content || isChatLoading) return;

      if (!text) setChatInput('');

      let assistantMessageId: number | null = null;

      const finalizeAssistantMessage = () => {
        if (!assistantMessageId) {
          return;
        }

        const currentMessage = useDigitalHumanStore
          .getState()
          .chatHistory.find((msg) => msg.id === assistantMessageId);

        if (!currentMessage) {
          return;
        }

        if (currentMessage.text.trim()) {
          updateChatMessage(assistantMessageId, { isStreaming: false });
        } else {
          removeChatMessage(assistantMessageId);
        }
      };

      try {
        const result = await runDialogueTurnStream(content, {
          sessionId,
          meta: { timestamp: Date.now() },
          isMuted,
          speakWith: (textToSpeak) => ttsService.speak(textToSpeak),
          setLoading: setIsChatLoading,
          onAddUserMessage: (t) => {
            addChatMessage('user', t);
            assistantMessageId = addChatMessage('assistant', '', true);
          },
          onStreamToken: (accumulatedText) => {
            if (assistantMessageId) {
              updateChatMessage(assistantMessageId, { text: accumulatedText });
            }
          },
          onStreamEnd: finalizeAssistantMessage,
          onConnectionChange,
          onClearError,
          onError: (msg) => {
            onError(msg);
            finalizeAssistantMessage();
          },
          onResetBehavior: () => {
            if (useDigitalHumanStore.getState().currentBehavior === 'thinking') {
              digitalHumanEngine.setBehavior('idle');
            }
          },
        });

        if (!result) {
          finalizeAssistantMessage();
        }
      } catch (err: unknown) {
        console.error('发送消息失败:', err);
        toast.error(err instanceof Error ? err.message : '发送失败，请重试');
        finalizeAssistantMessage();
      }
    },
    [
      chatInput,
      isChatLoading,
      addChatMessage,
      updateChatMessage,
      removeChatMessage,
      sessionId,
      isMuted,
      onConnectionChange,
      onClearError,
      onError,
    ],
  );

  return { chatInput, setChatInput, isChatLoading, handleChatSend };
}
