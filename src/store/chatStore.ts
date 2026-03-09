// chatStore — 会话管理/聊天历史
// 参考 AIRI chat/session-store 的领域分离设计
import { create } from 'zustand';
import type { ChatMessage } from './types';
import { generateSessionId, getSafeLocalStorage } from './utils';

interface ChatState {
  sessionId: string;
  chatHistory: ChatMessage[];
  maxChatHistoryLength: number;

  initSession: () => void;
  addChatMessage: (role: 'user' | 'assistant', text: string) => void;
  clearChatHistory: () => void;
}

// 从 localStorage 获取或创建会话ID
const getOrCreateSessionId = (): string => {
  const storage = getSafeLocalStorage();
  if (!storage) return generateSessionId();
  try {
    const stored = storage.getItem('metahuman_session_id');
    if (stored) return stored;
    const newId = generateSessionId();
    storage.setItem('metahuman_session_id', newId);
    return newId;
  } catch {
    return generateSessionId();
  }
};

export const useChatStore = create<ChatState>((set) => ({
  sessionId: getOrCreateSessionId(),
  chatHistory: [],
  maxChatHistoryLength: 100,

  initSession: () => {
    const newId = generateSessionId();
    const storage = getSafeLocalStorage();
    if (storage) {
      try { storage.setItem('metahuman_session_id', newId); } catch { /* 忽略存储错误 */ }
    }
    set({ sessionId: newId, chatHistory: [] });
  },

  addChatMessage: (role, text) => set((state) => {
    const newMessage: ChatMessage = {
      id: Date.now(),
      role,
      text,
      timestamp: Date.now(),
    };
    let newHistory = [...state.chatHistory, newMessage];
    while (newHistory.length > state.maxChatHistoryLength) {
      newHistory.shift();
    }
    return { chatHistory: newHistory };
  }),

  clearChatHistory: () => set({ chatHistory: [] }),
}));
