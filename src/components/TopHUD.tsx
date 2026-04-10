import React from 'react';
import { Activity, Wifi, WifiOff, RefreshCw, Settings, RotateCcw } from 'lucide-react';
import { useDigitalHumanStore } from '../store/digitalHumanStore';
import { clearRemoteSession } from '../core/dialogue/dialogueService';
import { toast } from 'sonner';

interface TopHUDProps {
  onToggleSettings: () => void;
  onReconnect: () => void;
  onNewSession: () => void;
}

export default function TopHUD({ onToggleSettings, onReconnect, onNewSession }: TopHUDProps) {
  const connectionStatus = useDigitalHumanStore((s) => s.connectionStatus);
  const currentBehavior = useDigitalHumanStore((s) => s.currentBehavior);
  const chatHistory = useDigitalHumanStore((s) => s.chatHistory);

  return (
    <div className="absolute top-0 left-0 w-full p-3 sm:p-6 z-20 flex justify-between items-start pointer-events-none" role="banner">
      <div className="pointer-events-auto">
        <h1 className="text-lg sm:text-2xl font-light tracking-widest uppercase text-blue-100/80 flex items-center gap-3">
          <Activity className="w-5 h-5 text-blue-400 animate-pulse" />
          MetaHuman <span className="text-xs bg-blue-500/20 px-2 py-0.5 rounded text-blue-300 border border-blue-500/30">CORE 1.0</span>
        </h1>
        <div className="mt-2 flex space-x-4 text-xs text-gray-400 font-mono">
          <span className="flex items-center gap-1">
            {connectionStatus === 'connected' ? (
              <><Wifi className="w-3 h-3 text-green-400" /> <span className="text-green-400">在线</span></>
            ) : connectionStatus === 'connecting' ? (
              <><RefreshCw className="w-3 h-3 text-yellow-400 animate-spin" /> <span className="text-yellow-400">连接中</span></>
            ) : (
              <><WifiOff className="w-3 h-3 text-red-400" /> <span className="text-red-400">离线</span></>
            )}
          </span>
          <span>行为: <span className="text-blue-400">{currentBehavior}</span></span>
          <span>会话: <span className="text-purple-400">{chatHistory.length}条</span></span>
        </div>
      </div>

      <div className="pointer-events-auto flex space-x-2 sm:space-x-3">
        {connectionStatus !== 'connected' && (
          <button
            onClick={onReconnect}
            className="p-3 rounded-full bg-yellow-500/20 backdrop-blur-md border border-yellow-500/30 hover:bg-yellow-500/30 transition-all active:scale-95"
            title="重新连接"
            aria-label="重新连接"
          >
            <RefreshCw className={`w-5 h-5 text-yellow-400 ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
          </button>
        )}
        <button
          onClick={onNewSession}
          className="p-3 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all active:scale-95"
          title="新会话"
          aria-label="新会话"
        >
          <RotateCcw className="w-5 h-5 text-white/80" />
        </button>
        <button
          onClick={onToggleSettings}
          aria-label="打开设置"
          className="p-3 rounded-full bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-all active:scale-95"
        >
          <Settings className="w-5 h-5 text-white/80" />
        </button>
      </div>
    </div>
  );
}
