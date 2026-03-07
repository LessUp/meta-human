import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Float, Sparkles, ContactShadows, Html } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { useDigitalHumanStore } from '../store/digitalHumanStore';

// 模型缓存
const modelCache = new Map<string, THREE.Group>();

// ============================================================
// FPS 监控组件
// ============================================================
function FPSMonitor({ onFPSUpdate }: { onFPSUpdate?: (fps: number) => void }) {
  const frameTimesRef = useRef<number[]>([]);
  const lastUpdateRef = useRef<number>(0);
  const { updatePerformanceMetrics } = useDigitalHumanStore.getState();

  useFrame((state) => {
    const now = state.clock.elapsedTime * 1000;
    frameTimesRef.current.push(now);

    while (frameTimesRef.current.length > 60) {
      frameTimesRef.current.shift();
    }

    if (now - lastUpdateRef.current > 500 && frameTimesRef.current.length > 1) {
      const times = frameTimesRef.current;
      const totalTime = times[times.length - 1] - times[0];
      const fps = totalTime > 0 ? Math.round((times.length - 1) / (totalTime / 1000)) : 0;

      updatePerformanceMetrics({ fps, lastFrameTime: now });
      onFPSUpdate?.(fps);
      lastUpdateRef.current = now;
    }
  });

  return null;
}

// ============================================================
// 页面可见性优化 (修复版)
// ============================================================
function VisibilityOptimizer({
  onVisibilityChange
}: {
  autoRotate: boolean;
  onVisibilityChange?: (visible: boolean) => void;
}) {
  const { gl, invalidate } = useThree();
  const animationLoopRef = useRef<((time: number) => void) | null>(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      onVisibilityChange?.(isVisible);

      if (!isVisible) {
        // 页面隐藏：暂停渲染循环以节省资源
        gl.setAnimationLoop(null);
      } else {
        // 页面恢复：通知 R3F 需要重新渲染
        // R3F 的 invalidate 机制会自动恢复渲染循环
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

// ============================================================
// 鼠标跟踪组件 - 头部跟随鼠标
// ============================================================
function useMousePosition() {
  const mouse = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return mouse;
}

// ============================================================
// 情绪颜色映射
// ============================================================
const EMOTION_LIGHT_COLORS: Record<string, string> = {
  neutral: '#3b82f6',   // 蓝色
  happy: '#22c55e',     // 绿色
  sad: '#6366f1',       // 靛蓝
  angry: '#ef4444',     // 红色
  surprised: '#f59e0b', // 琥珀色
  excited: '#f97316',   // 橙色
};

// ============================================================
// 增强版 CyberAvatar 组件
// ============================================================
function CyberAvatar() {
  const group = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftBrowRef = useRef<THREE.Mesh>(null);
  const rightBrowRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const emotionLightRef = useRef<THREE.PointLight>(null);

  const mouse = useMousePosition();

  // 动画状态插值
  const animState = useRef({
    headRotX: 0,
    headRotY: 0,
    headRotZ: 0,
    mouthOpen: 0,
    leftEyeScaleY: 1,
    rightEyeScaleY: 1,
    leftBrowY: 0,
    rightBrowY: 0,
    leftArmRotZ: 0,
    rightArmRotZ: 0,
    bodyScale: 1,
  });

  const {
    currentExpression,
    isSpeaking,
    currentAnimation,
    currentBehavior,
    currentEmotion,
    expressionIntensity,
  } = useDigitalHumanStore();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const dt = state.clock.getDelta();
    const intensity = Math.max(0, Math.min(1, expressionIntensity ?? 1));
    const lerp = THREE.MathUtils.lerp;
    const anim = animState.current;

    // ---- 鼠标跟踪 (轻微头部跟随) ----
    let targetHeadRotY = mouse.current.x * 0.15;
    let targetHeadRotX = -mouse.current.y * 0.1;
    let targetHeadRotZ = 0;

    // ---- 行为/动画覆盖 ----
    if (currentAnimation === 'nod' || currentBehavior === 'listening') {
      targetHeadRotX = Math.sin(t * 4) * 0.15;
    } else if (currentAnimation === 'shakeHead') {
      targetHeadRotY = Math.sin(t * 5) * 0.3;
    } else if (currentBehavior === 'thinking') {
      targetHeadRotZ = Math.sin(t * 0.8) * 0.08;
      targetHeadRotY = -0.1 + Math.sin(t * 0.5) * 0.05;
      targetHeadRotX = -0.05;
    } else if (currentBehavior === 'greeting' || currentAnimation === 'wave') {
      targetHeadRotZ = Math.sin(t * 2) * 0.05;
    }

    // 平滑插值头部旋转
    anim.headRotX = lerp(anim.headRotX, targetHeadRotX, 0.08);
    anim.headRotY = lerp(anim.headRotY, targetHeadRotY, 0.08);
    anim.headRotZ = lerp(anim.headRotZ, targetHeadRotZ, 0.08);

    if (group.current) {
      group.current.rotation.x = anim.headRotX;
      group.current.rotation.y = anim.headRotY;
      group.current.rotation.z = anim.headRotZ;
    }

    // ---- 嘴巴动画 ----
    let targetMouthOpen = 0;
    if (isSpeaking) {
      // 模拟说话的嘴巴开合
      targetMouthOpen = (Math.sin(t * 12) * 0.5 + 0.5) * 0.4 +
                         (Math.sin(t * 18 + 1.2) * 0.5 + 0.5) * 0.2;
    }
    if (currentExpression === 'smile' || currentExpression === 'laugh') {
      targetMouthOpen = currentExpression === 'laugh' ? 0.5 * intensity : 0.15 * intensity;
    } else if (currentExpression === 'surprise') {
      targetMouthOpen = 0.6 * intensity;
    } else if (currentExpression === 'angry') {
      targetMouthOpen = 0.1 * intensity;
    }

    anim.mouthOpen = lerp(anim.mouthOpen, targetMouthOpen, 0.15);

    if (mouthRef.current) {
      mouthRef.current.scale.y = 0.3 + anim.mouthOpen * 2;
      mouthRef.current.scale.x = 1 + (currentExpression === 'smile' || currentExpression === 'laugh' ? 0.3 * intensity : 0);
      mouthRef.current.position.y = -0.3 - anim.mouthOpen * 0.1;
    }

    // ---- 眼睛动画 ----
    const blinkCycle = Math.sin(t * 3);
    const isBlinking = blinkCycle > 0.98 || currentExpression === 'blink';

    let targetLeftEyeY = 1;
    let targetRightEyeY = 1;

    if (currentExpression === 'smile' || currentExpression === 'laugh') {
      targetLeftEyeY = 0.4;
      targetRightEyeY = 0.4;
    } else if (currentExpression === 'surprise') {
      targetLeftEyeY = 1.4;
      targetRightEyeY = 1.4;
    } else if (currentExpression === 'sad') {
      targetLeftEyeY = 0.7;
      targetRightEyeY = 0.7;
    } else if (currentExpression === 'angry') {
      targetLeftEyeY = 0.6;
      targetRightEyeY = 0.6;
    }

    // 应用强度
    targetLeftEyeY = lerp(1, targetLeftEyeY, intensity);
    targetRightEyeY = lerp(1, targetRightEyeY, intensity);

    if (isBlinking) {
      targetLeftEyeY = 0.05;
      targetRightEyeY = 0.05;
    }

    anim.leftEyeScaleY = lerp(anim.leftEyeScaleY, targetLeftEyeY, isBlinking ? 0.5 : 0.15);
    anim.rightEyeScaleY = lerp(anim.rightEyeScaleY, targetRightEyeY, isBlinking ? 0.5 : 0.15);

    if (leftEyeRef.current) leftEyeRef.current.scale.y = anim.leftEyeScaleY;
    if (rightEyeRef.current) rightEyeRef.current.scale.y = anim.rightEyeScaleY;

    // ---- 眉毛动画 ----
    let targetLeftBrowY = 0;
    let targetRightBrowY = 0;

    if (currentExpression === 'surprise') {
      targetLeftBrowY = 0.08 * intensity;
      targetRightBrowY = 0.08 * intensity;
    } else if (currentExpression === 'angry') {
      targetLeftBrowY = -0.06 * intensity;
      targetRightBrowY = -0.06 * intensity;
    } else if (currentExpression === 'sad') {
      targetLeftBrowY = 0.04 * intensity;
      targetRightBrowY = -0.02 * intensity;
    }

    anim.leftBrowY = lerp(anim.leftBrowY, targetLeftBrowY, 0.1);
    anim.rightBrowY = lerp(anim.rightBrowY, targetRightBrowY, 0.1);

    if (leftBrowRef.current) leftBrowRef.current.position.y = 0.32 + anim.leftBrowY;
    if (rightBrowRef.current) rightBrowRef.current.position.y = 0.32 + anim.rightBrowY;

    // ---- 手臂动画 ----
    let targetLeftArmRotZ = Math.PI * 0.1;
    let targetRightArmRotZ = -Math.PI * 0.1;

    if (currentBehavior === 'greeting' || currentAnimation === 'wave' || currentAnimation === 'waveHand') {
      targetRightArmRotZ = -Math.PI * 0.7 + Math.sin(t * 6) * 0.3;
    } else if (currentAnimation === 'raiseHand') {
      targetRightArmRotZ = -Math.PI * 0.6;
    } else if (currentBehavior === 'speaking' || isSpeaking) {
      targetLeftArmRotZ = Math.PI * 0.15 + Math.sin(t * 2) * 0.05;
      targetRightArmRotZ = -Math.PI * 0.15 - Math.sin(t * 2 + 1) * 0.05;
    } else if (currentBehavior === 'excited' || currentAnimation === 'excited') {
      targetLeftArmRotZ = Math.PI * 0.5 + Math.sin(t * 8) * 0.2;
      targetRightArmRotZ = -Math.PI * 0.5 - Math.sin(t * 8 + 0.5) * 0.2;
    }

    anim.leftArmRotZ = lerp(anim.leftArmRotZ, targetLeftArmRotZ, 0.06);
    anim.rightArmRotZ = lerp(anim.rightArmRotZ, targetRightArmRotZ, 0.06);

    if (leftArmRef.current) leftArmRef.current.rotation.z = anim.leftArmRotZ;
    if (rightArmRef.current) rightArmRef.current.rotation.z = anim.rightArmRotZ;

    // ---- 身体呼吸 ----
    const breathScale = 1 + Math.sin(t * 1.5) * 0.01;
    if (bodyRef.current) {
      bodyRef.current.scale.x = breathScale;
      bodyRef.current.scale.z = breathScale;
    }

    // ---- 光环动画 ----
    if (ringsRef.current) {
      let ringSpeed = 0.2;
      let ringWobble = 0;

      if (currentAnimation === 'waveHand' || currentBehavior === 'greeting') {
        ringSpeed = 1.5;
        ringWobble = 0.3;
      } else if (currentBehavior === 'excited' || currentAnimation === 'excited') {
        ringSpeed = 3.0;
        ringWobble = 0.5;
      } else if (currentBehavior === 'thinking') {
        ringSpeed = 0.8;
      } else if (isSpeaking) {
        ringSpeed = 0.6;
      }

      ringsRef.current.rotation.y += ringSpeed * 0.02;
      ringsRef.current.rotation.z = Math.sin(t * 0.5) * 0.1 + Math.sin(t * 10) * ringWobble * 0.05;
    }

    // ---- 情绪灯光 ----
    if (emotionLightRef.current) {
      const emotionColor = EMOTION_LIGHT_COLORS[currentEmotion] || EMOTION_LIGHT_COLORS.neutral;
      const targetColor = new THREE.Color(emotionColor);
      emotionLightRef.current.color.lerp(targetColor, 0.05);
      emotionLightRef.current.intensity = lerp(emotionLightRef.current.intensity,
        isSpeaking ? 3 : (currentBehavior === 'excited' ? 4 : 2), 0.05);
    }
  });

  // 眼睛材质 (共享)
  const eyeMaterial = useMemo(() => (
    <meshStandardMaterial
      color="#0ea5e9"
      emissive="#0ea5e9"
      emissiveIntensity={2}
      toneMapped={false}
    />
  ), []);

  return (
    <group ref={group}>
      {/* 情绪氛围灯 */}
      <pointLight ref={emotionLightRef} position={[0, 0, 2]} intensity={2} color="#3b82f6" distance={8} />

      <Float speed={2} rotationIntensity={0.15} floatIntensity={0.4}>

        {/* === 头部 === */}
        <mesh ref={headRef} position={[0, 0, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.8, 64, 64]} />
          <meshPhysicalMaterial
            color="#e2e8f0"
            metalness={0.6}
            roughness={0.2}
            clearcoat={1}
            clearcoatRoughness={0.1}
            envMapIntensity={1.5}
          />
        </mesh>

        {/* === 眼睛 === */}
        <group position={[0, 0.1, 0.75]}>
          {/* 左眼 */}
          <mesh ref={leftEyeRef} position={[-0.25, 0, 0]}>
            <capsuleGeometry args={[0.08, 0.2, 4, 8]} />
            {eyeMaterial}
          </mesh>
          {/* 右眼 */}
          <mesh ref={rightEyeRef} position={[0.25, 0, 0]}>
            <capsuleGeometry args={[0.08, 0.2, 4, 8]} />
            {eyeMaterial}
          </mesh>
          {/* 瞳孔发光 */}
          <mesh position={[-0.25, 0, 0.05]} scale={[1, 0.1, 1]}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={4} toneMapped={false} />
          </mesh>
          <mesh position={[0.25, 0, 0.05]} scale={[1, 0.1, 1]}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={4} toneMapped={false} />
          </mesh>
        </group>

        {/* === 眉毛 === */}
        <group position={[0, 0.1, 0.76]}>
          <mesh ref={leftBrowRef} position={[-0.25, 0.32, 0]} rotation={[0, 0, 0.1]}>
            <boxGeometry args={[0.2, 0.03, 0.02]} />
            <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.3} />
          </mesh>
          <mesh ref={rightBrowRef} position={[0.25, 0.32, 0]} rotation={[0, 0, -0.1]}>
            <boxGeometry args={[0.2, 0.03, 0.02]} />
            <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.3} />
          </mesh>
        </group>

        {/* === 嘴巴 === */}
        <mesh ref={mouthRef} position={[0, -0.3, 0.72]}>
          <capsuleGeometry args={[0.06, 0.15, 4, 8]} />
          <meshStandardMaterial
            color="#0ea5e9"
            emissive="#0ea5e9"
            emissiveIntensity={1}
            toneMapped={false}
            transparent
            opacity={0.8}
          />
        </mesh>

        {/* === 脖子 === */}
        <mesh position={[0, -1, 0]}>
          <cylinderGeometry args={[0.3, 0.4, 0.8, 32]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* === 身体 === */}
        <mesh ref={bodyRef} position={[0, -2, 0]} castShadow>
          <capsuleGeometry args={[0.5, 1.2, 8, 16]} />
          <meshPhysicalMaterial
            color="#1e293b"
            metalness={0.7}
            roughness={0.3}
            clearcoat={0.5}
          />
        </mesh>

        {/* === 手臂 === */}
        <group ref={leftArmRef} position={[0.7, -1.5, 0]}>
          <mesh position={[0, -0.4, 0]}>
            <capsuleGeometry args={[0.1, 0.6, 4, 8]} />
            <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* 手 */}
          <mesh position={[0, -0.85, 0]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.5} roughness={0.2} />
          </mesh>
        </group>

        <group ref={rightArmRef} position={[-0.7, -1.5, 0]}>
          <mesh position={[0, -0.4, 0]}>
            <capsuleGeometry args={[0.1, 0.6, 4, 8]} />
            <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
          </mesh>
          {/* 手 */}
          <mesh position={[0, -0.85, 0]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.5} roughness={0.2} />
          </mesh>
        </group>

        {/* === 全息光环 === */}
        <group ref={ringsRef}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.2, 0.02, 16, 100]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.3} side={THREE.DoubleSide} wireframe />
          </mesh>
          <mesh rotation={[Math.PI / 2.2, 0, 0]}>
            <torusGeometry args={[1.4, 0.01, 16, 100]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.2} side={THREE.DoubleSide} wireframe />
          </mesh>
          <mesh rotation={[Math.PI / 1.9, 0, 0.3]}>
            <torusGeometry args={[1.6, 0.008, 16, 100]} />
            <meshBasicMaterial color="#818cf8" transparent opacity={0.15} side={THREE.DoubleSide} wireframe />
          </mesh>
        </group>

        {/* === 耳机 === */}
        <mesh position={[0.82, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.3, 32]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[-0.82, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.2, 0.2, 0.3, 32]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.2} />
        </mesh>
        {/* 耳机头带 */}
        <mesh position={[0, 0.75, 0]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.82, 0.03, 8, 32, Math.PI]} />
          <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.3} />
        </mesh>

      </Float>
    </group>
  );
}

// ============================================================
// 场景组件
// ============================================================
function Scene({
  autoRotate,
  modelScene,
  onFPSUpdate
}: {
  autoRotate?: boolean;
  modelScene?: THREE.Group | null;
  onFPSUpdate?: (fps: number) => void;
}) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={45} />

      <FPSMonitor onFPSUpdate={onFPSUpdate} />
      <VisibilityOptimizer autoRotate={autoRotate ?? false} />

      {/* 主光源 */}
      <ambientLight intensity={0.4} color="#e0e7ff" />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.8} castShadow shadow-mapSize={2048} />
      <pointLight position={[-10, -10, -10]} intensity={0.8} color="#3b82f6" />

      {/* Rim Light (轮廓光) */}
      <spotLight position={[-5, 5, -5]} angle={0.3} penumbra={0.5} intensity={1.2} color="#818cf8" />
      <spotLight position={[5, -3, -5]} angle={0.3} penumbra={0.5} intensity={0.8} color="#0ea5e9" />

      {/* 环境反射 */}
      <Environment preset="city" />

      {/* 模型 / 内置角色 */}
      {modelScene ? (
        <primitive object={modelScene} position={[0, -1.2, 0]} />
      ) : (
        <CyberAvatar />
      )}

      {/* 粒子效果 */}
      <Sparkles count={80} scale={8} size={2} speed={0.3} opacity={0.4} color="#bae6fd" />
      <Sparkles count={30} scale={6} size={3} speed={0.2} opacity={0.2} color="#818cf8" />

      {/* 地面阴影 */}
      <ContactShadows
        resolution={1024}
        scale={10}
        blur={2.5}
        opacity={0.6}
        far={10}
        color="#000000"
        position={[0, -3.2, 0]}
      />

      {/* 轨道控制 */}
      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.6}
        enableZoom={true}
        minDistance={3}
        maxDistance={10}
        autoRotate={autoRotate}
        autoRotateSpeed={0.5}
        enableDamping={true}
        dampingFactor={0.05}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
      />
    </>
  );
}

// ============================================================
// 主组件
// ============================================================
interface DigitalHumanViewerProps {
  modelUrl?: string;
  autoRotate?: boolean;
  showControls?: boolean;
  showFPS?: boolean;
  onModelLoad?: (model: unknown) => void;
  onFPSUpdate?: (fps: number) => void;
}

export default function DigitalHumanViewer({
  modelUrl,
  autoRotate = false,
  showControls = true,
  showFPS = false,
  onModelLoad,
  onFPSUpdate
}: DigitalHumanViewerProps) {
  const [modelScene, setModelScene] = useState<THREE.Group | null>(null);
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(modelUrl ? 'idle' : 'ready');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [currentFPS, setCurrentFPS] = useState<number>(0);

  const handleFPSUpdate = useCallback((fps: number) => {
    setCurrentFPS(fps);
    onFPSUpdate?.(fps);
  }, [onFPSUpdate]);

  useEffect(() => {
    if (!modelUrl) {
      setModelScene(null);
      setLoadStatus('ready');
      onModelLoad?.({ type: 'procedural-cyber-avatar' });
      return;
    }

    const cachedModel = modelCache.get(modelUrl);
    if (cachedModel) {
      setModelScene(cachedModel.clone());
      setLoadStatus('ready');
      onModelLoad?.({ type: 'cached-model', url: modelUrl });
      return;
    }

    let cancelled = false;
    const loader = new GLTFLoader();

    setLoadStatus('loading');
    setLoadError(null);
    setLoadProgress(0);

    loader.load(
      modelUrl,
      (gltf) => {
        if (cancelled) return;
        modelCache.set(modelUrl, gltf.scene.clone());
        setModelScene(gltf.scene);
        setLoadStatus('ready');
        setLoadProgress(100);
        onModelLoad?.(gltf.scene);
      },
      (progress) => {
        if (cancelled) return;
        if (progress.total > 0) {
          setLoadProgress(Math.round((progress.loaded / progress.total) * 100));
        }
      },
      (error) => {
        if (cancelled) return;
        console.error('模型加载失败', error);
        const message =
          error instanceof Error
            ? error.message
            : typeof error === 'object' && error && 'message' in error
              ? String((error as { message: unknown }).message)
              : '未知错误';
        setModelScene(null);
        setLoadStatus('error');
        setLoadError(message);
        onModelLoad?.({ type: 'procedural-fallback', error: message });
      }
    );

    return () => {
      cancelled = true;
    };
  }, [modelUrl, onModelLoad]);

  return (
    <div className="w-full h-full bg-transparent relative">
      {/* FPS 显示 */}
      {showFPS && (
        <div className="absolute top-2 right-2 z-10 px-2 py-1 rounded bg-black/50 text-white text-xs font-mono backdrop-blur-sm border border-white/10">
          {currentFPS} FPS
          {currentFPS < 30 && <span className="text-yellow-400 ml-1">⚠</span>}
        </div>
      )}

      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}>
        {(loadStatus === 'loading' || loadStatus === 'error') && (
          <Html center>
            {loadStatus === 'loading' ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                    style={{ width: `${loadProgress}%` }}
                  />
                </div>
                <span className="text-white/60 text-xs font-mono">{loadProgress}%</span>
              </div>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-black/70 text-white text-sm border border-white/10 shadow-lg">
                加载失败，使用内置模型
              </div>
            )}
          </Html>
        )}
        <Scene autoRotate={autoRotate} modelScene={modelScene} onFPSUpdate={handleFPSUpdate} />
      </Canvas>

      {showControls && (
        <div className="absolute bottom-4 left-4 right-4 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 space-y-3 text-white">
          <h2 className="text-lg font-semibold">数字人控制</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-white/50">模型:</span>
              <span className={loadStatus === 'ready' ? 'text-green-400' : 'text-yellow-300'}>
                {loadStatus === 'ready' ? '已加载' : loadStatus === 'loading' ? `${loadProgress}%` : '内置模型'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/50">引擎:</span>
              <span className="text-blue-300">Three.js R3F</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/50">帧率:</span>
              <span className={currentFPS >= 30 ? 'text-green-400' : 'text-yellow-400'}>
                {currentFPS} FPS
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/50">旋转:</span>
              <span className="text-white">{autoRotate ? '开启' : '关闭'}</span>
            </div>
            {loadError && (
              <div className="col-span-2 text-xs text-red-200 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                {loadError}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
