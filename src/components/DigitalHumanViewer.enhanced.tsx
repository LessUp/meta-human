import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Float, Sparkles, ContactShadows, Html } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { useDigitalHumanStore } from '../store/digitalHumanStore';
import VRMAvatar from './VRMAvatar';

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
  const headGroupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftBrowRef = useRef<THREE.Mesh>(null);
  const rightBrowRef = useRef<THREE.Mesh>(null);
  const leftIrisRef = useRef<THREE.Mesh>(null);
  const rightIrisRef = useRef<THREE.Mesh>(null);
  const leftPupilRef = useRef<THREE.Mesh>(null);
  const rightPupilRef = useRef<THREE.Mesh>(null);
  const leftHighlightRef = useRef<THREE.Mesh>(null);
  const rightHighlightRef = useRef<THREE.Mesh>(null);
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
    bodyRotX: 0,
    bodyRotZ: 0,
    bodyPosY: 0,
    mouthOpen: 0,
    leftEyeScaleY: 1,
    rightEyeScaleY: 1,
    leftBrowY: 0,
    rightBrowY: 0,
    leftBrowRotZ: 0.08,
    rightBrowRotZ: -0.08,
    leftArmRotZ: 0,
    rightArmRotZ: 0,
    leftArmRotX: 0,
    rightArmRotX: 0,
    bodyScale: 1,
    eyeLookX: 0,
    eyeLookY: 0,
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
    const intensity = Math.max(0, Math.min(1, expressionIntensity ?? 1));
    const lerp = THREE.MathUtils.lerp;
    const clamp = THREE.MathUtils.clamp;
    const anim = animState.current;

    // ---- 目标值初始化 ----
    let targetHeadRotY = mouse.current.x * 0.15;
    let targetHeadRotX = -mouse.current.y * 0.1;
    let targetHeadRotZ = 0;
    let targetBodyRotX = 0;
    let targetBodyRotZ = 0;
    let targetBodyPosY = 0;
    let targetLeftBrowRotZ = 0.08;
    let targetRightBrowRotZ = -0.08;

    const isAnim = (name: string) => currentAnimation === name || currentBehavior === name;

    // ---- 行为/动画覆盖（头部 + 身体联动） ----
    if (isAnim('nod') || currentBehavior === 'listening') {
      targetHeadRotX = Math.sin(t * 3.5) * 0.18;
      targetBodyRotX = Math.sin(t * 3.5) * 0.03;
    } else if (isAnim('shakeHead')) {
      targetHeadRotY = Math.sin(t * 5) * 0.35;
      targetBodyRotZ = Math.sin(t * 5) * 0.02;
    } else if (currentBehavior === 'thinking') {
      targetHeadRotZ = Math.sin(t * 0.8) * 0.12;
      targetHeadRotY = -0.15 + Math.sin(t * 0.5) * 0.08;
      targetHeadRotX = 0.05;
      targetBodyRotZ = Math.sin(t * 0.8) * 0.02;
    } else if (currentBehavior === 'greeting' || isAnim('wave') || isAnim('waveHand')) {
      // 打招呼：头微侧+微笑方向看，身体轻微侧倾
      targetHeadRotZ = Math.sin(t * 2.5) * 0.1;
      targetHeadRotY = 0.1 + Math.sin(t * 3) * 0.05;
      targetHeadRotX = 0.05;
      targetBodyRotZ = -0.03;
      targetBodyPosY = Math.sin(t * 3) * 0.02;
    } else if (isAnim('bow')) {
      // 鞠躬：头和身体都前倾
      targetHeadRotX = -0.25;
      targetBodyRotX = -0.2 + Math.sin(t * 1.2) * 0.02;
    } else if (isAnim('headTilt')) {
      targetHeadRotZ = 0.3 + Math.sin(t * 1.5) * 0.06;
      targetHeadRotY = 0.12;
      targetHeadRotX = 0.05;
    } else if (isAnim('lookAround')) {
      targetHeadRotY = Math.sin(t * 1.2) * 0.55;
      targetHeadRotX = Math.sin(t * 2) * 0.1;
      targetBodyRotZ = Math.sin(t * 1.2) * 0.03;
    } else if (isAnim('sleep')) {
      targetHeadRotX = -0.35 + Math.sin(t * 0.4) * 0.03;
      targetHeadRotZ = 0.2 + Math.sin(t * 0.6) * 0.03;
      targetBodyRotX = -0.08;
    } else if (isAnim('shrug')) {
      targetHeadRotZ = Math.sin(t * 2.5) * 0.12;
      targetHeadRotY = Math.sin(t * 1.8) * 0.05;
      targetBodyPosY = 0.05;
    } else if (isAnim('cheer')) {
      // 欢呼：仰头+身体上下弹跳
      targetHeadRotX = 0.2;
      targetHeadRotZ = Math.sin(t * 7) * 0.1;
      targetBodyPosY = Math.abs(Math.sin(t * 5)) * 0.12;
      targetBodyRotZ = Math.sin(t * 7) * 0.03;
    } else if (isAnim('point')) {
      targetHeadRotY = 0.25;
      targetHeadRotX = -0.05;
      targetBodyRotZ = -0.04;
    } else if (isAnim('clap')) {
      targetHeadRotX = 0.08;
      targetBodyPosY = Math.abs(Math.sin(t * 4)) * 0.03;
    } else if (isAnim('thumbsUp')) {
      targetHeadRotZ = -0.08;
      targetHeadRotY = 0.1;
    } else if (isAnim('crossArms')) {
      targetHeadRotX = 0.05;
      targetBodyRotX = 0.02;
    } else if (isAnim('excited') || currentBehavior === 'excited') {
      targetBodyPosY = Math.abs(Math.sin(t * 6)) * 0.15;
      targetHeadRotZ = Math.sin(t * 8) * 0.08;
    } else if (currentBehavior === 'speaking' || isSpeaking) {
      targetHeadRotY = mouse.current.x * 0.1 + Math.sin(t * 1.5) * 0.05;
      targetHeadRotX = -mouse.current.y * 0.05 + Math.sin(t * 2) * 0.03;
      targetBodyRotZ = Math.sin(t * 1.5) * 0.01;
    }

    // 平滑插值 — 头部
    const headLerp = 0.1;
    anim.headRotX = lerp(anim.headRotX, targetHeadRotX, headLerp);
    anim.headRotY = lerp(anim.headRotY, targetHeadRotY, headLerp);
    anim.headRotZ = lerp(anim.headRotZ, targetHeadRotZ, headLerp);

    // 平滑插值 — 身体
    const bodyLerp = 0.06;
    anim.bodyRotX = lerp(anim.bodyRotX, targetBodyRotX, bodyLerp);
    anim.bodyRotZ = lerp(anim.bodyRotZ, targetBodyRotZ, bodyLerp);
    anim.bodyPosY = lerp(anim.bodyPosY, targetBodyPosY, 0.12);

    // 应用头部旋转（仅头部组）
    if (headGroupRef.current) {
      headGroupRef.current.rotation.x = anim.headRotX;
      headGroupRef.current.rotation.y = anim.headRotY;
      headGroupRef.current.rotation.z = anim.headRotZ;
    }

    // 应用身体整体倾斜和位移
    if (group.current) {
      group.current.rotation.x = anim.bodyRotX;
      group.current.rotation.z = anim.bodyRotZ;
      group.current.position.y = anim.bodyPosY;
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

    const targetEyeLookX = clamp(mouse.current.x * 0.05 + Math.sin(t * 1.7) * 0.01, -0.06, 0.06);
    const targetEyeLookY = clamp(mouse.current.y * 0.035 + Math.sin(t * 1.3) * 0.008, -0.045, 0.045);
    anim.eyeLookX = lerp(anim.eyeLookX, targetEyeLookX, 0.12);
    anim.eyeLookY = lerp(anim.eyeLookY, targetEyeLookY, 0.12);

    if (leftIrisRef.current) {
      leftIrisRef.current.position.x = -0.24 + anim.eyeLookX;
      leftIrisRef.current.position.y = anim.eyeLookY;
    }
    if (rightIrisRef.current) {
      rightIrisRef.current.position.x = 0.24 + anim.eyeLookX;
      rightIrisRef.current.position.y = anim.eyeLookY;
    }
    if (leftPupilRef.current) {
      leftPupilRef.current.position.x = -0.24 + anim.eyeLookX;
      leftPupilRef.current.position.y = anim.eyeLookY;
    }
    if (rightPupilRef.current) {
      rightPupilRef.current.position.x = 0.24 + anim.eyeLookX;
      rightPupilRef.current.position.y = anim.eyeLookY;
    }
    if (leftHighlightRef.current) {
      leftHighlightRef.current.position.x = -0.22 + anim.eyeLookX * 0.8;
      leftHighlightRef.current.position.y = 0.02 + anim.eyeLookY * 0.8;
    }
    if (rightHighlightRef.current) {
      rightHighlightRef.current.position.x = 0.26 + anim.eyeLookX * 0.8;
      rightHighlightRef.current.position.y = 0.02 + anim.eyeLookY * 0.8;
    }

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

    // ---- 眉毛表情联动 ----
    if (isAnim('cheer') || isAnim('thumbsUp')) {
      targetLeftBrowY = 0.06;
      targetRightBrowY = 0.06;
    } else if (isAnim('sleep')) {
      targetLeftBrowY = -0.04;
      targetRightBrowY = -0.04;
    } else if (isAnim('headTilt')) {
      targetLeftBrowY = 0.05;
      targetRightBrowRotZ = -0.2;
    }

    anim.leftBrowRotZ = lerp(anim.leftBrowRotZ, targetLeftBrowRotZ, 0.1);
    anim.rightBrowRotZ = lerp(anim.rightBrowRotZ, targetRightBrowRotZ, 0.1);
    if (leftBrowRef.current) leftBrowRef.current.rotation.z = anim.leftBrowRotZ;
    if (rightBrowRef.current) rightBrowRef.current.rotation.z = anim.rightBrowRotZ;

    // ---- 手臂动画（Z轴侧展 + X轴前后摆） ----
    let targetLeftArmRotZ = Math.PI * 0.1;
    let targetRightArmRotZ = -Math.PI * 0.1;
    let targetLeftArmRotX = 0;
    let targetRightArmRotX = 0;
    const armLerp = 0.08;

    if (currentBehavior === 'greeting' || isAnim('wave') || isAnim('waveHand')) {
      // 打招呼：右手高举左右摇摆，左手微动
      targetRightArmRotZ = -Math.PI * 0.78 + Math.sin(t * 5) * 0.25;
      targetRightArmRotX = Math.sin(t * 5) * 0.15;
      targetLeftArmRotZ = Math.PI * 0.12 + Math.sin(t * 2) * 0.03;
    } else if (isAnim('raiseHand')) {
      targetRightArmRotZ = -Math.PI * 0.65;
    } else if (currentBehavior === 'speaking' || isSpeaking) {
      // 说话：双手小幅度自然手势
      targetLeftArmRotZ = Math.PI * 0.18 + Math.sin(t * 2.5) * 0.06;
      targetRightArmRotZ = -Math.PI * 0.18 - Math.sin(t * 2.5 + 1.2) * 0.06;
      targetLeftArmRotX = Math.sin(t * 3) * 0.08;
      targetRightArmRotX = Math.sin(t * 3 + 1) * 0.08;
    } else if (isAnim('excited') || currentBehavior === 'excited') {
      targetLeftArmRotZ = Math.PI * 0.55 + Math.sin(t * 7) * 0.2;
      targetRightArmRotZ = -Math.PI * 0.55 - Math.sin(t * 7 + 0.5) * 0.2;
      targetLeftArmRotX = Math.sin(t * 8) * 0.15;
      targetRightArmRotX = Math.sin(t * 8 + 0.3) * 0.15;
    } else if (isAnim('bow')) {
      // 鞠躬：双手贴身
      targetLeftArmRotZ = Math.PI * 0.03;
      targetRightArmRotZ = -Math.PI * 0.03;
      targetLeftArmRotX = -0.15;
      targetRightArmRotX = -0.15;
    } else if (isAnim('clap')) {
      // 拍手：双手在身前合拢/分开
      const clapPhase = Math.sin(t * 10);
      targetLeftArmRotZ = Math.PI * 0.3 + clapPhase * 0.12;
      targetRightArmRotZ = -Math.PI * 0.3 - clapPhase * 0.12;
      targetLeftArmRotX = -0.5 + clapPhase * 0.08;
      targetRightArmRotX = -0.5 + clapPhase * 0.08;
    } else if (isAnim('thumbsUp')) {
      // 点赞：右手高举前伸
      targetRightArmRotZ = -Math.PI * 0.6;
      targetRightArmRotX = -0.3;
      targetLeftArmRotZ = Math.PI * 0.1;
    } else if (isAnim('shrug')) {
      // 耸肩：双手展开上抬
      targetLeftArmRotZ = Math.PI * 0.4 + Math.sin(t * 2) * 0.04;
      targetRightArmRotZ = -Math.PI * 0.4 - Math.sin(t * 2) * 0.04;
      targetLeftArmRotX = -0.2;
      targetRightArmRotX = -0.2;
    } else if (isAnim('cheer')) {
      // 欢呼：双手高举挥动
      targetLeftArmRotZ = Math.PI * 0.8 + Math.sin(t * 5) * 0.12;
      targetRightArmRotZ = -Math.PI * 0.8 - Math.sin(t * 5 + 0.4) * 0.12;
      targetLeftArmRotX = Math.sin(t * 6) * 0.15;
      targetRightArmRotX = Math.sin(t * 6 + 0.5) * 0.15;
    } else if (isAnim('sleep')) {
      targetLeftArmRotZ = Math.PI * 0.04;
      targetRightArmRotZ = -Math.PI * 0.04;
    } else if (isAnim('crossArms')) {
      // 抱臂：双手交叉在胸前
      targetLeftArmRotZ = Math.PI * 0.3;
      targetRightArmRotZ = -Math.PI * 0.3;
      targetLeftArmRotX = -0.4;
      targetRightArmRotX = -0.4;
    } else if (isAnim('point')) {
      // 指向：右手前伸指向
      targetRightArmRotZ = -Math.PI * 0.45;
      targetRightArmRotX = -0.55;
      targetLeftArmRotZ = Math.PI * 0.1;
    } else if (isAnim('lookAround')) {
      targetLeftArmRotZ = Math.PI * 0.12;
      targetRightArmRotZ = -Math.PI * 0.12;
    } else if (isAnim('dance')) {
      // 跳舞：节奏性双臂摆动+弹跳
      targetLeftArmRotZ = Math.PI * 0.4 + Math.sin(t * 4) * 0.3;
      targetRightArmRotZ = -Math.PI * 0.4 - Math.sin(t * 4 + Math.PI) * 0.3;
      targetLeftArmRotX = Math.sin(t * 4) * 0.2;
      targetRightArmRotX = Math.sin(t * 4 + Math.PI) * 0.2;
      targetBodyPosY = Math.abs(Math.sin(t * 4)) * 0.1;
      targetBodyRotZ = Math.sin(t * 4) * 0.04;
    }

    anim.leftArmRotZ = lerp(anim.leftArmRotZ, targetLeftArmRotZ, armLerp);
    anim.rightArmRotZ = lerp(anim.rightArmRotZ, targetRightArmRotZ, armLerp);
    anim.leftArmRotX = lerp(anim.leftArmRotX, targetLeftArmRotX, armLerp);
    anim.rightArmRotX = lerp(anim.rightArmRotX, targetRightArmRotX, armLerp);

    if (leftArmRef.current) {
      leftArmRef.current.rotation.z = anim.leftArmRotZ;
      leftArmRef.current.rotation.x = anim.leftArmRotX;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.z = anim.rightArmRotZ;
      rightArmRef.current.rotation.x = anim.rightArmRotX;
    }

    // 重新计算身体位移（dance 等需要在手臂阶段更新）
    anim.bodyPosY = lerp(anim.bodyPosY, targetBodyPosY, 0.12);
    anim.bodyRotZ = lerp(anim.bodyRotZ, targetBodyRotZ, bodyLerp);
    if (group.current) {
      group.current.position.y = anim.bodyPosY;
      group.current.rotation.z = anim.bodyRotZ;
    }

    // ---- 身体呼吸 ----
    const breathScale = 1 + Math.sin(t * 1.5) * 0.015;
    if (bodyRef.current) {
      bodyRef.current.scale.x = breathScale;
      bodyRef.current.scale.z = breathScale;
    }

    // ---- 光环动画 ----
    if (ringsRef.current) {
      let ringSpeed = 0.2;
      let ringWobble = 0;

      if (isAnim('wave') || isAnim('waveHand') || currentBehavior === 'greeting') {
        ringSpeed = 1.5;
        ringWobble = 0.3;
      } else if (isAnim('excited') || currentBehavior === 'excited') {
        ringSpeed = 3.0;
        ringWobble = 0.5;
      } else if (isAnim('cheer')) {
        ringSpeed = 2.5;
        ringWobble = 0.4;
      } else if (isAnim('dance')) {
        ringSpeed = 2.0;
        ringWobble = 0.3;
      } else if (isAnim('clap')) {
        ringSpeed = 1.8;
        ringWobble = 0.2;
      } else if (isAnim('thumbsUp') || isAnim('point')) {
        ringSpeed = 1.0;
      } else if (isAnim('bow')) {
        ringSpeed = 0.4;
      } else if (isAnim('sleep')) {
        ringSpeed = 0.1;
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

      let targetLightIntensity = 2;
      if (isSpeaking) targetLightIntensity = 3;
      if (isAnim('excited') || isAnim('cheer') || isAnim('dance')) targetLightIntensity = 4;
      if (isAnim('sleep')) targetLightIntensity = 0.8;
      if (isAnim('bow')) targetLightIntensity = 1.5;

      emotionLightRef.current.intensity = lerp(emotionLightRef.current.intensity, targetLightIntensity, 0.05);
    }
  });

  // 共享材质
  const skinMat = useMemo(() => (
    <meshPhysicalMaterial color="#e8edf5" metalness={0.25} roughness={0.18} clearcoat={1} clearcoatRoughness={0.05} envMapIntensity={2.8} />
  ), []);
  const armorMat = useMemo(() => (
    <meshPhysicalMaterial color="#151f2e" metalness={0.95} roughness={0.08} clearcoat={1} clearcoatRoughness={0.025} envMapIntensity={2.3} />
  ), []);
  const frameMat = useMemo(() => (
    <meshStandardMaterial color="#3f5266" metalness={0.8} roughness={0.18} />
  ), []);
  const glowCyan = useMemo(() => (
    <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={3.2} toneMapped={false} />
  ), []);

  return (
    <group ref={group}>
      <pointLight ref={emotionLightRef} position={[0, 0, 2.5]} intensity={2} color="#3b82f6" distance={8} />

      <Float speed={2} rotationIntensity={0.12} floatIntensity={0.35}>

        {/* ========== 头部组（独立旋转） ========== */}
        <group ref={headGroupRef}>
          {/* 颅骨主体 — 单一光滑椭球 */}
          <mesh ref={headRef} position={[0, 0, 0]} castShadow receiveShadow>
            <sphereGeometry args={[0.82, 64, 64]} />
            {skinMat}
          </mesh>
          {/* 下颌过渡（微妙融合，不突兀） */}
          <mesh position={[0, -0.32, 0.12]} castShadow scale={[0.92, 0.7, 0.88]}>
            <sphereGeometry args={[0.62, 32, 32]} />
            {skinMat}
          </mesh>
          {/* 额头装饰弧线 */}
          <mesh position={[0, 0.58, 0.52]} rotation={[0.3, 0, 0]}>
            <boxGeometry args={[0.55, 0.018, 0.018]} />
            {glowCyan}
          </mesh>
          <mesh position={[0, 0.52, 0.58]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.3, 0.012, 0.012]} />
            {glowCyan}
          </mesh>

          {/* 鼻梁（微妙弧形，不突兀） */}
          <mesh position={[0, -0.1, 0.8]} scale={[0.7, 1, 0.5]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            {skinMat}
          </mesh>

        {/* ========== 眼睛（多层结构） ========== */}
        <group position={[0, 0.08, 0.68]}>
          {/* 眼眶凹陷（柔和渐变，不阴暗） */}
          <mesh position={[-0.24, 0, 0.06]} scale={[1.3, 1, 0.45]}>
            <sphereGeometry args={[0.13, 16, 16]} />
            <meshStandardMaterial color="#2a3444" metalness={0.4} roughness={0.4} />
          </mesh>
          <mesh position={[0.24, 0, 0.06]} scale={[1.3, 1, 0.45]}>
            <sphereGeometry args={[0.13, 16, 16]} />
            <meshStandardMaterial color="#2a3444" metalness={0.4} roughness={0.4} />
          </mesh>
          {/* 巩膜（白眼球） */}
          <mesh ref={leftEyeRef} position={[-0.24, 0, 0.08]} scale={[1.2, 1, 0.6]}>
            <sphereGeometry args={[0.1, 24, 24]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.1} roughness={0.3} />
          </mesh>
          <mesh ref={rightEyeRef} position={[0.24, 0, 0.08]} scale={[1.2, 1, 0.6]}>
            <sphereGeometry args={[0.1, 24, 24]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.1} roughness={0.3} />
          </mesh>
          {/* 虹膜 */}
          <mesh ref={leftIrisRef} position={[-0.24, 0, 0.12]} scale={[1, 1, 0.3]}>
            <sphereGeometry args={[0.065, 24, 24]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2} toneMapped={false} />
          </mesh>
          <mesh ref={rightIrisRef} position={[0.24, 0, 0.12]} scale={[1, 1, 0.3]}>
            <sphereGeometry args={[0.065, 24, 24]} />
            <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={2} toneMapped={false} />
          </mesh>
          {/* 瞳孔 */}
          <mesh ref={leftPupilRef} position={[-0.24, 0, 0.14]} scale={[1, 1, 0.2]}>
            <sphereGeometry args={[0.035, 16, 16]} />
            <meshStandardMaterial color="#0284c7" emissive="#22d3ee" emissiveIntensity={5} toneMapped={false} />
          </mesh>
          <mesh ref={rightPupilRef} position={[0.24, 0, 0.14]} scale={[1, 1, 0.2]}>
            <sphereGeometry args={[0.035, 16, 16]} />
            <meshStandardMaterial color="#0284c7" emissive="#22d3ee" emissiveIntensity={5} toneMapped={false} />
          </mesh>
          {/* 高光点 */}
          <mesh ref={leftHighlightRef} position={[-0.22, 0.02, 0.15]}>
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh ref={rightHighlightRef} position={[0.26, 0.02, 0.15]}>
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>

        {/* ========== 眉毛 ========== */}
        <group position={[0, 0.08, 0.72]}>
          <mesh ref={leftBrowRef} position={[-0.24, 0.3, 0]} rotation={[0, 0, 0.08]}>
            <boxGeometry args={[0.22, 0.035, 0.04]} />
            {frameMat}
          </mesh>
          <mesh ref={rightBrowRef} position={[0.24, 0.3, 0]} rotation={[0, 0, -0.08]}>
            <boxGeometry args={[0.22, 0.035, 0.04]} />
            {frameMat}
          </mesh>
        </group>

        {/* ========== 嘴巴 ========== */}
        <mesh ref={mouthRef} position={[0, -0.38, 0.68]}>
          <capsuleGeometry args={[0.04, 0.18, 8, 16]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.2} toneMapped={false} transparent opacity={0.75} />
        </mesh>

        {/* ========== 耳机（跟随头部旋转） ========== */}
        {/* 耳罩 */}
        <mesh position={[0.82, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.18, 0.2, 0.2, 32]} />
          {armorMat}
        </mesh>
        <mesh position={[0.92, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.04, 32]} />
          {glowCyan}
        </mesh>
        <mesh position={[-0.82, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.18, 0.2, 0.2, 32]} />
          {armorMat}
        </mesh>
        <mesh position={[-0.92, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.04, 32]} />
          {glowCyan}
        </mesh>
        {/* 头带 */}
        <mesh position={[0, 0.73, 0]}>
          <torusGeometry args={[0.82, 0.025, 8, 32, Math.PI]} />
          {armorMat}
        </mesh>
        {/* 麦克风支臂 */}
        <mesh position={[0.75, -0.12, 0.2]} rotation={[0.3, 0.5, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.4, 8]} />
          {frameMat}
        </mesh>
        {/* 麦克风头 */}
        <mesh position={[0.55, -0.25, 0.38]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} toneMapped={false} />
        </mesh>

        </group>{/* 关闭 headGroupRef */}

        {/* ========== 脖子 ========== */}
        <group>
          <mesh position={[0, -0.85, 0]}>
            <cylinderGeometry args={[0.22, 0.28, 0.5, 32]} />
            {frameMat}
          </mesh>
          {/* 脖子发光环 */}
          <mesh position={[0, -0.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.26, 0.015, 8, 32]} />
            {glowCyan}
          </mesh>
        </group>

        {/* ========== 身体躯干 ========== */}
        <group>
          {/* 胸部主体 — 更修长 */}
          <mesh ref={bodyRef} position={[0, -1.7, 0]} castShadow>
            <capsuleGeometry args={[0.42, 1.05, 12, 24]} />
            {armorMat}
          </mesh>
          {/* 胸甲 — 圆角更精致 */}
          <mesh position={[0, -1.35, 0.22]}>
            <boxGeometry args={[0.55, 0.45, 0.12]} />
            <meshPhysicalMaterial color="#1a2332" metalness={0.95} roughness={0.08} clearcoat={1} />
          </mesh>
          {/* 能量核心 — 更亮更精致 */}
          <mesh position={[0, -1.38, 0.3]}>
            <sphereGeometry args={[0.07, 24, 24]} />
            <meshStandardMaterial color="#22d3ee" emissive="#67e8f9" emissiveIntensity={6} toneMapped={false} />
          </mesh>
          <mesh position={[0, -1.38, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.11, 0.006, 12, 48]} />
            <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={3} toneMapped={false} />
          </mesh>
          {/* 腰带 */}
          <mesh position={[0, -2.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.42, 0.03, 8, 32]} />
            {frameMat}
          </mesh>
          {/* 腰带发光 */}
          <mesh position={[0, -2.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.42, 0.012, 8, 32]} />
            {glowCyan}
          </mesh>
        </group>

        {/* ========== 肩甲 — 更圆润流线型 ========== */}
        <mesh position={[0.58, -1.15, 0]} rotation={[0, 0, -0.25]}>
          <capsuleGeometry args={[0.08, 0.18, 8, 12]} />
          {armorMat}
        </mesh>
        <mesh position={[0.58, -1.15, 0.02]} rotation={[0, 0, -0.25]}>
          <boxGeometry args={[0.14, 0.018, 0.1]} />
          {glowCyan}
        </mesh>
        <mesh position={[-0.58, -1.15, 0]} rotation={[0, 0, 0.25]}>
          <capsuleGeometry args={[0.08, 0.18, 8, 12]} />
          {armorMat}
        </mesh>
        <mesh position={[-0.58, -1.15, 0.02]} rotation={[0, 0, 0.25]}>
          <boxGeometry args={[0.14, 0.018, 0.1]} />
          {glowCyan}
        </mesh>

        {/* ========== 手臂 ========== */}
        <group ref={leftArmRef} position={[0.72, -1.35, 0]}>
          {/* 上臂 */}
          <mesh position={[0, -0.25, 0]}>
            <capsuleGeometry args={[0.09, 0.35, 8, 12]} />
            {frameMat}
          </mesh>
          {/* 肘关节 */}
          <mesh position={[0, -0.5, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            {armorMat}
          </mesh>
          {/* 前臂 */}
          <mesh position={[0, -0.72, 0]}>
            <capsuleGeometry args={[0.08, 0.3, 8, 12]} />
            {frameMat}
          </mesh>
          {/* 手腕环 */}
          <mesh position={[0, -0.92, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.085, 0.012, 8, 16]} />
            {glowCyan}
          </mesh>
          {/* 手掌 */}
          <mesh position={[0, -1.0, 0]}>
            <sphereGeometry args={[0.09, 16, 16]} />
            {skinMat}
          </mesh>
        </group>

        <group ref={rightArmRef} position={[-0.72, -1.35, 0]}>
          <mesh position={[0, -0.25, 0]}>
            <capsuleGeometry args={[0.09, 0.35, 8, 12]} />
            {frameMat}
          </mesh>
          <mesh position={[0, -0.5, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            {armorMat}
          </mesh>
          <mesh position={[0, -0.72, 0]}>
            <capsuleGeometry args={[0.08, 0.3, 8, 12]} />
            {frameMat}
          </mesh>
          <mesh position={[0, -0.92, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.085, 0.012, 8, 16]} />
            {glowCyan}
          </mesh>
          <mesh position={[0, -1.0, 0]}>
            <sphereGeometry args={[0.09, 16, 16]} />
            {skinMat}
          </mesh>
        </group>

        {/* ========== 全息光环 — 更优雅 ========== */}
        <group ref={ringsRef}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.2, 0.012, 16, 128]} />
            <meshBasicMaterial color="#7dd3fc" transparent opacity={0.3} side={THREE.DoubleSide} wireframe />
          </mesh>
          <mesh rotation={[Math.PI / 2.12, 0, 0]}>
            <torusGeometry args={[1.4, 0.006, 16, 128]} />
            <meshBasicMaterial color="#7dd3fc" transparent opacity={0.18} side={THREE.DoubleSide} wireframe />
          </mesh>
          <mesh rotation={[Math.PI / 1.88, 0, 0.2]}>
            <torusGeometry args={[1.6, 0.004, 16, 128]} />
            <meshBasicMaterial color="#a5b4fc" transparent opacity={0.1} side={THREE.DoubleSide} wireframe />
          </mesh>
          {/* 内环（实心发光） */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.05, 0.003, 8, 64]} />
            {glowCyan}
          </mesh>
        </group>

      </Float>
    </group>
  );
}

// ============================================================
// 角色切换组件 — 根据 avatarType 显示不同角色
// ============================================================
function AvatarSwitch() {
  const { avatarType, vrmModelUrl } = useDigitalHumanStore();

  if (avatarType === 'vrm' && vrmModelUrl) {
    return (
      <VRMAvatar
        url={vrmModelUrl}
        onLoad={(vrm) => console.log('VRM 模型已加载:', vrm.meta)}
        onError={(err) => console.error('VRM 加载失败:', err)}
      />
    );
  }

  return <CyberAvatar />;
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
      <ambientLight intensity={0.6} color="#e0e7ff" />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.8} castShadow shadow-mapSize={2048} />
      <pointLight position={[-10, -10, -10]} intensity={0.8} color="#3b82f6" />

      {/* Rim Light (轮廓光) */}
      <spotLight position={[-5, 5, -5]} angle={0.3} penumbra={0.5} intensity={1.2} color="#818cf8" />
      <spotLight position={[5, -3, -5]} angle={0.3} penumbra={0.5} intensity={0.8} color="#0ea5e9" />

      {/* 环境反射 */}
      <Environment preset="city" />

      {/* 模型 / 内置角色 / VRM */}
      {modelScene ? (
        <primitive object={modelScene} position={[0, -1.2, 0]} />
      ) : (
        <AvatarSwitch />
      )}

      {/* 粒子效果 */}
      <Sparkles count={80} scale={8} size={2} speed={0.3} opacity={0.4} color="#bae6fd" />
      <Sparkles count={30} scale={6} size={3} speed={0.2} opacity={0.2} color="#818cf8" />

      {/* 地面阴影 */}
      <ContactShadows
        resolution={1024}
        scale={10}
        blur={2.5}
        opacity={0.3}
        far={10}
        color="#94a3b8"
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
  isDark?: boolean;
  onModelLoad?: (model: unknown) => void;
  onFPSUpdate?: (fps: number) => void;
}

export default function DigitalHumanViewer({
  modelUrl,
  autoRotate = false,
  showControls = true,
  showFPS = false,
  isDark = true,
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
        <div className="absolute top-2 right-2 z-10 px-2 py-1 rounded bg-white/70 text-slate-600 text-xs font-mono backdrop-blur-sm border border-slate-200 shadow-sm">
          {currentFPS} FPS
          {currentFPS < 30 && <span className="text-yellow-400 ml-1">⚠</span>}
        </div>
      )}

      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
        scene={{ background: new THREE.Color(isDark ? '#0a0a0a' : '#e8edf5') }}
      >
        {(loadStatus === 'loading' || loadStatus === 'error') && (
          <Html center>
            {loadStatus === 'loading' ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300"
                    style={{ width: `${loadProgress}%` }}
                  />
                </div>
                <span className="text-slate-500 text-xs font-mono">{loadProgress}%</span>
              </div>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-white/90 text-slate-600 text-sm border border-slate-200 shadow-lg">
                加载失败，使用内置模型
              </div>
            )}
          </Html>
        )}
        <Scene autoRotate={autoRotate} modelScene={modelScene} onFPSUpdate={handleFPSUpdate} />
      </Canvas>

      {showControls && (
        <div className="absolute bottom-4 left-4 right-4 bg-white/80 backdrop-blur-lg border border-slate-200 rounded-2xl p-4 space-y-3 text-slate-800 shadow-lg">
          <h2 className="text-lg font-semibold">数字人控制</h2>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">模型:</span>
              <span className={loadStatus === 'ready' ? 'text-green-600' : 'text-yellow-600'}>
                {loadStatus === 'ready' ? '已加载' : loadStatus === 'loading' ? `${loadProgress}%` : '内置模型'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">引擎:</span>
              <span className="text-blue-600">Three.js R3F</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">帧率:</span>
              <span className={currentFPS >= 30 ? 'text-green-600' : 'text-yellow-600'}>
                {currentFPS} FPS
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">旋转:</span>
              <span className="text-slate-700">{autoRotate ? '开启' : '关闭'}</span>
            </div>
            {loadError && (
              <div className="col-span-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {loadError}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
