import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

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

const ENABLE_DEVTOOLS = import.meta.env.DEV && import.meta.env.MODE !== 'test';
let nextChatMessageId = 0;

const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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

const getOrCreateSessionId = (): string => {
  const storage = getSafeLocalStorage();
  if (!storage) {
    return generateSessionId();
  }

  const stored = storage.getItem('metahuman_session_id');
  if (stored) return stored;

  const newId = generateSessionId();
  storage.setItem('metahuman_session_id', newId);
  return newId;
};

export const useChatSessionStore = create<ChatSessionState>()(
  devtools(
    (set) => ({
      sessionId: getOrCreateSessionId(),
      chatHistory: [],

      initSession: () => {
        const newId = generateSessionId();
        const storage = getSafeLocalStorage();

        if (storage) {
          storage.setItem('metahuman_session_id', newId);
        }

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

        set((state) => ({
          chatHistory: [
            ...state.chatHistory,
            { id, role, text: normalizedText, timestamp, isStreaming },
          ],
        }));

        return id;
      },

      updateChatMessage: (id, updates) =>
        set((state) => ({
          chatHistory: state.chatHistory.map((msg) =>
            msg.id === id ? { ...msg, ...updates } : msg,
          ),
        })),

      removeChatMessage: (id) =>
        set((state) => ({
          chatHistory: state.chatHistory.filter((msg) => msg.id !== id),
        })),

      clearChatHistory: () => set({ chatHistory: [] }),
    }),
    { name: 'chat-session-store', enabled: ENABLE_DEVTOOLS },
  ),
);

export const selectSessionId = (s: ChatSessionState) => s.sessionId;
export const selectChatHistory = (s: ChatSessionState) => s.chatHistory;
