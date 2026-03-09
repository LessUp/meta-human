import React from 'react';

interface ChatContainerProps {
  children: React.ReactNode;
}

/**
 * 聊天容器组件
 * 参考 airi 的 ChatContainer，提供毛玻璃效果的容器
 */
export default function ChatContainer({ children }: ChatContainerProps) {
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
      {children}
    </div>
  );
}
