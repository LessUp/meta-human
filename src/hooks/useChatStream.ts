import { useState, useCallback, useEffect, useRef } from 'react';
import { useDigitalHumanStore } from '@/store/digitalHumanStore';
import { useChatSessionStore } from '@/store/chatSessionStore';
import { useSystemStore } from '@/store/systemStore';
import { useTTS, useEngine, useDialogue } from '@/core/services';
import { toast } from 'sonner';
import { loggers } from '@/lib/logger';

const logger = loggers.chat;

export interface UseChatStreamOptions {
  sessionId: string;
  isMuted: boolean;
  onConnectionChange: (status: 'connected' | 'error') => void;
  onClearError: () => void;
  onError: (msg: string) => void;
}

export function useChatStream(options: UseChatStreamOptions) {
  const tts = useTTS();
  const engine = useEngine();
  const dialogue = useDialogue();
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
  const activeTurnRef = useRef<{ token: symbol; sessionId: string } | null>(null);

  useEffect(() => {
    return () => {
      activeTurnRef.current = null;
      dialogue.abortPendingTurn();
    };
  }, [dialogue, sessionId]);

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

      activeTurnRef.current = { token: turnToken, sessionId: turnSessionId };

      const ownsCurrentTurn = () =>
        activeTurnRef.current?.token === turnToken &&
        activeTurnRef.current?.sessionId === turnSessionId;

      const releaseCurrentTurn = () => {
        if (ownsCurrentTurn()) {
          activeTurnRef.current = null;
        }
      };

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

        const result = await dialogue.runDialogueTurnStream(content, {
          sessionId,
          meta: { timestamp: Date.now() },
          engine,
          isMuted,
          speakWith: (textToSpeak) => tts.speak(textToSpeak),
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
              engine.setBehavior('idle');
            }
          },
        });

        if (!result) {
          finalizeAssistantMessage(true);
          finalizePerformanceTrace('failed');
          releaseCurrentTurn();
          return;
        }

        syncAssistantMessageWithResult(result.replyText);
        finalizePerformanceTrace(turnConnection.status === 'error' ? 'failed' : 'completed');
        releaseCurrentTurn();
      } catch (err: unknown) {
        logger.error('发送消息失败:', err);
        toast.error(err instanceof Error ? err.message : '发送失败，请重试');
        finalizeAssistantMessage(true);
        finalizePerformanceTrace('failed');
        releaseCurrentTurn();
      }
    },
    [
      chatInput,
      tts,
      engine,
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
      dialogue,
    ],
  );

  return { chatInput, setChatInput, isChatLoading: isLoading, handleChatSend };
}
