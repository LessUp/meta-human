import { useState, useCallback, useRef, useEffect } from 'react';
import { useDigitalHumanStore } from '@/store/digitalHumanStore';
import { ttsService } from '@/core/audio/audioService';
import { sendUserInput } from '@/core/dialogue/dialogueService';
import { handleDialogueResponse } from '@/core/dialogue/dialogueOrchestrator';
import { toast } from 'sonner';

/**
 * 聊天交互逻辑 Hook
 * 参考 airi 项目的 ChatArea 组件模式，将聊天逻辑从页面中解耦
 */
export function useChat() {
  const {
    isMuted,
    sessionId,
    chatHistory,
    addChatMessage,
  } = useDigitalHumanStore();

  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, scrollToBottom]);

  // 发送消息
  const handleChatSend = useCallback(async (text?: string) => {
    const content = (text ?? chatInput).trim();
    if (!content || isChatLoading) return;

    addChatMessage('user', content);
    if (!text) setChatInput('');

    setIsChatLoading(true);
    try {
      const res = await sendUserInput({
        userText: content,
        sessionId: sessionId,
        meta: { timestamp: Date.now() }
      });

      await handleDialogueResponse(res, {
        isMuted,
        speakWith: (textToSpeak) => ttsService.speak(textToSpeak),
      });
    } catch (err: any) {
      console.error('发送消息失败:', err);
      toast.error(err.message || '发送失败，请重试');
    } finally {
      setIsChatLoading(false);
    }
  }, [chatInput, isChatLoading, sessionId, isMuted, addChatMessage]);

  // 清空输入
  const clearInput = useCallback(() => {
    setChatInput('');
  }, []);

  return {
    chatInput,
    setChatInput,
    isChatLoading,
    messagesEndRef,
    chatHistory,
    handleChatSend,
    clearInput,
  };
}
