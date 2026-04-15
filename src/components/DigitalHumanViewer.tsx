import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  Float,
  Sparkles,
  ContactShadows,
  Html,
} from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { useDigitalHumanStore } from '../store/digitalHumanStore';
import { usePrefersReducedMotion, useIsTabVisibleRef } from '../hooks';
import { loggers } from '../lib/logger';
import { getDeviceCapabilities, type DeviceCapabilities } from '../core/performance';
import { useSystemStore } from '../store/systemStore';

const logger = loggers.app;

/** Rotate camera around Y axis at origin */
function rotateCameraHorizontal(camera: THREE.Camera, angle: number): void {
  const x = camera.position.x * Math.cos(angle) - camera.position.z * Math.sin(angle);
  const z = camera.position.x * Math.sin(angle) + camera.position.z * Math.cos(angle);
  camera.position.x = x;
  camera.position.z = z;
  camera.lookAt(0, 0, 0);
}

interface DigitalHumanViewerProps {
  modelUrl?: string;
  autoRotate?: boolean;
  showControls?: boolean;
  onModelLoad?: (model: unknown) => void;
}

// --- Keyboard Controls Component ---
function KeyboardControls() {
  const { camera } = useThree();
  const isVisibleRef = useIsTabVisibleRef();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Only process if tab is visible and not typing in an input
      if (!isVisibleRef.current) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const step = 0.1; // Rotation step in radians
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
          camera.position.y = Math.min(camera.position.y + zoomStep, 4);
          camera.lookAt(0, 0, 0);
          break;
        case 'ArrowDown':
          e.preventDefault();
          camera.position.y = Math.max(camera.position.y - zoomStep, -2);
          camera.lookAt(0, 0, 0);
          break;
        case '+':
        case '=':
          e.preventDefault();
          camera.position.multiplyScalar(0.9);
          break;
        case '-':
        case '_':
          e.preventDefault();
          camera.position.multiplyScalar(1.1);
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          camera.position.set(0, 0, 6);
          camera.lookAt(0, 0, 0);
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

// --- Performance Tracker Component ---
function PerformanceTracker() {
  const updateRenderPerformance = useSystemStore((s) => s.updateRenderPerformance);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsHistoryRef = useRef<number[]>([]);
  const isVisibleRef = useIsTabVisibleRef();

  useFrame(() => {
    if (!isVisibleRef.current) return;

    frameCountRef.current++;
    const now = performance.now();
    const elapsed = now - lastTimeRef.current;

    // Update FPS every 500ms
    if (elapsed >= 500) {
      const fps = (frameCountRef.current * 1000) / elapsed;
      const frameTime = elapsed / frameCountRef.current;

      fpsHistoryRef.current.push(fps);
      if (fpsHistoryRef.current.length > 10) {
        fpsHistoryRef.current.shift();
      }

      const avgFPS =
        fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length;

      updateRenderPerformance({
        currentFPS: Math.round(fps),
        averageFPS: Math.round(avgFPS),
        frameTimeMs: Number(frameTime.toFixed(2)),
      });

      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }
  });

  return null;
}

// --- Procedural Cyber Avatar Component ---
interface CyberAvatarProps {
  prefersReducedMotion: boolean;
  deviceCaps: DeviceCapabilities;
}

function CyberAvatar({ prefersReducedMotion, deviceCaps }: CyberAvatarProps) {
  const group = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);

  // Use refs to avoid re-renders from store subscription in useFrame
  const storeRef = useRef(useDigitalHumanStore.getState());
  const intensityRef = useRef(storeRef.current.expressionIntensity ?? 0.8);
  const isVisibleRef = useIsTabVisibleRef();

  // Subscribe to store changes and update refs without triggering re-renders
  useEffect(() => {
    const unsubscribe = useDigitalHumanStore.subscribe((state) => {
      storeRef.current = state;
      intensityRef.current = state.expressionIntensity ?? 0.8;
    });
    return unsubscribe;
  }, []);

  // Throttle frame updates on low-end devices
  const frameSkipRef = useRef(0);
  const frameSkipTarget = deviceCaps.tier === 'low' ? 2 : 1;

  useFrame((state) => {
    // Skip animation when tab is not visible
    if (!isVisibleRef.current) return;

    // Frame skipping for low-end devices
    if (deviceCaps.tier === 'low') {
      frameSkipRef.current++;
      if (frameSkipRef.current % frameSkipTarget !== 0) return;
    }

    const t = state.clock.elapsedTime;
    // Read from refs to avoid re-renders in the animation loop
    const { currentExpression, isSpeaking, currentAnimation } = storeRef.current;
    const intensity = Math.max(0, Math.min(1, intensityRef.current));

    // Early return if reduced motion and not essential animations
    if (prefersReducedMotion && currentAnimation === 'idle' && !isSpeaking) {
      return;
    }

    // Idle Floating Logic is handled by <Float>
    if (group.current) {
      // Head movement based on animation state
      const anim = currentAnimation;
      if (anim === 'nod') {
        group.current.rotation.x = Math.sin(t * 5) * 0.2;
        group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, 0, 0.1);
        group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, 0, 0.1);
      } else if (anim === 'shakeHead') {
        group.current.rotation.y = Math.sin(t * 5) * 0.3;
        group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, 0, 0.1);
        group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, 0, 0.1);
      } else if (anim === 'think') {
        group.current.rotation.z = Math.sin(t * 1.5) * 0.15;
        group.current.rotation.x = Math.sin(t * 0.8) * 0.1;
        group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, 0, 0.1);
      } else if (anim === 'speak') {
        group.current.rotation.x = Math.sin(t * 3) * 0.03;
        group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, 0, 0.1);
        group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, 0, 0.1);
      } else {
        // idle — smoothly return to neutral rotation
        group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, 0, 0.1);
        group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, 0, 0.1);
        group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, 0, 0.1);
      }
    }

    // Speaking Animation (Jaw/Head Bob)
    if (!prefersReducedMotion && isSpeaking && headRef.current) {
      headRef.current.rotation.x = Math.sin(t * 15) * 0.05;
    }

    // Expressions
    if (leftEyeRef.current?.scale && rightEyeRef.current?.scale) {
      const baseScaleY = 1;
      let targetScaleY = baseScaleY;

      // Blink Logic
      const blink = Math.sin(t * 3);
      const isBlinking = blink > 0.98 || currentExpression === 'blink';

      // Emotional Logic
      if (currentExpression === 'smile') {
        targetScaleY = 0.5;
      } else if (currentExpression === 'surprise') {
        targetScaleY = 1.3;
      }

      const scaleY = isBlinking ? 0.1 : THREE.MathUtils.lerp(baseScaleY, targetScaleY, intensity);

      leftEyeRef.current.scale.y = THREE.MathUtils.lerp(leftEyeRef.current.scale.y, scaleY, 0.2);
      rightEyeRef.current.scale.y = THREE.MathUtils.lerp(rightEyeRef.current.scale.y, scaleY, 0.2);
    }

    // Rings Animation (Enhanced for Motion) - Skip on low tier for performance
    if (
      !prefersReducedMotion &&
      ringsRef.current?.rotation &&
      deviceCaps.tier !== 'low'
    ) {
      const anim = currentAnimation;
      let ringSpeed = 0.2;
      let ringTilt = 0;
      let ringWobble = 0;

      if (anim === 'waveHand' || anim === 'wave' || anim === 'greet') {
        ringSpeed = deviceCaps.tier === 'high' ? 2.0 : 1.5;
        ringWobble = deviceCaps.tier === 'high' ? 0.5 : 0.3;
      } else if (anim === 'raiseHand') {
        ringTilt = Math.PI / 6;
        ringSpeed = 0.5;
      } else if (anim === 'excited' || anim === 'dance') {
        ringSpeed = deviceCaps.tier === 'high' ? 3.0 : 2.0;
        ringWobble = deviceCaps.tier === 'high' ? 0.3 : 0.2;
      } else if (anim === 'think') {
        ringSpeed = 0.5;
        ringTilt = Math.PI / 12;
      }

      ringsRef.current.rotation.y += ringSpeed * 0.05;
      ringsRef.current.rotation.z =
        Math.sin(t * 0.5 + ringSpeed) * 0.1 + Math.sin(t * 10) * ringWobble;
      ringsRef.current.rotation.x = THREE.MathUtils.lerp(
        ringsRef.current.rotation.x,
        ringTilt,
        0.1,
      );
    }
  });

  return (
    <group ref={group}>
      {/* Floating Container */}
      <Float
        speed={prefersReducedMotion ? 0 : 2}
        rotationIntensity={0.2}
        floatIntensity={prefersReducedMotion ? 0 : 0.5}
      >
        {/* --- HEAD --- */}
        <mesh ref={headRef} position={[0, 0, 0]} castShadow receiveShadow>
          {/* Main Head Shape - A smooth capsule/sphere hybrid */}
          <sphereGeometry args={[0.8, 64, 64]} />
          <meshPhysicalMaterial
            color="#e2e8f0"
            metalness={0.6}
            roughness={0.2}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        </mesh>

        {/* --- EYES --- */}
        <group position={[0, 0.1, 0.75]}>
          <mesh ref={leftEyeRef} position={[-0.25, 0, 0]}>
            <capsuleGeometry args={[0.08, 0.2, 4, 8]} />
            <meshStandardMaterial
              color="#0ea5e9"
              emissive="#0ea5e9"
              emissiveIntensity={2}
              toneMapped={false}
            />
          </mesh>
          <mesh ref={rightEyeRef} position={[0.25, 0, 0]}>
            <capsuleGeometry args={[0.08, 0.2, 4, 8]} />
            <meshStandardMaterial
              color="#0ea5e9"
              emissive="#0ea5e9"
              emissiveIntensity={2}
              toneMapped={false}
            />
          </mesh>
          {/* Eye Glow Spheres (Pupils) */}
          <mesh position={[-0.25, 0, 0.05]} scale={[1, 0.1, 1]}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={4} />
          </mesh>
          <mesh position={[0.25, 0, 0.05]} scale={[1, 0.1, 1]}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={4} />
          </mesh>
        </group>

        {/* --- NECK / BASE --- */}
        <mesh position={[0, -1, 0]}>
          <cylinderGeometry args={[0.3, 0.4, 0.8, 32]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* --- HOLO RINGS --- */}
        <group ref={ringsRef}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.2, 0.02, 16, 100]} />
            <meshBasicMaterial
              color="#38bdf8"
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
              wireframe
            />
          </mesh>
          <mesh rotation={[Math.PI / 2.2, 0, 0]}>
            <torusGeometry args={[1.4, 0.01, 16, 100]} />
            <meshBasicMaterial
              color="#38bdf8"
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
              wireframe
            />
          </mesh>
        </group>

        {/* --- EARS / HEADPHONES --- */}
        <mesh position={[0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.3, 32]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
        <mesh position={[-0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.3, 32]} />
          <meshStandardMaterial color="#475569" />
        </mesh>
      </Float>
    </group>
  );
}

function Scene({
  autoRotate,
  modelScene,
  deviceCaps,
}: {
  autoRotate?: boolean;
  modelScene?: THREE.Group | null;
  deviceCaps: DeviceCapabilities;
}) {
  const prefersReducedMotion =
    usePrefersReducedMotion() || deviceCaps.prefersReducedMotion;

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={45} />

      {/* Lighting */}
      <ambientLight intensity={0.5} color="#ffffff" />
      <spotLight
        position={[10, 10, 10]}
        angle={0.15}
        penumbra={1}
        intensity={2}
        castShadow={deviceCaps.enableShadows}
      />
      <pointLight position={[-10, -10, -10]} intensity={1} color="#3b82f6" />

      {/* Environment Reflections - skip on low tier */}
      {deviceCaps.tier !== 'low' && <Environment preset="city" />}

      {/* The Avatar */}
      {modelScene ? (
        <primitive object={modelScene} position={[0, -1.2, 0]} />
      ) : (
        <CyberAvatar prefersReducedMotion={prefersReducedMotion} deviceCaps={deviceCaps} />
      )}

      {/* Particles - adaptive count based on device tier */}
      <Sparkles
        count={prefersReducedMotion ? 0 : deviceCaps.particleCount}
        scale={8}
        size={2}
        speed={0.4}
        opacity={0.5}
        color="#bae6fd"
      />

      {/* Shadows - adaptive quality */}
      {deviceCaps.enableShadows && (
        <ContactShadows
          resolution={deviceCaps.maxShadowMapSize}
          scale={10}
          blur={deviceCaps.tier === 'high' ? 2 : 1}
          opacity={0.5}
          far={10}
          color="#000000"
        />
      )}

      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 2.5}
        maxPolarAngle={Math.PI / 1.8}
        enableZoom={true}
        minDistance={3}
        maxDistance={10}
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
        enableDamping={deviceCaps.tier !== 'low'}
        makeDefault
      />
      <KeyboardControls />
    </>
  );
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

  // Detect device capabilities for adaptive rendering
  const deviceCaps = useMemo(() => getDeviceCapabilities(), []);

  // Performance tracking
  const startModelLoad = useSystemStore((s) => s.startModelLoad);
  const completeModelLoad = useSystemStore((s) => s.completeModelLoad);
  const failModelLoad = useSystemStore((s) => s.failModelLoad);
  const loadStartTimeRef = useRef<number | null>(null);

  // Use ref for callback to avoid re-triggering the load effect
  const onModelLoadRef = useRef(onModelLoad);
  onModelLoadRef.current = onModelLoad;

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

  // Dispose old GLTF scene resources when modelScene is replaced
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
                // Dispose all textures attached to the material
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
