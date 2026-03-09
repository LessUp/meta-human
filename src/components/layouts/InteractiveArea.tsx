import React from 'react';
import ChatContainer from '@/components/widgets/ChatContainer';
import ChatMessages from '@/components/widgets/ChatMessages';
import ChatInput from '@/components/widgets/ChatInput';
import ErrorBanner from '@/components/widgets/ErrorBanner';
import { useDigitalHumanStore } from '@/store/digitalHumanStore';

interface InteractiveAreaProps {
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
 * 桌面端交互区域
 * 参考 airi 的 InteractiveArea，底部浮动的聊天输入 + 消息列表
 */
export default function InteractiveArea({
  chatInput,
  onChatInputChange,
  onChatSend,
  onToggleRecording,
  isChatLoading,
  messagesEndRef,
  error,
  onDismissError,
}: InteractiveAreaProps) {
  const {
    isLoading,
    isSpeaking,
    isRecording,
    chatHistory,
  } = useDigitalHumanStore();

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-20">
      <ChatContainer>
        <ChatMessages
          messages={chatHistory}
          messagesEndRef={messagesEndRef}
        />
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
      </ChatContainer>
    </div>
  );
}
