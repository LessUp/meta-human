/**
 * 对话编排器。
 *
 * 管理对话轮次的生命周期，处理并发控制和状态管理。
 */
import { ChatResponsePayload, type StreamCallbacks } from './dialogueService';
import { getDefaultChatTransport } from './chatTransport';
import type { DigitalHumanEngine } from '../avatar/DigitalHumanEngine';
import { loggers } from '../../lib/logger';
import {
  createIdleDialogueTurnSnapshot,
  type DialogueTurnMode,
  type DialogueTurnSnapshot,
} from './dialogueTurnLifecycle';

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
  finalize: () => void;
  streamGenerator?: AsyncGenerator<string, unknown, unknown>;
}

/**
 * 对话编排器类。
 *
 * 封装对话状态管理，避免模块级状态导致的测试泄漏问题。
 */
export class DialogueOrchestrator {
  private pendingTurn: PendingDialogueTurn | null = null;
  private nextTurnId = 0;
  private turnSnapshot: DialogueTurnSnapshot = createIdleDialogueTurnSnapshot();
  private turnSnapshotListeners = new Set<(snapshot: DialogueTurnSnapshot) => void>();

  /**
   * 重置编排器状态。
   */
  reset(): void {
    this.cancelPendingTurn();
    this.publishTurnSnapshot(createIdleDialogueTurnSnapshot());
  }

  /**
   * 中止当前待处理的对话轮次。
   */
  abortPendingTurn(): void {
    if (this.cancelPendingTurn()) {
      this.publishTurnSnapshot(createIdleDialogueTurnSnapshot());
    }
  }

  /**
   * 检查是否有待处理的对话轮次。
   */
  isTurnPending(): boolean {
    return this.pendingTurn !== null && !this.pendingTurn.abortController.signal.aborted;
  }

  getTurnSnapshot(): DialogueTurnSnapshot {
    return { ...this.turnSnapshot };
  }

  subscribeTurnSnapshot(listener: (snapshot: DialogueTurnSnapshot) => void): () => void {
    this.turnSnapshotListeners.add(listener);
    return () => {
      this.turnSnapshotListeners.delete(listener);
    };
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

    const preparation = this.prepareDialogueTurn(
      userText,
      engine,
      onAddUserMessage,
      setLoading,
      'standard',
    );
    if (!preparation) {
      return undefined;
    }

    const { content, turnId, abortCtrl } = preparation;
    const finalizePendingTurn = this.createPendingTurnFinalizer(
      turnId,
      setLoading,
      onResetBehavior,
    );
    const pendingTurn: PendingDialogueTurn = {
      id: turnId,
      promise: Promise.resolve(undefined),
      abortController: abortCtrl,
      finalize: finalizePendingTurn,
    };
    this.pendingTurn = pendingTurn;

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

        this.publishTurnSnapshot({
          status: result.connectionStatus === 'error' ? 'error' : 'complete',
          mode: 'standard',
          turnId,
          userText: content,
          replyText: result.response.replyText,
          error: result.error,
          startedAt: this.turnSnapshot.startedAt,
          updatedAt: Date.now(),
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
          this.publishTurnSnapshot({
            status: 'error',
            mode: 'standard',
            turnId,
            userText: content,
            replyText: '',
            error: error instanceof Error ? error.message : '对话失败',
            startedAt: this.turnSnapshot.startedAt,
            updatedAt: Date.now(),
          });
          throw error;
        }
        return undefined;
      } finally {
        this.finalizeDialogueTurn(turnId);
      }
    };

    const promise = execute();
    pendingTurn.promise = promise;
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

    const preparation = this.prepareDialogueTurn(
      userText,
      engine,
      onAddUserMessage,
      setLoading,
      'streaming',
    );
    if (!preparation) {
      return undefined;
    }

    const { content, turnId, abortCtrl } = preparation;
    const finalizePendingTurn = this.createPendingTurnFinalizer(
      turnId,
      setLoading,
      onResetBehavior,
    );

    let didFinishStream = false;

    const finishStream = () => {
      if (didFinishStream) {
        return;
      }

      didFinishStream = true;
      onStreamEnd?.();
    };

    const pendingTurn: PendingDialogueTurn = {
      id: turnId,
      promise: Promise.resolve(undefined),
      abortController: abortCtrl,
      finalize: finalizePendingTurn,
    };
    this.pendingTurn = pendingTurn;

    const execute = async (): Promise<ChatResponsePayload | undefined> => {
      const chatTransport = getDefaultChatTransport();
      let accumulatedText = '';

      try {
        const generator = chatTransport.stream(
          { sessionId, userText: content, meta },
          {},
          streamCallbacks,
          abortCtrl.signal,
        );
        pendingTurn.streamGenerator = generator;

        let step = await generator.next();

        while (!step.done) {
          if (abortCtrl.signal.aborted) {
            logger.warn('Stream aborted');
            finishStream();
            return undefined;
          }

          accumulatedText += step.value;
          this.publishTurnSnapshot({
            status: 'streaming',
            mode: 'streaming',
            turnId,
            userText: content,
            replyText: accumulatedText,
            error: null,
            startedAt: this.turnSnapshot.startedAt,
            updatedAt: Date.now(),
          });
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

        this.publishTurnSnapshot({
          status: result.connectionStatus === 'error' ? 'error' : 'complete',
          mode: 'streaming',
          turnId,
          userText: content,
          replyText: result.response.replyText,
          error: result.error,
          startedAt: this.turnSnapshot.startedAt,
          updatedAt: Date.now(),
        });

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
          this.publishTurnSnapshot({
            status: 'error',
            mode: 'streaming',
            turnId,
            userText: content,
            replyText: accumulatedText,
            error: error instanceof Error ? error.message : '流式对话失败',
            startedAt: this.turnSnapshot.startedAt,
            updatedAt: Date.now(),
          });
          onError?.(error instanceof Error ? error.message : '流式对话失败');
        }
        return undefined;
      } finally {
        pendingTurn.streamGenerator = undefined;
        this.finalizeDialogueTurn(turnId);
        finishStream();
      }
    };
    const promise = execute();
    pendingTurn.promise = promise;
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
    mode: DialogueTurnMode = 'standard',
  ): { content: string; turnId: number; abortCtrl: AbortController } | null {
    const content = userText.trim();
    if (!content) {
      return null;
    }

    if (this.pendingTurn && !this.pendingTurn.abortController.signal.aborted) {
      logger.warn('对话请求被忽略：上一轮对话仍在进行中');
      return null;
    }

    const abortCtrl = new AbortController();
    const turnId = ++this.nextTurnId;

    onAddUserMessage?.(content);
    setLoading?.(true);
    engine?.setBehavior('thinking');
    this.publishTurnSnapshot({
      status: 'sending',
      mode,
      turnId,
      userText: content,
      replyText: '',
      error: null,
      startedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { content, turnId, abortCtrl };
  }

  private createPendingTurnFinalizer(
    turnId: number,
    setLoading?: (loading: boolean) => void,
    onResetBehavior?: () => void,
  ): () => void {
    let isFinalized = false;

    return () => {
      if (isFinalized) {
        return;
      }

      isFinalized = true;
      setLoading?.(false);
      this.pendingTurn = this.pendingTurn?.id === turnId ? null : this.pendingTurn;
      onResetBehavior?.();
    };
  }

  /**
   * 后轮次清理。
   */
  private finalizeDialogueTurn(turnId: number): void {
    if (this.pendingTurn?.id !== turnId) {
      return;
    }

    this.pendingTurn.finalize();
  }

  private cancelPendingTurn(): boolean {
    if (!this.pendingTurn) {
      return false;
    }

    this.pendingTurn.abortController.abort();
    void this.closeStreamGenerator(this.pendingTurn.streamGenerator);
    this.pendingTurn.finalize();
    return true;
  }

  private async closeStreamGenerator(
    generator?: AsyncGenerator<string, unknown, unknown>,
  ): Promise<void> {
    if (!generator?.return) {
      return;
    }

    try {
      await generator.return(undefined);
    } catch (error) {
      logger.warn('Failed to close stream generator:', error);
    }
  }

  private publishTurnSnapshot(snapshot: DialogueTurnSnapshot): void {
    this.turnSnapshot = snapshot;
    this.turnSnapshotListeners.forEach((listener) => listener({ ...snapshot }));
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
