/**
 * 对话编排器。
 *
 * 管理对话轮次的生命周期，处理并发控制和状态管理。
 */
import { ChatResponsePayload, type StreamCallbacks } from './dialogueService';
import { getDefaultChatTransport } from './chatTransport';
import type { DigitalHumanEngine } from '../avatar/DigitalHumanEngine';
import { loggers } from '../../lib/logger';

const logger = loggers.orchestrator;

export interface DialogueHandleOptions {
  engine?: DigitalHumanEngine;
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

/**
 * 对话编排器类。
 *
 * 封装对话状态管理，避免模块级状态导致的测试泄漏问题。
 */
export class DialogueOrchestrator {
  private pendingTurn: PendingDialogueTurn | null = null;
  private nextTurnId = 0;

  /**
   * 重置编排器状态。
   */
  reset(): void {
    this.pendingTurn = null;
    this.nextTurnId = 0;
  }

  /**
   * 中止当前待处理的对话轮次。
   */
  abortPendingTurn(): void {
    if (this.pendingTurn) {
      this.pendingTurn.abortController.abort();
      this.pendingTurn = null;
    }
  }

  /**
   * 检查是否有待处理的对话轮次。
   */
  isTurnPending(): boolean {
    return this.pendingTurn !== null;
  }

  /**
   * 运行对话轮次。
   */
  async runDialogueTurn(
    userText: string,
    options: DialogueTurnOptions = {},
  ): Promise<ChatResponsePayload | undefined> {
    const {
      sessionId,
      meta,
      engine,
      isMuted = false,
      speakWith,
      setLoading,
      onConnectionChange,
      onClearError,
      onError,
      onResetBehavior,
      onAddUserMessage,
    } = options;

    const preparation = this.prepareDialogueTurn(userText, engine, onAddUserMessage, setLoading);
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
          engine,
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
        this.finalizeDialogueTurn(turnId, setLoading, onResetBehavior);
      }
    };

    const promise = execute();
    this.pendingTurn = { id: turnId, promise, abortController: abortCtrl };
    return promise;
  }

  /**
   * 运行流式对话轮次。
   */
  async runDialogueTurnStream(
    userText: string,
    options: DialogueTurnOptions = {},
    streamCallbacks: StreamCallbacks = {},
  ): Promise<ChatResponsePayload | undefined> {
    const {
      sessionId,
      meta,
      engine,
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

    const preparation = this.prepareDialogueTurn(userText, engine, onAddUserMessage, setLoading);
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
          engine,
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
        this.finalizeDialogueTurn(turnId, setLoading, onResetBehavior);
        finishStream();
      }
    };

    const promise = execute();
    this.pendingTurn = { id: turnId, promise, abortController: abortCtrl };
    return promise;
  }

  /**
   * 预轮次验证和设置。
   */
  private prepareDialogueTurn(
    userText: string,
    engine: DigitalHumanEngine | undefined,
    onAddUserMessage?: (text: string) => void,
    setLoading?: (loading: boolean) => void,
  ): { content: string; turnId: number; abortCtrl: AbortController } | null {
    const content = userText.trim();
    if (!content) {
      return null;
    }

    if (this.pendingTurn) {
      logger.warn('对话请求被忽略：上一轮对话仍在进行中');
      return null;
    }

    const abortCtrl = new AbortController();
    const turnId = ++this.nextTurnId;

    onAddUserMessage?.(content);
    setLoading?.(true);
    engine?.setBehavior('thinking');

    return { content, turnId, abortCtrl };
  }

  /**
   * 后轮次清理。
   */
  private finalizeDialogueTurn(
    turnId: number,
    setLoading?: (loading: boolean) => void,
    onResetBehavior?: () => void,
  ): void {
    if (this.pendingTurn?.id !== turnId) {
      return;
    }

    setLoading?.(false);
    this.pendingTurn = null;
    onResetBehavior?.();
  }
}

export async function handleDialogueResponse(
  res: ChatResponsePayload,
  options: DialogueHandleOptions = {},
): Promise<void> {
  const { engine, isMuted = false, speakWith, onAddAssistantMessage, onError } = options;

  if (res.replyText) {
    onAddAssistantMessage?.(res.replyText);
  }

  if (res.emotion) {
    engine?.setEmotion(res.emotion);
  }

  if (res.action && res.action !== 'idle') {
    engine?.playAnimation(res.action);
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
