import { ChatResponsePayload, type StreamCallbacks } from './dialogueService';
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
  onTurnResponse?: (response: ChatResponsePayload) => void;
  setLoading?: (loading: boolean) => void;
  onConnectionChange?: (status: 'connected' | 'error') => void;
  onClearError?: () => void;
  onResetBehavior?: () => void;
}

interface PendingDialogueTurn {
  id: number;
  promise: Promise<ChatResponsePayload | undefined>;
  abortController: AbortController;
}

let pendingTurn: PendingDialogueTurn | null = null;
let nextTurnId = 0;

/**
 * Reset the dialogue orchestrator state.
 * Call this during app initialization or testing to clear module-level state.
 */
export function resetDialogueOrchestrator(): void {
  pendingTurn = null;
  nextTurnId = 0;
}

/**
 * Abort any pending dialogue turn.
 * This will cancel the current request and clean up state.
 */
export function abortPendingTurn(): void {
  if (pendingTurn) {
    pendingTurn.abortController.abort();
    pendingTurn = null;
  }
}

/**
 * Check if a dialogue turn is currently pending.
 */
export function isDialogueTurnPending(): boolean {
  return pendingTurn !== null;
}

/**
 * Common pre-turn validation and setup
 */
function prepareDialogueTurn(
  userText: string,
  onAddUserMessage?: (text: string) => void,
  setLoading?: (loading: boolean) => void,
): { content: string; turnId: number; abortCtrl: AbortController } | null {
  const content = userText.trim();
  if (!content) {
    return null;
  }

  if (pendingTurn) {
    logger.warn('对话请求被忽略：上一轮对话仍在进行中');
    return null;
  }

  // Create new abort controller for this turn
  const abortCtrl = new AbortController();
  const turnId = ++nextTurnId;

  onAddUserMessage?.(content);
  setLoading?.(true);
  digitalHumanEngine.setBehavior('thinking');

  return { content, turnId, abortCtrl };
}

/**
 * Common post-turn cleanup
 */
function finalizeDialogueTurn(
  turnId: number,
  setLoading?: (loading: boolean) => void,
  onResetBehavior?: () => void,
): void {
  if (pendingTurn?.id !== turnId) {
    return;
  }

  setLoading?.(false);
  pendingTurn = null;
  onResetBehavior?.();
}

export async function runDialogueTurn(
  userText: string,
  options: DialogueTurnOptions = {},
): Promise<ChatResponsePayload | undefined> {
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

  const preparation = prepareDialogueTurn(userText, onAddUserMessage, setLoading);
  if (!preparation) {
    return undefined;
  }

  const { content, turnId, abortCtrl } = preparation;

  const execute = async (): Promise<ChatResponsePayload | undefined> => {
    const chatTransport = getDefaultChatTransport();

    try {
      const result = await chatTransport.send(
        {
          sessionId,
          userText: content,
          meta,
        },
        {},
        abortCtrl.signal,
      );

      // Check if aborted
      if (abortCtrl.signal.aborted) {
        return undefined;
      }

      if (result.connectionStatus === 'connected') {
        onConnectionChange?.('connected');
        onClearError?.();
      } else if (result.connectionStatus === 'error') {
        onConnectionChange?.('error');
        if (result.error) {
          onError?.(result.error);
        }
      }

      options.onTurnResponse?.(result.response);

      await handleDialogueResponse(result.response, {
        isMuted,
        speakWith,
        onAddAssistantMessage: options.onAddAssistantMessage,
        onError,
      });

      return result.response;
    } catch (error) {
      if (!abortCtrl.signal.aborted) {
        throw error;
      }
      return undefined;
    } finally {
      finalizeDialogueTurn(turnId, setLoading, onResetBehavior);
    }
  };

  const promise = execute();
  pendingTurn = { id: turnId, promise, abortController: abortCtrl };
  return promise;
}

export async function runDialogueTurnStream(
  userText: string,
  options: DialogueTurnOptions = {},
  streamCallbacks: StreamCallbacks = {},
): Promise<ChatResponsePayload | undefined> {
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

  const preparation = prepareDialogueTurn(userText, onAddUserMessage, setLoading);
  if (!preparation) {
    return undefined;
  }

  const { content, turnId, abortCtrl } = preparation;

  let didFinishStream = false;

  const finishStream = () => {
    if (didFinishStream) {
      return;
    }

    didFinishStream = true;
    onStreamEnd?.();
  };

  const execute = async (): Promise<ChatResponsePayload | undefined> => {
    const chatTransport = getDefaultChatTransport();

    try {
      const generator = chatTransport.stream(
        { sessionId, userText: content, meta },
        {},
        streamCallbacks,
        abortCtrl.signal,
      );

      let accumulatedText = '';
      let step = await generator.next();

      while (!step.done) {
        // Check if aborted
        if (abortCtrl.signal.aborted) {
          logger.warn('Stream aborted');
          finishStream();
          return undefined;
        }

        accumulatedText += step.value;
        onStreamToken?.(accumulatedText);

        try {
          step = await generator.next();
        } catch (genError: unknown) {
          // Don't throw if aborted
          if (!abortCtrl.signal.aborted) {
            logger.error('Generator error:', genError);
            throw genError;
          }
          finishStream();
          return undefined;
        }
      }

      const streamResult = step.value;

      const result = streamResult ?? {
        response: {
          replyText: accumulatedText,
          emotion: 'neutral',
          action: 'idle',
        },
        connectionStatus: 'connected' as const,
        error: null,
      };

      // Check if aborted before processing result
      if (abortCtrl.signal.aborted) {
        finishStream();
        return undefined;
      }

      if (result.connectionStatus === 'connected') {
        onConnectionChange?.('connected');
        onClearError?.();
      } else {
        onConnectionChange?.('error');
        if (result.error) {
          onError?.(result.error);
        }
      }

      options.onTurnResponse?.(result.response);

      await handleDialogueResponse(result.response, {
        isMuted,
        speakWith,
        onAddAssistantMessage: options.onAddAssistantMessage,
        onError,
      });

      finishStream();
      return result.response;
    } catch (error) {
      if (!abortCtrl.signal.aborted) {
        logger.error('流式对话失败:', error);
        onError?.(error instanceof Error ? error.message : '流式对话失败');
      }
      return undefined;
    } finally {
      finalizeDialogueTurn(turnId, setLoading, onResetBehavior);
      finishStream();
    }
  };

  const promise = execute();
  pendingTurn = { id: turnId, promise, abortController: abortCtrl };
  return promise;
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
    void Promise.resolve()
      .then(() => speakWith(res.replyText))
      .catch((error: unknown) => {
        logger.warn('语音播报失败，但对话文本已返回:', error);
        onError?.(error instanceof Error ? error.message : '语音播报失败');
      });
  }
}
