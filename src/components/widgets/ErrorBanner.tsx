import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorBannerProps {
  error: string | null;
  onDismiss: () => void;
}

/**
 * 错误提示横幅组件
 * 支持手动关闭，配合 useAutoError 实现自动消失
 */
export default function ErrorBanner({ error, onDismiss }: ErrorBannerProps) {
  if (!error) return null;

  return (
    <div className="mt-3 px-4 py-2 bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-300 text-sm animate-fade-in-up">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{error}</span>
      <button onClick={onDismiss} className="p-1 hover:bg-red-500/20 rounded transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
