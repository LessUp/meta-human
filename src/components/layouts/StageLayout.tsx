import React from 'react';
import { Toaster } from 'sonner';
import { useTheme } from '@/hooks/useTheme';

interface StageLayoutProps {
  children: React.ReactNode;
}

/**
 * 舞台布局容器
 * 参考 airi 的 stage layout，提供全屏容器、主题感知和全局 Toast
 */
export default function StageLayout({ children }: StageLayoutProps) {
  const { isDark } = useTheme();

  return (
    <div className="relative w-screen h-screen bg-slate-100 dark:bg-black overflow-hidden font-sans text-slate-800 dark:text-white selection:bg-blue-500/30">
      <Toaster position="top-center" theme={isDark ? 'dark' : 'light'} />
      {children}
    </div>
  );
}
