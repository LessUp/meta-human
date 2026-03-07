import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { ring: 'w-6 h-6', dot: 'w-1.5 h-1.5', text: 'text-xs' },
  md: { ring: 'w-10 h-10', dot: 'w-2 h-2', text: 'text-sm' },
  lg: { ring: 'w-16 h-16', dot: 'w-2.5 h-2.5', text: 'text-base' },
};

export default function LoadingSpinner({
  size = 'md',
  text,
  fullScreen = false,
  className = ''
}: LoadingSpinnerProps) {
  const cfg = sizeConfig[size];

  const content = (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      {/* 多层旋转环 */}
      <div className="relative">
        <div className={`${cfg.ring} rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin`} />
        <div className={`absolute inset-0 ${cfg.ring} rounded-full border-2 border-purple-500/10 border-b-purple-500/60 animate-spin`} style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        {/* 中心脉冲点 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${cfg.dot} rounded-full bg-blue-400 animate-pulse`} />
        </div>
      </div>
      {text && (
        <span className={`${cfg.text} text-white/50 font-light tracking-wide`}>{text}</span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-6">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
