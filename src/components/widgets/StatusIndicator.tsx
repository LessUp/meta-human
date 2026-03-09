import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface StatusIndicatorProps {
  connectionStatus: string;
  currentBehavior: string;
  chatCount: number;
  fps: number;
  isPageActive?: boolean;
}

/**
 * 状态指标组件
 * 显示连接状态、当前行为、会话数和 FPS
 */
export default function StatusIndicator({
  connectionStatus,
  currentBehavior,
  chatCount,
  fps,
  isPageActive = true,
}: StatusIndicatorProps) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-gray-400 font-mono">
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
      <span className="hidden sm:inline">会话: <span className="text-purple-400">{chatCount}条</span></span>
      <span>FPS: <span className={fps >= 30 ? 'text-green-400' : 'text-yellow-400'}>{fps}</span></span>
      {!isPageActive && <span className="text-yellow-400">⏸ 已暂停</span>}
    </div>
  );
}
