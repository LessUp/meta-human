import { useEffect, useRef } from 'react';
import { useDigitalHumanStore } from '../store/digitalHumanStore';
import { useChatSessionStore } from '../store/chatSessionStore';
import { useSystemStore } from '../store/systemStore';
import { Mic, MessageSquare, Radio, AlertCircle, X } from 'lucide-react';
import { usePrefersReducedMotion } from '../hooks';

interface ChatDockProps {
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onSend: (text?: string) => void;
  onToggleRecording: () => void;
  isChatLoading: boolean;
}

export default function ChatDock({
  chatInput,
  onChatInputChange,
  onSend,
  onToggleRecording,
  isChatLoading,
}: ChatDockProps) {
  const chatHistory = useChatSessionStore((s) => s.chatHistory);
  const isLoading = useSystemStore((s) => s.isLoading);
  const isRecording = useDigitalHumanStore((s) => s.isRecording);
  const isSpeaking = useDigitalHumanStore((s) => s.isSpeaking);
  const error = useSystemStore((s) => s.error);
  const clearError = useSystemStore((s) => s.clearError);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }, [chatHistory, prefersReducedMotion]);

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-20">
      {/* Chat Bubbles */}
      <div
        className="mb-6 w-full max-h-[40vh] overflow-y-auto space-y-3 pr-4 mask-gradient-bottom custom-scrollbar"
        role="log"
        aria-label="对话记录"
        aria-live="polite"
      >
        {chatHistory.length === 0 ? (
          <div className="text-center text-white/30 text-sm py-8">
            发送消息或使用语音开始对话...
          </div>
        ) : (
          chatHistory.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
            >
              <div
                className={`max-w-[80%] px-5 py-3 rounded-2xl text-sm backdrop-blur-md border shadow-xl ${
                  msg.role === 'user'
                    ? 'bg-blue-600/80 border-blue-500/50 text-white rounded-br-none'
                    : 'bg-white/10 border-white/10 text-gray-100 rounded-bl-none'
                }`}
                role={msg.isStreaming ? 'status' : undefined}
                aria-busy={msg.isStreaming ? 'true' : 'false'}
                aria-live={msg.isStreaming ? 'polite' : undefined}
              >
                <span className={msg.isStreaming ? 'streaming-cursor text-white/90' : ''}>
                  {msg.text || (msg.isStreaming ? '正在生成回复...' : '')}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div
        className={`bg-black/60 backdrop-blur-2xl border rounded-2xl p-2 pl-4 flex items-center gap-3 shadow-2xl shadow-blue-900/20 ring-1 ring-white/5 transition-colors ${isLoading ? 'border-blue-500/50' : 'border-white/10'}`}
      >
        <div
          className={`p-2 rounded-lg transition-colors ${
            isLoading
              ? 'bg-gradient-to-tr from-yellow-500 to-orange-500'
              : isSpeaking
                ? 'bg-gradient-to-tr from-green-500 to-emerald-500'
                : 'bg-gradient-to-tr from-blue-500 to-purple-500'
          }`}
        >
          <Radio
            className={`w-5 h-5 text-white ${isSpeaking || isLoading ? 'animate-pulse' : ''}`}
          />
        </div>

        <input
          type="text"
          value={chatInput}
          onChange={(e) => onChatInputChange(e.target.value)}
          onKeyDown={(e) =>
            e.key === 'Enter' && !e.shiftKey && !isChatLoading && !isRecording && onSend()
          }
          placeholder={
            isLoading ? '思考中...' : isRecording ? '正在聆听...' : '输入消息与数字人互动...'
          }
          disabled={isLoading || isRecording}
          aria-label="输入消息"
          className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/30 text-sm h-10 disabled:cursor-not-allowed"
        />

        <div className="flex items-center gap-2 pr-1">
          <button
            onClick={onToggleRecording}
            disabled={isLoading || isChatLoading}
            className={`p-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
              isRecording
                ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                : 'hover:bg-white/10 text-white/70 hover:text-white'
            }`}
            title={isRecording ? '停止录音' : '开始录音'}
            aria-label={isRecording ? '停止录音' : '开始录音'}
            aria-pressed={isRecording}
          >
            <Mic className="w-5 h-5" />
          </button>

          <button
            onClick={() => onSend()}
            disabled={!chatInput.trim() || isChatLoading || isLoading}
            className="p-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white transition-colors"
            title="发送消息"
            aria-label="发送消息"
          >
            {isChatLoading || isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <MessageSquare className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="mt-3 px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-xl flex items-center gap-2 text-red-300 text-sm"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={clearError}
            aria-label="关闭错误提示"
            className="p-1 hover:bg-red-500/20 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
