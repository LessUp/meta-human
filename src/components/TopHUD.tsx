import { Activity, Wifi, WifiOff, RefreshCw, Settings, RotateCcw } from 'lucide-react';
import { useDigitalHumanStore } from '../store/digitalHumanStore';
import { useChatSessionStore } from '../store/chatSessionStore';
import { useSystemStore, type ConnectionStatus } from '../store/systemStore';
import type { ChatTransportMode } from '../core/dialogue/chatTransport';

const TRANSPORT_LABELS: Record<Exclude<ChatTransportMode, 'auto'>, string> = {
  websocket: 'WebSocket',
  http: 'HTTP',
  sse: 'SSE',
} as const;

const CONNECTION_STATUS_TEXT: Record<ConnectionStatus, string> = {
  connected: '系统已连接',
  connecting: '系统正在连接',
  disconnected: '系统已断开连接',
  error: '系统连接错误',
};

interface TopHUDProps {
  onToggleSettings: () => void;
  onReconnect: () => void;
  onNewSession: () => void;
}

export default function TopHUD({ onToggleSettings, onReconnect, onNewSession }: TopHUDProps) {
  const connectionStatus = useSystemStore((s) => s.connectionStatus);
  const chatTransportMode = useSystemStore((s) => s.chatTransportMode);
  const chatPerformance = useSystemStore((s) => s.chatPerformance);
  const currentBehavior = useDigitalHumanStore((s) => s.currentBehavior);
  const chatHistory = useChatSessionStore((s) => s.chatHistory);

  const transportLabel = TRANSPORT_LABELS[chatTransportMode];
  const statusText = CONNECTION_STATUS_TEXT[connectionStatus];

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-4 pt-3 sm:px-6 sm:pt-6" role="banner">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="pointer-events-auto max-w-3xl rounded-2xl border border-white/10 bg-black/35 px-4 py-3 shadow-2xl shadow-black/20 backdrop-blur-md">
          <h1 className="flex flex-wrap items-center gap-3 text-lg font-light tracking-widest text-blue-100/80 uppercase sm:text-2xl">
            <Activity className="h-5 w-5 animate-pulse text-blue-400" />
            MetaHuman
            <span className="rounded border border-blue-500/30 bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300">
              CORE 1.0
            </span>
          </h1>

          <div
            className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-gray-400"
            aria-live="polite"
            aria-atomic="true"
          >
            <span className="flex items-center gap-1" title={statusText}>
              {connectionStatus === 'connected' ? (
                <>
                  <Wifi className="h-3 w-3 text-green-400" aria-hidden="true" />
                  <span className="text-green-400">在线</span>
                  <span className="sr-only">{statusText}</span>
                </>
              ) : connectionStatus === 'connecting' ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin text-yellow-400" aria-hidden="true" />
                  <span className="text-yellow-400">连接中</span>
                  <span className="sr-only">{statusText}</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 text-red-400" aria-hidden="true" />
                  <span className="text-red-400">离线</span>
                  <span className="sr-only">{statusText}</span>
                </>
              )}
            </span>
            <span>
              行为: <span className="text-blue-400">{currentBehavior}</span>
            </span>
            <span>
              会话: <span className="text-purple-400">{chatHistory.length}条</span>
            </span>
            <span>
              协议: <span className="text-cyan-400">{transportLabel}</span>
            </span>
            {chatPerformance.responseCompleteMs !== null && (
              <>
                <span>
                  首字: <span className="text-amber-400">{chatPerformance.firstTokenMs ?? '-'}ms</span>
                </span>
                <span>
                  完整: <span className="text-emerald-400">{chatPerformance.responseCompleteMs}ms</span>
                </span>
              </>
            )}
          </div>
        </div>

        <div
          className="pointer-events-auto flex flex-wrap items-center justify-end gap-2 self-end xl:self-start"
          role="toolbar"
          aria-label="系统控制"
        >
          {connectionStatus !== 'connected' && (
            <button
              onClick={onReconnect}
              className="rounded-full border border-yellow-500/30 bg-yellow-500/20 p-2.5 backdrop-blur-md transition-all hover:bg-yellow-500/30 active:scale-95 sm:p-3"
              title="重新连接"
              aria-label={connectionStatus === 'connecting' ? '正在重新连接' : '重新连接服务器'}
              disabled={connectionStatus === 'connecting'}
            >
              <RefreshCw
                className={`h-5 w-5 text-yellow-400 ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
            </button>
          )}
          <button
            onClick={onNewSession}
            className="rounded-full border border-white/10 bg-white/5 p-2.5 backdrop-blur-md transition-all hover:bg-white/10 active:scale-95 sm:p-3"
            title="开始新会话"
            aria-label="开始新会话，清除当前对话历史"
          >
            <RotateCcw className="h-5 w-5 text-white/80" aria-hidden="true" />
          </button>
          <button
            onClick={onToggleSettings}
            aria-label="打开设置面板"
            className="rounded-full border border-white/10 bg-white/5 p-2.5 backdrop-blur-md transition-all hover:bg-white/10 active:scale-95 sm:p-3"
          >
            <Settings className="h-5 w-5 text-white/80" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
