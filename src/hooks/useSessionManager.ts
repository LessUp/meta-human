/**
 * 会话管理 Hook。
 *
 * 管理聊天会话的创建、重置和切换。
 */

import { useCallback } from 'react';
import { toast } from 'sonner';
import { useChatSessionStore } from '@/store/chatSessionStore';
import { useSystemStore } from '@/store/systemStore';
import { clearRemoteSession } from '@/core/dialogue/dialogueService';
import { abortPendingTurn } from '@/core/dialogue/dialogueOrchestrator';

export function useSessionManager() {
  const sessionId = useChatSessionStore((s) => s.sessionId);
  const initChatSession = useChatSessionStore((s) => s.initSession);
  const resetSystemState = useSystemStore((s) => s.resetSystemState);

  const handleNewSession = useCallback(() => {
    const oldSessionId = sessionId;
    abortPendingTurn();

    // 协调多 store 初始化
    initChatSession();
    resetSystemState();

    toast.success('已开启新会话');

    // 清理远程会话（fire and forget）
    void clearRemoteSession(oldSessionId);
  }, [sessionId, initChatSession, resetSystemState]);

  return {
    sessionId,
    handleNewSession,
  };
}
