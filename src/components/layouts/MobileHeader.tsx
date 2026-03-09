import React from 'react';
import { Activity, Settings, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

interface MobileHeaderProps {
  onToggleSettings: () => void;
}

/**
 * 移动端顶部导航栏
 * 精简版 header，仅展示品牌和核心操作
 */
export default function MobileHeader({ onToggleSettings }: MobileHeaderProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="flex items-center justify-between px-4 py-3 z-20 pointer-events-auto">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-blue-500 dark:text-blue-400 animate-pulse" />
        <span className="text-sm font-light tracking-widest uppercase text-slate-700 dark:text-blue-100/80">
          MetaHuman
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-white/70 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 active:scale-95 transition-all"
        >
          {isDark ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
        <button
          onClick={onToggleSettings}
          className="p-2 rounded-full bg-white/70 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 active:scale-95 transition-all"
        >
          <Settings className="w-4 h-4 text-slate-600 dark:text-white/80" />
        </button>
      </div>
    </div>
  );
}
