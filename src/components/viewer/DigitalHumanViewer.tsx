/**
 * 数字人 3D 查看器组件。
 *
 * 主要功能：
 * - 加载和管理 3D 模型
 * - 提供自适应渲染（根据设备能力）
 * - 暴露模型加载回调
 */

import { useEffect, useRef, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { useSystemStore } from '@/store/systemStore';
import { getDeviceCapabilities } from '@/core/performance';
import { loggers } from '@/lib/logger';
import { Scene } from './Scene';
import { PerformanceTracker } from './PerformanceTracker';
import { ImmersiveSessionBridge } from './ImmersiveSessionBridge';

const logger = loggers.app;

interface DigitalHumanViewerProps {
  modelUrl?: string;
  autoRotate?: boolean;
  showControls?: boolean;
  onModelLoad?: (model: unknown) => void;
}

export default function DigitalHumanViewer({
  modelUrl,
  autoRotate = false,
  showControls = true,
  onModelLoad,
}: DigitalHumanViewerProps) {
  const [modelScene, setModelScene] = useState<THREE.Group | null>(null);
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    modelUrl ? 'idle' : 'ready',
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  // 检测设备能力以实现自适应渲染
  const deviceCaps = useMemo(() => getDeviceCapabilities(), []);

  // 性能追踪
  const startModelLoad = useSystemStore((s) => s.startModelLoad);
  const completeModelLoad = useSystemStore((s) => s.completeModelLoad);
  const failModelLoad = useSystemStore((s) => s.failModelLoad);
  const immersiveSession = useSystemStore((s) => s.immersiveSession);
  const loadStartTimeRef = useRef<number | null>(null);

  // 使用 ref 存储回调以避免重新触发加载效果
  const onModelLoadRef = useRef(onModelLoad);
  onModelLoadRef.current = onModelLoad;

  // 模型加载逻辑
  useEffect(() => {
    if (!modelUrl) {
      setModelScene(null);
      setLoadStatus('ready');
      onModelLoadRef.current?.({ type: 'procedural-cyber-avatar' });
      return;
    }

    let cancelled = false;
    const loader = new GLTFLoader();

    setLoadStatus('loading');
    setLoadError(null);
    startModelLoad(modelUrl);
    loadStartTimeRef.current = performance.now();

    loader.load(
      modelUrl,
      (gltf) => {
        if (cancelled) return;
        const loadTime = loadStartTimeRef.current
          ? Math.round(performance.now() - loadStartTimeRef.current)
          : 0;
        setModelScene(gltf.scene);
        setLoadStatus('ready');
        completeModelLoad(loadTime);
        onModelLoadRef.current?.(gltf.scene);
      },
      undefined,
      (error) => {
        if (cancelled) return;
        logger.error('模型加载失败', error);
        const message =
          error instanceof Error
            ? error.message
            : typeof error === 'object' && error && 'message' in error
              ? String((error as { message: unknown }).message)
              : '未知错误';
        setModelScene(null);
        setLoadStatus('error');
        setLoadError(message);
        failModelLoad(message);
        onModelLoadRef.current?.({ type: 'procedural-fallback', error: message });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [modelUrl, startModelLoad, completeModelLoad, failModelLoad]);

  // 模型卸载时释放资源
  useEffect(() => {
    return () => {
      modelScene?.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          try {
            mesh.geometry.dispose();
          } catch (error) {
            logger.warn('Failed to dispose geometry:', error);
          }
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((mat) => {
            if (mat instanceof THREE.Material) {
              try {
                // 释放材质上的所有纹理
                const textureProps = [
                  'map',
                  'normalMap',
                  'roughnessMap',
                  'metalnessMap',
                  'emissiveMap',
                  'aoMap',
                  'lightMap',
                  'alphaMap',
                  'envMap',
                  'bumpMap',
                  'displacementMap',
                  'specularMap',
                  'clearcoatMap',
                  'clearcoatRoughnessMap',
                  'clearcoatNormalMap',
                  'sheenRoughnessMap',
                  'sheenColorMap',
                  'iridescenceMap',
                  'iridescenceThicknessMap',
                  'thicknessMap',
                  'transmissionMap',
                ] as const;

                textureProps.forEach((prop) => {
                  try {
                    const texture = (mat as unknown as Record<string, THREE.Texture | null>)[prop];
                    if (texture) {
                      texture.dispose();
                    }
                  } catch (error) {
                    logger.warn(`Failed to dispose texture ${prop}:`, error);
                  }
                });

                mat.dispose();
              } catch (error) {
                logger.warn('Failed to dispose material:', error);
              }
            }
          });
        }
      });
    };
  }, [modelScene]);

  return (
    <div
      className="w-full h-full bg-transparent space-y-4 focus:outline-none focus:ring-2 focus:ring-blue-500/30 rounded-lg"
      role="application"
      aria-label="3D数字人模型查看器"
      tabIndex={0}
    >
      <div className="sr-only">
        使用方向键旋转视图，加减键缩放，R键重置视角。按Tab键切换到其他控件。
      </div>
      <Canvas
        shadows={deviceCaps.enableShadows}
        dpr={deviceCaps.recommendedDPR}
        gl={{
          antialias: deviceCaps.tier !== 'low',
          powerPreference: deviceCaps.tier === 'high' ? 'high-performance' : 'default',
          alpha: true,
        }}
      >
        <ImmersiveSessionBridge session={immersiveSession} />
        {(loadStatus === 'loading' || loadStatus === 'error') && (
          <Html center>
            <div className="px-4 py-2 rounded-xl bg-black/70 text-white text-sm border border-white/10 shadow-lg">
              {loadStatus === 'loading' ? '模型加载中…' : `加载失败，使用内置模型 (${loadError})`}
            </div>
          </Html>
        )}
        <Scene autoRotate={autoRotate} modelScene={modelScene} deviceCaps={deviceCaps} />
        <PerformanceTracker />
      </Canvas>

      {showControls && (
        <div
          className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 space-y-3 text-white"
          role="complementary"
          aria-label="3D渲染状态"
        >
          <h2 className="text-lg font-semibold">数字人控制</h2>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-white/70">模型状态:</span>
              <span
                className={loadStatus === 'ready' ? 'text-green-400' : 'text-yellow-300'}
                aria-live="polite"
              >
                {loadStatus === 'ready'
                  ? '已加载'
                  : loadStatus === 'loading'
                    ? '加载中'
                    : '使用内置模型'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/70">渲染引擎:</span>
              <span className="text-blue-300">Three.js</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/70">自动旋转:</span>
              <span className="text-white" aria-live="polite">
                {autoRotate ? '开启' : '关闭'}
              </span>
            </div>
            <div className="text-xs text-white/50 border-t border-white/10 pt-2 mt-2">
              快捷键: ←→↑↓ 旋转 | +/- 缩放 | R 重置
            </div>
            {loadError && (
              <div
                className="text-xs text-red-200 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2"
                role="alert"
              >
                {loadError}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
