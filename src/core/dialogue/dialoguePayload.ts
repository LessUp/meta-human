export type DialogueMessageRole = 'system' | 'user' | 'assistant';

export interface DialogueMessage {
  role: DialogueMessageRole;
  content: string;
}

export interface DialogueRequestPayload {
  sessionId?: string;
  userText: string;
  meta?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  context?: Record<string, unknown>;
  messages?: DialogueMessage[];
}

function getLatestUserMessage(messages?: DialogueMessage[]): string {
  if (!messages || messages.length === 0) {
    return '';
  }

  for (let index = messages.length - 1; index >= 0; index--) {
    const message = messages[index];
    if (message.role === 'user') {
      return message.content.trim();
    }
  }

  return '';
}

export function normalizeDialogueRequestPayload(
  payload: DialogueRequestPayload,
): DialogueRequestPayload {
  const userText = payload.userText.trim() || getLatestUserMessage(payload.messages);
  const messages =
    payload.messages && payload.messages.length > 0
      ? payload.messages
      : userText
        ? [{ role: 'user' as const, content: userText }]
        : undefined;

  const metadata = {
    ...(payload.metadata ?? payload.meta ?? {}),
    ...(payload.context ? { context: payload.context } : {}),
  };

  const normalizedMetadata = Object.keys(metadata).length > 0 ? metadata : undefined;

  return {
    ...payload,
    userText,
    messages,
    metadata: normalizedMetadata,
    meta: normalizedMetadata,
  };
}
