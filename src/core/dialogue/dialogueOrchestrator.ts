import { ChatResponsePayload, sendUserInput, streamUserInput, type StreamCallbacks } from './dialogueService';
import { digitalHumanEngine } from '../avatar/DigitalHumanEngine';

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

export async function runDialogueTurn(
  userText: string,
  options: DialogueTurnOptions = {}
): Promise<ChatResponsePayload | undefined> {
  const content = userText.trim();
  if (!content) {
    return undefined;
  }

  if (pendingTurn) {
    console.warn('对话请求被忽略：上一轮对话仍在进行中');
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
    try {
      const result = await sendUserInput({
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
    console.warn('对话请求被忽略：上一轮对话仍在进行中');
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
    onAddAssistantMessage,
    onStreamToken,
    onStreamEnd,
  } = options;

  onAddUserMessage?.(content);

  setLoading?.(true);
  digitalHumanEngine.setBehavior('thinking');

  const execute = async (): Promise<ChatResponsePayload | undefined> => {
    let streamResponse: ChatResponsePayload | null = null;

    try {
      const enrichedCallbacks: StreamCallbacks = {
        ...streamCallbacks,
        onDone: (response) => { streamResponse = response; },
      };

      const generator = streamUserInput(
        { sessionId, userText: content, meta },
        {},
        enrichedCallbacks,
      );

      let accumulatedText = '';

      for await (const token of generator) {
        accumulatedText += token;
        onStreamToken?.(accumulatedText);
      }

      // 优先使用 done 事件中的结构化响应（含 emotion/action）
      const response = streamResponse ?? { replyText: accumulatedText, emotion: 'neutral', action: 'idle' };

      onConnectionChange?.('connected');
      onClearError?.();

      await handleDialogueResponse(response, {
        isMuted,
        speakWith,
        onAddAssistantMessage: undefined,
        onError,
      });

      onStreamEnd?.();
      return response;
    } catch (error) {
      console.error('流式对话失败:', error);
      onError?.(error instanceof Error ? error.message : '流式对话失败');
      return undefined;
    } finally {
      setLoading?.(false);
      pendingTurn = null;
      onResetBehavior?.();
      onStreamEnd?.();
    }
  };

  pendingTurn = execute();
  return pendingTurn;
}

export async function handleDialogueResponse(
  res: ChatResponsePayload,
  options: DialogueHandleOptions = {}
): Promise<void> {
  const {
    isMuted = false,
    speakWith,
    onAddAssistantMessage,
    onError,
  } = options;

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
      console.warn('语音播报失败，但对话文本已返回:', error);
      onError?.(error instanceof Error ? error.message : '语音播报失败');
    }
  }
}
