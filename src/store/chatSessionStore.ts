import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { generateId } from '../lib/utils';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: number;
  role: ChatRole;
  text: string;
  timestamp: number;
  isStreaming?: boolean;
}

interface ChatSessionState {
  sessionId: string;
  chatHistory: ChatMessage[];
  initSession: () => string;
  addChatMessage: (role: ChatRole, text: string, isStreaming?: boolean) => number | null;
  updateChatMessage: (
    id: number,
    updates: Partial<Pick<ChatMessage, 'text' | 'isStreaming'>>,
  ) => void;
  removeChatMessage: (id: number) => void;
  clearChatHistory: () => void;
}

type ChatSessionSetFn = {
  (partial: Partial<ChatSessionState> | ((state: ChatSessionState) => Partial<ChatSessionState>), replace?: false): void;
};

const ENABLE_DEVTOOLS = import.meta.env.DEV && import.meta.env.MODE !== 'test';
const SESSION_STORAGE_KEY = 'metahuman_session_id';
const CHAT_HISTORY_STORAGE_KEY = 'metahuman_chat_history';
const MAX_PERSISTED_CHAT_MESSAGES = 100;

let nextChatMessageId = 0;

const generateSessionId = (): string => {
  return generateId('session');
};

const generateChatMessageId = (): number => {
  nextChatMessageId += 1;
  return Date.now() + nextChatMessageId;
};

const getSafeLocalStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const isTransientStreamingPlaceholder = (message: ChatMessage): boolean => {
  return message.role === 'assistant' && message.isStreaming === true && message.text.trim().length === 0;
};

const applyChatHistoryLimit = (chatHistory: ChatMessage[]): ChatMessage[] => {
  let persistedCount = 0;
  const limitedHistory: ChatMessage[] = [];

  for (let index = chatHistory.length - 1; index >= 0; index -= 1) {
    const message = chatHistory[index];

    if (isTransientStreamingPlaceholder(message)) {
      limitedHistory.push(message);
      continue;
    }

    if (persistedCount >= MAX_PERSISTED_CHAT_MESSAGES) {
      continue;
    }

    limitedHistory.push(message);
    persistedCount += 1;
  }

  return limitedHistory.reverse();
};

const getPersistableChatHistory = (chatHistory: ChatMessage[]): ChatMessage[] => {
  return applyChatHistoryLimit(chatHistory.filter((message) => !isTransientStreamingPlaceholder(message)));
};

const persistSessionId = (sessionId: string): void => {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(SESSION_STORAGE_KEY, sessionId);
  } catch {
    // Ignore storage write failures and keep runtime state in memory.
  }
};

const persistChatHistory = (chatHistory: ChatMessage[]): void => {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(chatHistory));
  } catch {
    // Ignore storage write failures and keep runtime state in memory.
  }
};

const isPersistedChatMessage = (value: unknown): value is ChatMessage => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<ChatMessage>;

  return (
    typeof candidate.id === 'number' &&
    Number.isFinite(candidate.id) &&
    (candidate.role === 'user' || candidate.role === 'assistant') &&
    typeof candidate.text === 'string' &&
    typeof candidate.timestamp === 'number' &&
    Number.isFinite(candidate.timestamp) &&
    (candidate.isStreaming === undefined || typeof candidate.isStreaming === 'boolean')
  );
};

const getPersistedChatHistory = (): ChatMessage[] => {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return [];
  }

  const stored = storage.getItem(CHAT_HISTORY_STORAGE_KEY);
  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || !parsed.every(isPersistedChatMessage)) {
      return [];
    }

    return applyChatHistoryLimit(
      parsed
        .filter((message) => message.text.trim().length > 0)
        .map((message) => ({
          ...message,
          isStreaming: false,
        })),
    );
  } catch {
    return [];
  }
};

const getOrCreateSessionState = (): Pick<ChatSessionState, 'sessionId' | 'chatHistory'> => {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return {
      sessionId: generateSessionId(),
      chatHistory: [],
    };
  }

  const storedSessionId = storage.getItem(SESSION_STORAGE_KEY);
  if (!storedSessionId) {
    const newId = generateSessionId();
    persistSessionId(newId);
    persistChatHistory([]);

    return {
      sessionId: newId,
      chatHistory: [],
    };
  }

  const chatHistory = getPersistedChatHistory();
  persistChatHistory(chatHistory);

  return {
    sessionId: storedSessionId,
    chatHistory,
  };
};

const setChatHistoryState = (
  set: ChatSessionSetFn,
  updater: (chatHistory: ChatMessage[]) => ChatMessage[],
  shouldPersist = true,
): void => {
  set((state) => {
    const chatHistory = applyChatHistoryLimit(updater(state.chatHistory));
    if (shouldPersist) {
      persistChatHistory(getPersistableChatHistory(chatHistory));
    }
    return { chatHistory };
  });
};

export const useChatSessionStore = create<ChatSessionState>()(
  devtools(
    (set) => ({
      ...getOrCreateSessionState(),

      initSession: () => {
        const newId = generateSessionId();
        persistSessionId(newId);
        persistChatHistory([]);

        set({
          sessionId: newId,
          chatHistory: [],
        });

        return newId;
      },

      addChatMessage: (role, text, isStreaming = false) => {
        const normalizedText = text.trim();
        if (!normalizedText && !isStreaming) {
          return null;
        }

        const timestamp = Date.now();
        const id = generateChatMessageId();
        const message = { id, role, text: normalizedText, timestamp, isStreaming };

        setChatHistoryState(set, (chatHistory) => [...chatHistory, message], !isStreaming);

        return id;
      },

      updateChatMessage: (id, updates) =>
        setChatHistoryState(
          set,
          (chatHistory) => chatHistory.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg)),
          updates.isStreaming !== true,
        ),

      removeChatMessage: (id) =>
        setChatHistoryState(set, (chatHistory) => chatHistory.filter((msg) => msg.id !== id)),

      clearChatHistory: () => setChatHistoryState(set, () => []),
    }),
    { name: 'chat-session-store', enabled: ENABLE_DEVTOOLS },
  ),
);

export const selectSessionId = (s: ChatSessionState) => s.sessionId;
export const selectChatHistory = (s: ChatSessionState) => s.chatHistory;
