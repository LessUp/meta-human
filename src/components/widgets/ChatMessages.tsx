import React from 'react';
import { MessageSquare } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | string;
  text: string;
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

/**
 * 聊天消息列表组件
 * 参考 airi 的 ChatHistory，支持空状态、渐变遮罩和消息气泡
 */
export default function ChatMessages({ messages, messagesEndRef }: ChatMessagesProps) {
  if (messages.length === 0) {
    return (
      <div className="text-center py-8 md:py-12 space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-slate-300 dark:text-white/20" />
        </div>
        <p className="text-slate-400 dark:text-white/25 text-sm">发送消息或使用语音开始对话</p>
        <p className="text-slate-300 dark:text-white/15 text-xs">
          按 <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded text-[10px]">V</kbd> 快速开始录音
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-h-[35vh] md:max-h-[40vh] overflow-y-auto space-y-3 pr-2 chat-messages-mask custom-scrollbar">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
        >
          <div
            className={`max-w-[85%] md:max-w-[80%] px-4 md:px-5 py-2.5 md:py-3 rounded-2xl text-sm backdrop-blur-md border shadow-sm ${
              msg.role === 'user'
                ? 'bg-blue-600 border-blue-500/50 text-white rounded-br-none'
                : 'bg-white/90 dark:bg-white/10 border-slate-200 dark:border-white/10 text-slate-700 dark:text-gray-100 rounded-bl-none'
            }`}
          >
            {msg.text}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
