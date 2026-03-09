import React from 'react';
import ChatMessages from '@/components/widgets/ChatMessages';
import ChatInput from '@/components/widgets/ChatInput';
import ErrorBanner from '@/components/widgets/ErrorBanner';
import { useDigitalHumanStore } from '@/store/digitalHumanStore';

interface MobileInteractiveAreaProps {
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onChatSend: () => void;
  onToggleRecording: () => void;
  isChatLoading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  error: string | null;
  onDismissError: () => void;
}

/**
 * 移动端交互区域
 * 参考 airi 的 MobileInteractiveArea，固定在底部的聊天界面
 * 优化触摸体验和安全区域适配
 */
export default function MobileInteractiveArea({
  chatInput,
  onChatInputChange,
  onChatSend,
  onToggleRecording,
  isChatLoading,
  messagesEndRef,
  error,
  onDismissError,
}: MobileInteractiveAreaProps) {
  const {
    isLoading,
    isSpeaking,
    isRecording,
    chatHistory,
  } = useDigitalHumanStore();

  return (
    <div
      className="fixed bottom-0 left-0 w-full z-20 flex flex-col"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
    >
      {/* 消息列表（向上渐变遮罩） */}
      <div className="px-3 pb-2">
        <ChatMessages
          messages={chatHistory}
          messagesEndRef={messagesEndRef}
        />
      </div>

      {/* 输入栏 */}
      <div className="px-3 pb-2">
        <ChatInput
          value={chatInput}
          onChange={onChatInputChange}
          onSend={onChatSend}
          onToggleRecording={onToggleRecording}
          isLoading={isLoading}
          isSpeaking={isSpeaking}
          isRecording={isRecording}
          isChatLoading={isChatLoading}
        />
        <ErrorBanner error={error} onDismiss={onDismissError} />
      </div>
    </div>
  );
}
