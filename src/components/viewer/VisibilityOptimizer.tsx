// 页面可见性优化组件 — 从 DigitalHumanViewer.enhanced.tsx 提取
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

interface VisibilityOptimizerProps {
  onVisibilityChange?: (visible: boolean) => void;
}

export default function VisibilityOptimizer({ onVisibilityChange }: VisibilityOptimizerProps) {
  const { gl, invalidate } = useThree();

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      onVisibilityChange?.(isVisible);

      if (!isVisible) {
        // 页面隐藏：暂停渲染循环以节省资源
        gl.setAnimationLoop(null);
      } else {
        // 页面恢复：通知 R3F 需要重新渲染
        invalidate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [gl, invalidate, onVisibilityChange]);

  return null;
}
