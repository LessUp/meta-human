import React from 'react';
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
    <div
      className="absolute top-0 left-0 w-full p-3 sm:p-6 z-20 flex justify-between items-start pointer-events-none"
      role="banner"
    >
      <div className="pointer-events-auto">
        <h1 className="text-lg sm:text-2xl font-light tracking-widest uppercase text-blue-100/80 flex items-center gap-3">
          <Activity className="w-5 h-5 text-blue-400 animate-pulse" />
          MetaHuman{' '}
          <span className="text-xs bg-blue-500/20 px-2 py-0.5 rounded text-blue-300 border border-blue-500/30">
            CORE 1.0
          </span>
        </h1>
        <div
          className="mt-2 flex space-x-4 text-xs text-gray-400 font-mono"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="flex items-center gap-1" title={statusText}>
            {connectionStatus === 'connected' ? (
              <>
                <Wifi className="w-3 h-3 text-green-400" aria-hidden="true" />{' '}
                <span className="text-green-400">在线</span>
                <span className="sr-only">{statusText}</span>
              </>
            ) : connectionStatus === 'connecting' ? (
              <>
                <RefreshCw className="w-3 h-3 text-yellow-400 animate-spin" aria-hidden="true" />{' '}
                <span className="text-yellow-400">连接中</span>
                <span className="sr-only">{statusText}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-red-400" aria-hidden="true" />{' '}
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
                首字:{' '}
                <span className="text-amber-400">{chatPerformance.firstTokenMs ?? '-'}ms</span>
              </span>
              <span>
                完整:{' '}
                <span className="text-emerald-400">{chatPerformance.responseCompleteMs}ms</span>
              </span>
            </>
          )}
        </div>
      </div>

      <div className="pointer-events-auto flex space-x-2 sm:space-x-3" role="toolbar" aria-label="系统控制">
        {connectionStatus !== 'connected' && (
          <button
            onClick={onReconnect}
            className="p-3 rounded-full bg-yellow-500/20 backdrop-blur-md border border-yellow-500/30 hover:bg-yellow-500/30 transition-all active:scale-95"
            title="重新连接"
            aria-label={connectionStatus === 'connecting' ? '正在重新连接' : '重新连接服务器'}
            disabled={connectionStatus === 'connecting'}
          >
            <RefreshCw
              className={`w-5 h-5 text-yellow-400 ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
          </button>
        )}
        <button
          onClick={onNewSession}
          className="p-3 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all active:scale-95"
          title="开始新会话"
          aria-label="开始新会话，清除当前对话历史"
        >
          <RotateCcw className="w-5 h-5 text-white/80" aria-hidden="true" />
        </button>
        <button
          onClick={onToggleSettings}
          aria-label="打开设置面板"
          className="p-3 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all active:scale-95"
        >
          <Settings className="w-5 h-5 text-white/80" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
