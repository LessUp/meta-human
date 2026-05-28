export type DialogueTurnStatus = 'idle' | 'sending' | 'streaming' | 'complete' | 'error';

export type DialogueTurnMode = 'standard' | 'streaming' | null;

export interface DialogueTurnSnapshot {
  status: DialogueTurnStatus;
  mode: DialogueTurnMode;
  turnId: number | null;
  userText: string | null;
  replyText: string;
  error: string | null;
  startedAt: number | null;
  updatedAt: number;
}

export const createIdleDialogueTurnSnapshot = (): DialogueTurnSnapshot => ({
  status: 'idle',
  mode: null,
  turnId: null,
  userText: null,
  replyText: '',
  error: null,
  startedAt: null,
  updatedAt: Date.now(),
});
