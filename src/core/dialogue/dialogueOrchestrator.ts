import {
  ChatResponsePayload,
  type DialogueServiceResult,
  type StreamCallbacks,
} from './dialogueService';
import { getDefaultChatTransport } from './chatTransport';
import { digitalHumanEngine } from '../avatar';
import { loggers } from '../../lib/logger';

const logger = loggers.orchestrator;

export interface DialogueHandleOptions {
  isMuted?: boolean;
  speakWith?: (text: string) => Promise<void> | void;
  onAddUserMessage?: (text: string) => void;
  onAddAssistantMessage?: (text: string) => void;
  onError?: (message: string) => void;
}

export interface DialogueTurnOptions extends DialogueHandleOptions {
  sessionId?: string;
  meta?: Record<string, unknown>;
  streaming?: boolean;
  onStreamToken?: (text: string) => void;
  onStreamEnd?: () => void;
  setLoading?: (loading: boolean) => void;
  onConnectionChange?: (status: 'connected' | 'error') => void;
  onClearError?: () => void;
  onResetBehavior?: () => void;
}

let pendingTurn: Promise<ChatResponsePayload | undefined> | null = null;

/**
 * Reset the dialogue orchestrator state.
 * Call this during app initialization or testing to clear module-level state.
 */
export function resetDialogueOrchestrator(): void {
  pendingTurn = null;
}

export async function runDialogueTurn(
  userText: string,
  options: DialogueTurnOptions = {},
): Promise<ChatResponsePayload | undefined> {
  const content = userText.trim();
  if (!content) {
    return undefined;
  }

  if (pendingTurn) {
    logger.warn('对话请求被忽略：上一轮对话仍在进行中');
    return undefined;
  }

  const {
    sessionId,
    meta,
    isMuted = false,
    speakWith,
    setLoading,
    onConnectionChange,
    onClearError,
    onError,
    onResetBehavior,
    onAddUserMessage,
  } = options;

  onAddUserMessage?.(content);

  setLoading?.(true);
  digitalHumanEngine.setBehavior('thinking');

  const execute = async (): Promise<ChatResponsePayload | undefined> => {
    const chatTransport = getDefaultChatTransport();

    try {
      const result = await chatTransport.send({
        sessionId,
        userText: content,
        meta,
      });

      if (result.connectionStatus === 'connected') {
        onConnectionChange?.('connected');
        onClearError?.();
      } else if (result.connectionStatus === 'error') {
        onConnectionChange?.('error');
        if (result.error) {
          onError?.(result.error);
        }
      }

      await handleDialogueResponse(result.response, {
        isMuted,
        speakWith,
        onAddAssistantMessage: options.onAddAssistantMessage,
        onError,
      });

      return result.response;
    } finally {
      setLoading?.(false);
      pendingTurn = null;
      onResetBehavior?.();
    }
  };

  pendingTurn = execute();
  return pendingTurn;
}

export async function runDialogueTurnStream(
  userText: string,
  options: DialogueTurnOptions = {},
  streamCallbacks: StreamCallbacks = {},
): Promise<ChatResponsePayload | undefined> {
  const content = userText.trim();
  if (!content) {
    return undefined;
  }

  if (pendingTurn) {
    logger.warn('对话请求被忽略：上一轮对话仍在进行中');
    return undefined;
  }

  const {
    sessionId,
    meta,
    isMuted = false,
    speakWith,
    setLoading,
    onConnectionChange,
    onClearError,
    onError,
    onResetBehavior,
    onAddUserMessage,
    onStreamToken,
    onStreamEnd,
  } = options;

  onAddUserMessage?.(content);

  setLoading?.(true);
  digitalHumanEngine.setBehavior('thinking');

  let didFinishStream = false;
  let streamLock = 0; // Use counter for synchronization across async boundaries

  const finishStream = () => {
    if (didFinishStream) {
      return;
    }

    didFinishStream = true;
    onStreamEnd?.();
  };

  const execute = async (): Promise<ChatResponsePayload | undefined> => {
    let streamResult: DialogueServiceResult | null = null;
    const chatTransport = getDefaultChatTransport();
    const currentStreamLock = ++streamLock;

    try {
      const generator = chatTransport.stream(
        { sessionId, userText: content, meta },
        {},
        streamCallbacks,
      );

      let accumulatedText = '';
      let step = await generator.next();

      while (!step.done) {
        // Check if this stream is still valid
        if (currentStreamLock !== streamLock) {
          logger.warn('Stream invalidated by new request');
          return undefined;
        }

        accumulatedText += step.value;
        onStreamToken?.(accumulatedText);

        try {
          step = await generator.next();
        } catch (genError: unknown) {
          logger.error('Generator error:', genError);
          throw genError;
        }
      }

      streamResult = step.value;

      const result = streamResult ?? {
        response: {
          replyText: accumulatedText,
          emotion: 'neutral',
          action: 'idle',
        },
        connectionStatus: 'connected',
        error: null,
      };

      if (result.connectionStatus === 'connected') {
        onConnectionChange?.('connected');
        onClearError?.();
      } else {
        onConnectionChange?.('error');
        if (result.error) {
          onError?.(result.error);
        }
      }

      await handleDialogueResponse(result.response, {
        isMuted,
        speakWith,
        onAddAssistantMessage: options.onAddAssistantMessage,
        onError,
      });

      finishStream();
      return result.response;
    } catch (error) {
      logger.error('流式对话失败:', error);
      onError?.(error instanceof Error ? error.message : '流式对话失败');
      return undefined;
    } finally {
      setLoading?.(false);
      pendingTurn = null;
      onResetBehavior?.();
      finishStream();
    }
  };

  pendingTurn = execute();
  return pendingTurn;
}

export async function handleDialogueResponse(
  res: ChatResponsePayload,
  options: DialogueHandleOptions = {},
): Promise<void> {
  const { isMuted = false, speakWith, onAddAssistantMessage, onError } = options;

  if (res.replyText) {
    onAddAssistantMessage?.(res.replyText);
  }

  if (res.emotion) {
    digitalHumanEngine.setEmotion(res.emotion);
  }

  if (res.action && res.action !== 'idle') {
    digitalHumanEngine.playAnimation(res.action);
  }

  if (res.replyText && !isMuted && speakWith) {
    try {
      await speakWith(res.replyText);
    } catch (error: unknown) {
      logger.warn('语音播报失败，但对话文本已返回:', error);
      onError?.(error instanceof Error ? error.message : '语音播报失败');
    }
  }
}
