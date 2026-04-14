import { useState, useCallback } from 'react';
import { useDigitalHumanStore } from '../store/digitalHumanStore';
import { useChatSessionStore } from '../store/chatSessionStore';
import { useSystemStore } from '../store/systemStore';
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
  const addChatMessage = useChatSessionStore((s) => s.addChatMessage);
  const updateChatMessage = useChatSessionStore((s) => s.updateChatMessage);
  const removeChatMessage = useChatSessionStore((s) => s.removeChatMessage);
  const startChatPerformanceTrace = useSystemStore((s) => s.startChatPerformanceTrace);
  const markChatFirstToken = useSystemStore((s) => s.markChatFirstToken);
  const finalizeChatPerformanceTrace = useSystemStore((s) => s.finalizeChatPerformanceTrace);
  const setLoading = useSystemStore((s) => s.setLoading);
  const isLoading = useSystemStore((s) => s.isLoading);
  const [chatInput, setChatInput] = useState('');
  const { sessionId, isMuted, onConnectionChange, onClearError, onError } = options;

  const handleChatSend = useCallback(
    async (text?: string) => {
      const content = (text ?? chatInput).trim();
      if (!content) return;
      if (useSystemStore.getState().isLoading) return;

      if (!text) setChatInput('');

      let assistantMessageId: number | null = null;
      let didFinalizePerformanceTrace = false;

      const finalizePerformanceTrace = (status: 'completed' | 'failed' = 'completed') => {
        if (didFinalizePerformanceTrace) {
          return;
        }

        didFinalizePerformanceTrace = true;
        finalizeChatPerformanceTrace(status);
      };

      const finalizeAssistantMessage = () => {
        if (!assistantMessageId) {
          return;
        }

        const currentMessage = useChatSessionStore
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
        startChatPerformanceTrace();

        const result = await runDialogueTurnStream(content, {
          sessionId,
          meta: { timestamp: Date.now() },
          isMuted,
          speakWith: (textToSpeak) => ttsService.speak(textToSpeak),
          setLoading,
          // 流式模式下助手消息通过 onStreamToken 逐步更新，
          // 此处显式设为 undefined 以避免 handleDialogueResponse 再次添加完整消息导致重复
          onAddAssistantMessage: undefined,
          onAddUserMessage: (t) => {
            addChatMessage('user', t);
            assistantMessageId = addChatMessage('assistant', '', true);
          },
          onStreamToken: (accumulatedText) => {
            markChatFirstToken();

            if (assistantMessageId) {
              updateChatMessage(assistantMessageId, { text: accumulatedText });
            }
          },
          onStreamEnd: () => {
            finalizeAssistantMessage();
            finalizePerformanceTrace('completed');
          },
          onConnectionChange,
          onClearError,
          onError: (msg) => {
            onError(msg);
            finalizeAssistantMessage();
            finalizePerformanceTrace('failed');
          },
          onResetBehavior: () => {
            if (useDigitalHumanStore.getState().currentBehavior === 'thinking') {
              digitalHumanEngine.setBehavior('idle');
            }
          },
        });

        if (!result) {
          finalizeAssistantMessage();
          finalizePerformanceTrace('failed');
        }
      } catch (err: unknown) {
        console.error('发送消息失败:', err);
        toast.error(err instanceof Error ? err.message : '发送失败，请重试');
        finalizeAssistantMessage();
        finalizePerformanceTrace('failed');
      }
    },
    [
      chatInput,
      addChatMessage,
      updateChatMessage,
      removeChatMessage,
      startChatPerformanceTrace,
      markChatFirstToken,
      finalizeChatPerformanceTrace,
      setLoading,
      sessionId,
      isMuted,
      onConnectionChange,
      onClearError,
      onError,
    ],
  );

  return { chatInput, setChatInput, isChatLoading: isLoading, handleChatSend };
}
