import React from 'react';
import { Activity, Wifi, WifiOff, RefreshCw, RotateCcw, Sun, Moon, Settings } from 'lucide-react';
import { useDigitalHumanStore } from '@/store/digitalHumanStore';
import { useTheme } from '@/hooks/useTheme';
import KeyboardShortcutsHelp from '@/components/KeyboardShortcutsHelp';
import { toast } from 'sonner';
import StatusIndicator from '@/components/widgets/StatusIndicator';

interface StageHeaderProps {
  onReconnect: () => void;
  onToggleSettings: () => void;
  showSettings: boolean;
}

/**
 * 桌面端顶部 HUD 栏
 * 参考 airi 的 Header 组件，展示品牌、状态指标和操作按钮
 */
export default function StageHeader({ onReconnect, onToggleSettings, showSettings }: StageHeaderProps) {
  const {
    connectionStatus,
    currentBehavior,
    chatHistory,
    performanceMetrics,
    initSession,
  } = useDigitalHumanStore();

  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="absolute top-0 left-0 w-full p-4 md:p-6 z-20 flex justify-between items-start pointer-events-none">
      {/* 左侧：品牌 + 状态 */}
      <div className="pointer-events-auto">
        <h1 className="text-xl md:text-2xl font-light tracking-widest uppercase text-slate-700 dark:text-blue-100/80 flex items-center gap-3">
          <Activity className="w-5 h-5 text-blue-500 dark:text-blue-400 animate-pulse" />
          <span className="hidden sm:inline">MetaHuman</span>
          <span className="sm:hidden">MH</span>
          <span className="text-xs bg-blue-500/10 dark:bg-blue-500/20 px-2 py-0.5 rounded text-blue-600 dark:text-blue-300 border border-blue-500/20 dark:border-blue-500/30">
            CORE 1.0
          </span>
        </h1>
        <StatusIndicator
          connectionStatus={connectionStatus}
          currentBehavior={currentBehavior}
          chatCount={chatHistory.length}
          fps={performanceMetrics.fps}
        />
      </div>

      {/* 右侧：操作按钮组 */}
      <div className="pointer-events-auto flex space-x-2 md:space-x-3">
        {connectionStatus !== 'connected' && (
          <HeaderButton
            onClick={onReconnect}
            title="重新连接"
            className="bg-yellow-500/20 border-yellow-500/30 hover:bg-yellow-500/30"
          >
            <RefreshCw className={`w-5 h-5 text-yellow-400 ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`} />
          </HeaderButton>
        )}
        <HeaderButton
          onClick={() => {
            initSession();
            toast.success('已开启新会话');
          }}
          title="新会话"
        >
          <RotateCcw className="w-5 h-5 text-slate-600 dark:text-white/80" />
        </HeaderButton>
        <KeyboardShortcutsHelp />
        <HeaderButton onClick={toggleTheme} title={isDark ? '切换浅色模式' : '切换深色模式'}>
          {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </HeaderButton>
        <HeaderButton onClick={onToggleSettings} title="设置">
          <Settings className="w-5 h-5 text-slate-600 dark:text-white/80" />
        </HeaderButton>
      </div>
    </div>
  );
}

/**
 * 统一的头部操作按钮样式
 */
function HeaderButton({
  onClick,
  title,
  className = '',
  children,
}: {
  onClick: () => void;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-2.5 md:p-3 rounded-full backdrop-blur-md border transition-all active:scale-95 shadow-sm dark:shadow-none ${
        className || 'bg-white/70 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}
