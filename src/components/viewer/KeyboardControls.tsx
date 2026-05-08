/**
 * 键盘控制组件。
 *
 * 处理方向键旋转、缩放、重置等键盘交互。
 */

import { useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import {
  rotateCameraHorizontal,
  resetCameraPosition,
  moveCameraVertical,
  zoomCamera,
} from './utils/cameraControls';
import { useIsTabVisibleRef } from '@/hooks';

interface KeyboardControlsProps {
  onCommand?: (cmd: string) => void;
}

export function KeyboardControls(_props: KeyboardControlsProps) {
  const { camera } = useThree();
  const isVisibleRef = useIsTabVisibleRef();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // 只在标签页可见且不在输入框时处理
      if (!isVisibleRef.current) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const step = 0.1; // 旋转步长（弧度）
      const zoomStep = 0.5;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          rotateCameraHorizontal(camera, step);
          break;
        case 'ArrowRight':
          e.preventDefault();
          rotateCameraHorizontal(camera, -step);
          break;
        case 'ArrowUp':
          e.preventDefault();
          moveCameraVertical(camera, zoomStep);
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveCameraVertical(camera, -zoomStep);
          break;
        case '+':
        case '=':
          e.preventDefault();
          zoomCamera(camera, 0.9);
          break;
        case '-':
        case '_':
          e.preventDefault();
          zoomCamera(camera, 1.1);
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          resetCameraPosition(camera);
          break;
      }
    },
    [camera, isVisibleRef],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return null;
}
