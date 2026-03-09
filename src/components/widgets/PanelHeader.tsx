// PanelHeader — 面板通用头部（标题 + 状态指示）
// 从各面板组件中提取的重复模式
import React from 'react';

interface PanelHeaderProps {
  title: string;
  children?: React.ReactNode;
}

export default function PanelHeader({ title, children }: PanelHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
      <h3 className="text-lg font-medium text-slate-800 dark:text-white">{title}</h3>
      {children}
    </div>
  );
}
