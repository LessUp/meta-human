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
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 sm:px-6"
      style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      <div className="pointer-events-auto mx-auto flex w-full max-w-3xl flex-col gap-3">
        <div
          className="custom-scrollbar mask-gradient-bottom w-full max-h-[38vh] space-y-3 overflow-y-auto rounded-2xl bg-black/20 px-2 py-2 pr-3 backdrop-blur-md sm:max-h-96"
          role="log"
          aria-label="对话记录"
          aria-live="polite"
        >
          {chatHistory.length === 0 ? (
            <div className="py-8 text-center text-sm text-white/30">发送消息或使用语音开始对话...</div>
          ) : (
            chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl border px-5 py-3 text-sm shadow-xl backdrop-blur-md sm:max-w-[80%] ${
                    msg.role === 'user'
                      ? 'rounded-br-none border-blue-500/50 bg-blue-600/80 text-white'
                      : 'rounded-bl-none border-white/10 bg-white/10 text-gray-100'
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

        <div
          className={`flex items-center gap-3 rounded-2xl border bg-black/60 p-2 pl-3 shadow-2xl shadow-blue-900/20 ring-1 ring-white/5 backdrop-blur-2xl transition-colors ${isLoading ? 'border-blue-500/50' : 'border-white/10'}`}
        >
          <div
            className={`rounded-lg p-2 transition-colors ${
              isLoading
                ? 'bg-gradient-to-tr from-yellow-500 to-orange-500'
                : isSpeaking
                  ? 'bg-gradient-to-tr from-green-500 to-emerald-500'
                  : 'bg-gradient-to-tr from-blue-500 to-purple-500'
            }`}
          >
            <Radio
              className={`h-5 w-5 text-white ${isSpeaking || isLoading ? 'animate-pulse' : ''}`}
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
            className="h-10 min-w-0 flex-1 border-none bg-transparent text-sm text-white outline-none placeholder:text-white/30 disabled:cursor-not-allowed"
          />

          <div className="flex flex-shrink-0 items-center gap-2 pr-1">
            <button
              onClick={onToggleRecording}
              disabled={isLoading || isChatLoading}
              className={`rounded-xl p-3 transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${
                isRecording
                  ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
              title={isRecording ? '停止录音' : '开始录音'}
              aria-label={isRecording ? '停止录音' : '开始录音'}
              aria-pressed={isRecording}
            >
              <Mic className="h-5 w-5" />
            </button>

            <button
              onClick={() => onSend()}
              disabled={!chatInput.trim() || isChatLoading || isLoading}
              className="rounded-xl bg-white/10 p-3 text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
              title="发送消息"
              aria-label="发送消息"
            >
              {isChatLoading || isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <MessageSquare className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/20 px-4 py-2 text-sm text-red-300"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={clearError}
              aria-label="关闭错误提示"
              className="rounded p-1 hover:bg-red-500/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
