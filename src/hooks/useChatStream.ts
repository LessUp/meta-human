import { useState, useCallback, useRef } from 'react';
import { useDigitalHumanStore } from '../store/digitalHumanStore';
import { useChatSessionStore } from '../store/chatSessionStore';
import { useSystemStore } from '../store/systemStore';
import { ttsService } from '../core/audio';
import { digitalHumanEngine } from '../core/avatar';
import { runDialogueTurnStream } from '../core/dialogue/dialogueOrchestrator';
import { toast } from 'sonner';
import { loggers } from '../lib/logger';

const logger = loggers.chat;

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
  const activeTurnRef = useRef<symbol | null>(null);
  const { sessionId, isMuted, onConnectionChange, onClearError, onError } = options;

  const handleChatSend = useCallback(
    async (text?: string) => {
      const content = (text ?? chatInput).trim();
      if (!content) return;
      if (useSystemStore.getState().isLoading) return;

      if (!text) setChatInput('');

      let assistantMessageId: number | null = null;
      let didFinalizePerformanceTrace = false;
      const turnConnection = { status: 'connected' as 'connected' | 'error' };
      const turnSessionId = sessionId;
      const turnToken = Symbol('chat-stream-turn');

      activeTurnRef.current = turnToken;

      const ownsCurrentTurn = () =>
        activeTurnRef.current === turnToken &&
        useChatSessionStore.getState().sessionId === turnSessionId;

      const finalizePerformanceTrace = (status: 'completed' | 'failed' = 'completed') => {
        if (didFinalizePerformanceTrace || !ownsCurrentTurn()) {
          return;
        }

        didFinalizePerformanceTrace = true;
        finalizeChatPerformanceTrace(status);
      };

      const finalizeAssistantMessage = (discardEmpty = false) => {
        if (!ownsCurrentTurn() || !assistantMessageId) {
          return;
        }

        const currentMessage = useChatSessionStore
          .getState()
          .chatHistory.find((msg) => msg.id === assistantMessageId);

        if (!currentMessage) {
          return;
        }

        if (currentMessage.text.trim() || !discardEmpty) {
          updateChatMessage(assistantMessageId, { isStreaming: false });
        } else {
          removeChatMessage(assistantMessageId);
        }
      };

      const syncAssistantMessageWithResult = (replyText: string) => {
        if (!ownsCurrentTurn() || !assistantMessageId) {
          return;
        }

        const currentMessage = useChatSessionStore
          .getState()
          .chatHistory.find((msg) => msg.id === assistantMessageId);

        if (!replyText.trim()) {
          if (currentMessage) {
            removeChatMessage(assistantMessageId);
          }
          return;
        }

        if (currentMessage) {
          updateChatMessage(assistantMessageId, {
            text: replyText,
            isStreaming: false,
          });
          return;
        }

        addChatMessage('assistant', replyText);
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
            if (!ownsCurrentTurn()) {
              return;
            }

            addChatMessage('user', t);
            assistantMessageId = addChatMessage('assistant', '', true);
          },
          onStreamToken: (accumulatedText) => {
            if (!ownsCurrentTurn()) {
              return;
            }

            markChatFirstToken();

            if (assistantMessageId) {
              updateChatMessage(assistantMessageId, { text: accumulatedText, isStreaming: true });
            }
          },
          onTurnResponse: (response) => {
            if (!ownsCurrentTurn()) {
              return;
            }

            syncAssistantMessageWithResult(response.replyText);
          },
          onStreamEnd: () => {
            if (!ownsCurrentTurn()) {
              return;
            }

            finalizeAssistantMessage();
          },
          onConnectionChange: (status) => {
            if (!ownsCurrentTurn()) {
              return;
            }

            turnConnection.status = status;
            onConnectionChange(status);
          },
          onClearError: () => {
            if (!ownsCurrentTurn()) {
              return;
            }

            onClearError();
          },
          onError: (msg) => {
            if (!ownsCurrentTurn()) {
              return;
            }

            onError(msg);
          },
          onResetBehavior: () => {
            if (!ownsCurrentTurn()) {
              return;
            }

            if (useDigitalHumanStore.getState().currentBehavior === 'thinking') {
              digitalHumanEngine.setBehavior('idle');
            }
          },
        });

        if (!result) {
          finalizeAssistantMessage(true);
          finalizePerformanceTrace('failed');
          return;
        }

        syncAssistantMessageWithResult(result.replyText);
        finalizePerformanceTrace(turnConnection.status === 'error' ? 'failed' : 'completed');
      } catch (err: unknown) {
        logger.error('发送消息失败:', err);
        toast.error(err instanceof Error ? err.message : '发送失败，请重试');
        finalizeAssistantMessage(true);
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
