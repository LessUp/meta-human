import React from 'react';
import { Mic, MessageSquare, Radio } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onToggleRecording: () => void;
  isLoading: boolean;
  isSpeaking: boolean;
  isRecording: boolean;
  isChatLoading: boolean;
  disabled?: boolean;
}

/**
 * 聊天输入栏组件
 * 参考 airi 的 ChatArea 底部输入区域，集成录音和发送功能
 */
export default function ChatInput({
  value,
  onChange,
  onSend,
  onToggleRecording,
  isLoading,
  isSpeaking,
  isRecording,
  isChatLoading,
  disabled = false,
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isChatLoading && !isRecording) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div
      className={`bg-white/80 dark:bg-black/60 backdrop-blur-2xl border rounded-2xl p-1.5 md:p-2 pl-3 md:pl-4 flex items-center gap-2 md:gap-3 shadow-lg shadow-slate-200/50 dark:shadow-blue-900/20 ring-1 ring-slate-100 dark:ring-white/5 transition-colors ${
        isLoading ? 'border-blue-500/50' : 'border-slate-200 dark:border-white/10'
      }`}
    >
      {/* 状态指示灯 */}
      <div
        className={`p-1.5 md:p-2 rounded-lg transition-colors flex-shrink-0 ${
          isLoading
            ? 'bg-gradient-to-tr from-yellow-500 to-orange-500'
            : isSpeaking
              ? 'bg-gradient-to-tr from-green-500 to-emerald-500'
              : 'bg-gradient-to-tr from-blue-500 to-purple-500'
        }`}
      >
        <Radio className={`w-4 h-4 md:w-5 md:h-5 text-white ${isSpeaking || isLoading ? 'animate-pulse' : ''}`} />
      </div>

      {/* 输入框 */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          isLoading ? '思考中...' : isRecording ? '正在聆听...' : '输入消息与数字人互动...'
        }
        disabled={isLoading || isRecording || disabled}
        className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-white/30 text-sm h-9 md:h-10 min-w-0 disabled:cursor-not-allowed"
      />

      {/* 操作按钮 */}
      <div className="flex items-center gap-1.5 md:gap-2 pr-0.5 md:pr-1 flex-shrink-0">
        <button
          onClick={onToggleRecording}
          disabled={isLoading || isChatLoading}
          className={`p-2.5 md:p-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
            isRecording
              ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]'
              : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-white/70 hover:text-slate-700 dark:hover:text-white'
          }`}
          title={isRecording ? '停止录音' : '开始录音'}
        >
          <Mic className="w-4 h-4 md:w-5 md:h-5" />
        </button>

        <button
          onClick={onSend}
          disabled={!value.trim() || isChatLoading || isLoading}
          className="p-2.5 md:p-3 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-slate-600 dark:text-white transition-colors"
          title="发送消息"
        >
          {isChatLoading || isLoading ? (
            <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-slate-300 dark:border-white/30 border-t-slate-600 dark:border-t-white rounded-full animate-spin" />
          ) : (
            <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
