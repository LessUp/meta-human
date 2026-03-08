import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Float, Sparkles, ContactShadows, Html } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
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
  neutral: '#a78bfa',   // 薰衣草紫
  happy: '#86efac',     // 薄荷绿
  sad: '#93c5fd',       // 天空蓝
  angry: '#fca5a5',     // 柔和红
  surprised: '#fcd34d', // 暖黄
  excited: '#f9a8d4',   // 樱花粉
};

// ============================================================
// 增强版 CyberAvatar 组件
// ============================================================
function CyberAvatar() {
  const group = useRef<THREE.Group>(null);
  const headGroupRef = useRef<THREE.Group>(null);
  const _bodyGroupRef = useRef<THREE.Group>(null);
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
    } else {
      // idle 呼吸动画 — 微妙的身体起伏和头部晃动
      targetBodyPosY = Math.sin(t * 1.2) * 0.012;
      targetHeadRotX = -mouse.current.y * 0.1 + Math.sin(t * 0.8) * 0.015;
      targetHeadRotY = mouse.current.x * 0.15 + Math.sin(t * 0.6) * 0.01;
      targetBodyRotZ = Math.sin(t * 0.9) * 0.005;
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
    let targetLeftArmRotZ = Math.PI * 0.05;
    let targetRightArmRotZ = -Math.PI * 0.05;
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

  // 共享材质 — 参考airi柔和动漫风格
  const skinMat = useMemo(() => (
    <meshPhysicalMaterial color="#fdd9c4" metalness={0.0} roughness={0.5} clearcoat={0.25} clearcoatRoughness={0.35} envMapIntensity={0.6} sheen={0.35} sheenColor="#ffb8c6" />
  ), []);
  const clothMat = useMemo(() => (
    <meshPhysicalMaterial color="#f0f4ff" metalness={0.02} roughness={0.6} clearcoat={0.15} clearcoatRoughness={0.4} envMapIntensity={0.6} sheen={0.1} sheenColor="#ddd6fe" />
  ), []);
  const clothAccentMat = useMemo(() => (
    <meshPhysicalMaterial color="#8b9dc3" metalness={0.05} roughness={0.45} clearcoat={0.25} clearcoatRoughness={0.3} envMapIntensity={0.8} />
  ), []);
  const hairMat = useMemo(() => (
    <meshPhysicalMaterial color="#2e1f3e" metalness={0.1} roughness={0.32} clearcoat={0.7} clearcoatRoughness={0.1} envMapIntensity={1.5} sheen={0.5} sheenColor="#a78bfa" />
  ), []);
  const hairHighlightMat = useMemo(() => (
    <meshPhysicalMaterial color="#6d4c9e" metalness={0.08} roughness={0.3} clearcoat={0.7} clearcoatRoughness={0.1} envMapIntensity={1.8} sheen={0.55} sheenColor="#d8b4fe" />
  ), []);
  const eyeWhiteMat = useMemo(() => (
    <meshStandardMaterial color="#f8fafc" metalness={0.0} roughness={0.15} />
  ), []);
  const blushMat = useMemo(() => (
    <meshStandardMaterial color="#f9a8d4" transparent opacity={0.25} />
  ), []);
  const shoeMat = useMemo(() => (
    <meshPhysicalMaterial color="#2e1f3e" metalness={0.1} roughness={0.4} clearcoat={0.35} />
  ), []);
  const glowSoft = useMemo(() => (
    <meshStandardMaterial color="#c4b5fd" emissive="#c4b5fd" emissiveIntensity={1.5} toneMapped={false} />
  ), []);
  const glowPink = useMemo(() => (
    <meshStandardMaterial color="#f9a8d4" emissive="#f9a8d4" emissiveIntensity={1.2} toneMapped={false} />
  ), []);

  return (
    <group ref={group}>
      <pointLight ref={emotionLightRef} position={[0, 0.5, 2.5]} intensity={2} color="#a78bfa" distance={8} />
      {/* 脸部补光 — 柔和打亮五官 */}
      <pointLight position={[0, -0.05, 2.5]} intensity={0.8} color="#fff5ee" distance={4} />
      {/* 眼部微补光 */}
      <pointLight position={[0, 0.1, 2.8]} intensity={0.3} color="#ede9fe" distance={3} />

      <Float speed={1.8} rotationIntensity={0.08} floatIntensity={0.25}>

        {/* ========== 头部组（独立旋转） ========== */}
        <group ref={headGroupRef}>
          {/* 头部主体 */}
          <mesh ref={headRef} position={[0, 0, 0]} castShadow receiveShadow>
            <sphereGeometry args={[0.72, 32, 32]} />
            {skinMat}
          </mesh>
          {/* 下颌 — Q版尖下巴 */}
          <mesh position={[0, -0.32, 0.1]} castShadow scale={[0.78, 0.55, 0.78]}>
            <sphereGeometry args={[0.55, 20, 20]} />
            {skinMat}
          </mesh>
          {/* 脸颊腮红（左） */}
          <mesh position={[-0.32, -0.15, 0.55]} scale={[1.0, 0.45, 0.12]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            {blushMat}
          </mesh>
          {/* 脸颊腮红（右） */}
          <mesh position={[0.32, -0.15, 0.55]} scale={[1.0, 0.45, 0.12]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            {blushMat}
          </mesh>

          {/* 鼻子 */}
          <mesh position={[0, -0.08, 0.7]} scale={[0.5, 0.6, 0.35]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            {skinMat}
          </mesh>

          {/* ========== 头发（精简版 12mesh） ========== */}
          {/* 后脑勺+头顶一体 */}
          <mesh position={[0, 0.1, -0.1]} scale={[1.08, 1.12, 1.02]}>
            <sphereGeometry args={[0.72, 24, 24]} />
            {hairMat}
          </mesh>
          {/* 呆毛 */}
          <mesh position={[0.08, 0.82, 0.12]} rotation={[0.3, 0, 0.15]} scale={[0.07, 0.3, 0.05]}>
            <capsuleGeometry args={[0.15, 0.5, 3, 6]} />
            {hairHighlightMat}
          </mesh>
          {/* 刘海主层 — 覆盖额头 */}
          <mesh position={[0, 0.12, 0.56]} rotation={[0.5, 0, 0]} scale={[0.82, 0.55, 0.3]}>
            <sphereGeometry args={[0.48, 12, 12]} />
            {hairMat}
          </mesh>
          {/* 刘海左束 */}
          <mesh position={[-0.3, 0.05, 0.48]} rotation={[0.3, 0.12, 0.1]} scale={[0.42, 0.55, 0.22]}>
            <sphereGeometry args={[0.38, 10, 10]} />
            {hairMat}
          </mesh>
          {/* 刘海右束 */}
          <mesh position={[0.3, 0.05, 0.48]} rotation={[0.3, -0.12, -0.1]} scale={[0.42, 0.55, 0.22]}>
            <sphereGeometry args={[0.38, 10, 10]} />
            {hairMat}
          </mesh>
          {/* 侧发左 — 更丰满 */}
          <mesh position={[-0.62, -0.1, -0.04]} rotation={[0.05, 0, 0.1]} scale={[0.32, 0.9, 0.35]}>
            <capsuleGeometry args={[0.18, 0.55, 6, 10]} />
            {hairMat}
          </mesh>
          {/* 侧发右 — 更丰满 */}
          <mesh position={[0.62, -0.1, -0.04]} rotation={[0.05, 0, -0.1]} scale={[0.32, 0.9, 0.35]}>
            <capsuleGeometry args={[0.18, 0.55, 6, 10]} />
            {hairMat}
          </mesh>
          {/* 后发尾主束 */}
          <mesh position={[0, -0.38, -0.42]} rotation={[0.15, 0, 0]} scale={[0.52, 0.85, 0.32]}>
            <capsuleGeometry args={[0.22, 0.55, 6, 10]} />
            {hairMat}
          </mesh>
          {/* 后发尾左分叉 */}
          <mesh position={[-0.15, -0.5, -0.4]} rotation={[0.12, 0.08, 0.06]} scale={[0.22, 0.45, 0.18]}>
            <capsuleGeometry args={[0.14, 0.3, 4, 8]} />
            {hairMat}
          </mesh>
          {/* 后发尾右分叉 */}
          <mesh position={[0.15, -0.5, -0.4]} rotation={[0.12, -0.08, -0.06]} scale={[0.22, 0.45, 0.18]}>
            <capsuleGeometry args={[0.14, 0.3, 4, 8]} />
            {hairMat}
          </mesh>
          {/* 天使光环 */}
          <mesh position={[0, 0.58, 0.15]} rotation={[0.2, 0, 0]} scale={[0.6, 0.07, 0.25]}>
            <sphereGeometry args={[0.48, 10, 10]} />
            {hairHighlightMat}
          </mesh>
          {/* 发饰蝴蝶结左翼 */}
          <mesh position={[-0.58, 0.28, 0.1]} rotation={[0, 0.3, 0.35]} scale={[0.8, 0.5, 0.35]}>
            <sphereGeometry args={[0.08, 6, 6]} />
            {glowPink}
          </mesh>
          {/* 发饰蝴蝶结右翼 */}
          <mesh position={[-0.48, 0.28, 0.1]} rotation={[0, 0.3, 0.25]} scale={[0.8, 0.5, 0.35]}>
            <sphereGeometry args={[0.08, 6, 6]} />
            {glowPink}
          </mesh>
          {/* 刘海内层高光 */}
          <mesh position={[0, 0.15, 0.58]} rotation={[0.45, 0, 0]} scale={[0.6, 0.32, 0.1]}>
            <sphereGeometry args={[0.35, 8, 8]} />
            {hairHighlightMat}
          </mesh>

          {/* ========== 眼睛（更大更有灵气） ========== */}
          <group position={[0, -0.02, 0.58]}>
            {/* 巩膜 — 增大10% */}
            <mesh ref={leftEyeRef} position={[-0.23, 0, 0.06]} scale={[1.7, 1.5, 0.45]}>
              <sphereGeometry args={[0.13, 16, 16]} />
              {eyeWhiteMat}
            </mesh>
            <mesh ref={rightEyeRef} position={[0.23, 0, 0.06]} scale={[1.7, 1.5, 0.45]}>
              <sphereGeometry args={[0.13, 16, 16]} />
              {eyeWhiteMat}
            </mesh>
            {/* 虹膜外圈 — 填充眼球 */}
            <mesh position={[-0.23, -0.02, 0.09]} scale={[1.5, 1.45, 0.24]}>
              <sphereGeometry args={[0.09, 16, 16]} />
              <meshStandardMaterial color="#4c1d95" emissive="#5b21b6" emissiveIntensity={0.3} />
            </mesh>
            <mesh position={[0.23, -0.02, 0.09]} scale={[1.5, 1.45, 0.24]}>
              <sphereGeometry args={[0.09, 16, 16]} />
              <meshStandardMaterial color="#4c1d95" emissive="#5b21b6" emissiveIntensity={0.3} />
            </mesh>
            {/* 虹膜内圈 */}
            <mesh position={[-0.23, -0.02, 0.1]} scale={[1.2, 1.2, 0.18]}>
              <sphereGeometry args={[0.065, 12, 12]} />
              <meshStandardMaterial color="#7c3aed" emissive="#a78bfa" emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[0.23, -0.02, 0.1]} scale={[1.2, 1.2, 0.18]}>
              <sphereGeometry args={[0.065, 12, 12]} />
              <meshStandardMaterial color="#7c3aed" emissive="#a78bfa" emissiveIntensity={0.5} />
            </mesh>
            {/* 瞳孔 */}
            <mesh position={[-0.23, -0.02, 0.115]} scale={[1, 1, 0.12]}>
              <sphereGeometry args={[0.035, 10, 10]} />
              <meshStandardMaterial color="#0f0320" emissive="#7c3aed" emissiveIntensity={1.0} toneMapped={false} />
            </mesh>
            <mesh position={[0.23, -0.02, 0.115]} scale={[1, 1, 0.12]}>
              <sphereGeometry args={[0.035, 10, 10]} />
              <meshStandardMaterial color="#0f0320" emissive="#7c3aed" emissiveIntensity={1.0} toneMapped={false} />
            </mesh>
            {/* 主高光 — 更大更亮 */}
            <mesh position={[-0.19, 0.05, 0.13]}>
              <sphereGeometry args={[0.032, 6, 6]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0.27, 0.05, 0.13]}>
              <sphereGeometry args={[0.032, 6, 6]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* 小高光 */}
            <mesh position={[-0.27, -0.04, 0.12]}>
              <sphereGeometry args={[0.015, 4, 4]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0.19, -0.04, 0.12]}>
              <sphereGeometry args={[0.015, 4, 4]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            {/* 底部反射弧 — 眼睛灵气关键 */}
            <mesh position={[-0.23, -0.08, 0.11]} scale={[1.2, 0.35, 0.08]}>
              <sphereGeometry args={[0.06, 8, 6]} />
              <meshBasicMaterial color="#e0d4ff" transparent opacity={0.4} />
            </mesh>
            <mesh position={[0.23, -0.08, 0.11]} scale={[1.2, 0.35, 0.08]}>
              <sphereGeometry args={[0.06, 8, 6]} />
              <meshBasicMaterial color="#e0d4ff" transparent opacity={0.4} />
            </mesh>
            {/* 上睫毛 — 加粗 */}
            <mesh position={[-0.23, 0.11, 0.08]} rotation={[0, 0, 0.05]} scale={[2.0, 0.3, 0.14]}>
              <capsuleGeometry args={[0.04, 0.08, 3, 6]} />
              <meshBasicMaterial color="#1a0e30" />
            </mesh>
            <mesh position={[0.23, 0.11, 0.08]} rotation={[0, 0, -0.05]} scale={[2.0, 0.3, 0.14]}>
              <capsuleGeometry args={[0.04, 0.08, 3, 6]} />
              <meshBasicMaterial color="#1a0e30" />
            </mesh>
            {/* 下睫毛 — 细柔 */}
            <mesh position={[-0.23, -0.1, 0.08]} rotation={[0, 0, 0.03]} scale={[1.4, 0.15, 0.08]}>
              <capsuleGeometry args={[0.03, 0.06, 3, 4]} />
              <meshBasicMaterial color="#2d1b4e" transparent opacity={0.6} />
            </mesh>
            <mesh position={[0.23, -0.1, 0.08]} rotation={[0, 0, -0.03]} scale={[1.4, 0.15, 0.08]}>
              <capsuleGeometry args={[0.03, 0.06, 3, 4]} />
              <meshBasicMaterial color="#2d1b4e" transparent opacity={0.6} />
            </mesh>
          </group>

          {/* ========== 眉毛 — 柔和弧形 ========== */}
          <group position={[0, 0.04, 0.58]}>
            <mesh ref={leftBrowRef} position={[-0.26, 0.32, 0]} rotation={[0, 0, 0.1]}>
              <capsuleGeometry args={[0.018, 0.14, 4, 8]} />
              {hairMat}
            </mesh>
            <mesh ref={rightBrowRef} position={[0.26, 0.32, 0]} rotation={[0, 0, -0.1]}>
              <capsuleGeometry args={[0.018, 0.14, 4, 8]} />
              {hairMat}
            </mesh>
          </group>

          {/* ========== 嘴巴 — 微笑弧形 ========== */}
          <mesh ref={mouthRef} position={[0, -0.35, 0.64]} rotation={[0.15, 0, 0]}>
            <torusGeometry args={[0.055, 0.014, 6, 12, Math.PI]} />
            <meshStandardMaterial color="#c4607e" emissive="#e8a0bf" emissiveIntensity={0.3} />
          </mesh>

          {/* ========== 耳朵 ========== */}
          <mesh position={[0.68, -0.06, -0.04]} scale={[0.18, 0.3, 0.22]}>
            <sphereGeometry args={[0.18, 8, 8]} />
            {skinMat}
          </mesh>
          <mesh position={[-0.68, -0.06, -0.04]} scale={[0.18, 0.3, 0.22]}>
            <sphereGeometry args={[0.18, 8, 8]} />
            {skinMat}
          </mesh>

        </group>{/* 关闭 headGroupRef */}

        {/* ========== 脖子 ========== */}
        <mesh position={[0, -0.68, 0.02]}>
          <cylinderGeometry args={[0.13, 0.15, 0.25, 24]} />
          {skinMat}
        </mesh>
        {/* 项链 */}
        <mesh position={[0, -0.58, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.16, 0.008, 8, 32]} />
          {glowSoft}
        </mesh>
        {/* 项链吊坠 */}
        <mesh position={[0, -0.68, 0.16]}>
          <sphereGeometry args={[0.025, 12, 12]} />
          {glowPink}
        </mesh>

        {/* ========== 身体（精简版 13mesh） ========== */}
        <group>
          {/* 上身 */}
          <mesh ref={bodyRef} position={[0, -1.35, 0]} castShadow>
            <capsuleGeometry args={[0.34, 0.78, 8, 16]} />
            {clothMat}
          </mesh>
          {/* 泡泡袖 */}
          <mesh position={[0.42, -0.95, 0]} scale={[0.85, 0.62, 0.78]}>
            <sphereGeometry args={[0.15, 10, 10]} />
            {clothMat}
          </mesh>
          <mesh position={[-0.42, -0.95, 0]} scale={[0.85, 0.62, 0.78]}>
            <sphereGeometry args={[0.15, 10, 10]} />
            {clothMat}
          </mesh>
          {/* 水手领前 */}
          <mesh position={[0, -0.92, 0.22]} rotation={[0.35, 0, 0]} scale={[0.95, 0.48, 0.42]}>
            <sphereGeometry args={[0.22, 10, 10]} />
            {clothMat}
          </mesh>
          {/* 水手领后 */}
          <mesh position={[0, -0.88, -0.16]} rotation={[-0.2, 0, 0]} scale={[0.9, 0.38, 0.38]}>
            <sphereGeometry args={[0.22, 8, 8]} />
            {clothMat}
          </mesh>
          {/* 领口蓝色边线（前） */}
          <mesh position={[0, -0.85, 0.3]} rotation={[0.35, 0, 0]} scale={[0.88, 0.02, 0.35]}>
            <sphereGeometry args={[0.22, 8, 4]} />
            {clothAccentMat}
          </mesh>
          {/* 领口蓝色边线（后） */}
          <mesh position={[0, -0.82, -0.22]} rotation={[-0.2, 0, 0]} scale={[0.82, 0.02, 0.3]}>
            <sphereGeometry args={[0.22, 8, 4]} />
            {clothAccentMat}
          </mesh>
          {/* 领口V线 */}
          <mesh position={[-0.1, -0.96, 0.28]} rotation={[0.2, 0.15, 0.2]}>
            <boxGeometry args={[0.22, 0.014, 0.008]} />
            {clothAccentMat}
          </mesh>
          <mesh position={[0.1, -0.96, 0.28]} rotation={[0.2, -0.15, -0.2]}>
            <boxGeometry args={[0.22, 0.014, 0.008]} />
            {clothAccentMat}
          </mesh>
          {/* 胸口蝴蝶结 */}
          <mesh position={[-0.05, -1.02, 0.3]} rotation={[0, 0, 0.45]} scale={[0.9, 0.45, 0.4]}>
            <sphereGeometry args={[0.05, 6, 6]} />
            {glowPink}
          </mesh>
          <mesh position={[0.05, -1.02, 0.3]} rotation={[0, 0, -0.45]} scale={[0.9, 0.45, 0.4]}>
            <sphereGeometry args={[0.05, 6, 6]} />
            {glowPink}
          </mesh>
          {/* 腰线 */}
          <mesh position={[0, -1.62, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.3, 0.018, 6, 24]} />
            {clothAccentMat}
          </mesh>
          {/* 腰带蝴蝶结 */}
          <mesh position={[0, -1.62, 0.27]} scale={[0.6, 0.35, 0.3]}>
            <sphereGeometry args={[0.06, 6, 6]} />
            {clothAccentMat}
          </mesh>
          {/* 缎带垂尾 */}
          <mesh position={[0, -1.72, 0.25]} scale={[0.1, 0.25, 0.05]}>
            <capsuleGeometry args={[0.08, 0.2, 3, 6]} />
            {glowPink}
          </mesh>
          {/* 裙摆 */}
          <mesh position={[0, -1.88, 0]} castShadow>
            <cylinderGeometry args={[0.32, 0.58, 0.58, 20]} />
            {clothMat}
          </mesh>
          {/* 裙摆内层 */}
          <mesh position={[0, -2.12, 0]}>
            <cylinderGeometry args={[0.53, 0.6, 0.15, 20]} />
            {clothMat}
          </mesh>
          {/* 裙摆褶皱暗示线 */}
          {[0, 1, 2, 3].map(i => (
            <mesh key={`pleat-${i}`} position={[
              Math.sin(i * Math.PI / 2) * 0.42,
              -1.95,
              Math.cos(i * Math.PI / 2) * 0.42
            ]} rotation={[0, -i * Math.PI / 2, 0]}>
              <boxGeometry args={[0.008, 0.35, 0.005]} />
              <meshStandardMaterial color="#d4d4f7" transparent opacity={0.15} />
            </mesh>
          ))}
          {/* 裙摆底部渐变环 */}
          <mesh position={[0, -2.14, 0]}>
            <cylinderGeometry args={[0.56, 0.58, 0.04, 20]} />
            <meshStandardMaterial color="#ddd6fe" transparent opacity={0.3} />
          </mesh>
          {/* 裙摆边饰 */}
          <mesh position={[0, -2.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.57, 0.01, 6, 32]} />
            {glowSoft}
          </mesh>
        </group>

        {/* ========== 手臂 + 手指暗示 ========== */}
        <group ref={leftArmRef} position={[0.42, -0.98, 0]}>
          <mesh position={[0, -0.22, 0]}>
            <capsuleGeometry args={[0.052, 0.32, 6, 8]} />
            {skinMat}
          </mesh>
          <mesh position={[0, -0.52, 0]}>
            <capsuleGeometry args={[0.042, 0.22, 6, 8]} />
            {skinMat}
          </mesh>
          {/* 手掌 */}
          <mesh position={[0, -0.7, 0]} scale={[0.9, 0.6, 0.55]}>
            <sphereGeometry args={[0.055, 8, 8]} />
            {skinMat}
          </mesh>
          {/* 手指暗示 */}
          <mesh position={[0, -0.78, 0]} scale={[0.6, 0.35, 0.35]}>
            <capsuleGeometry args={[0.025, 0.04, 3, 4]} />
            {skinMat}
          </mesh>
        </group>
        <group ref={rightArmRef} position={[-0.42, -0.98, 0]}>
          <mesh position={[0, -0.22, 0]}>
            <capsuleGeometry args={[0.052, 0.32, 6, 8]} />
            {skinMat}
          </mesh>
          <mesh position={[0, -0.52, 0]}>
            <capsuleGeometry args={[0.042, 0.22, 6, 8]} />
            {skinMat}
          </mesh>
          {/* 手掌 */}
          <mesh position={[0, -0.7, 0]} scale={[0.9, 0.6, 0.55]}>
            <sphereGeometry args={[0.055, 8, 8]} />
            {skinMat}
          </mesh>
          {/* 手指暗示 */}
          <mesh position={[0, -0.78, 0]} scale={[0.6, 0.35, 0.35]}>
            <capsuleGeometry args={[0.025, 0.04, 3, 4]} />
            {skinMat}
          </mesh>
        </group>

        {/* ========== 腿部 ========== */}
        <mesh position={[0.15, -2.35, 0]}>
          <capsuleGeometry args={[0.065, 0.32, 6, 8]} />
          {clothMat}
        </mesh>
        <mesh position={[-0.15, -2.35, 0]}>
          <capsuleGeometry args={[0.065, 0.32, 6, 8]} />
          {clothMat}
        </mesh>
        {/* 袜口过渡环 */}
        <mesh position={[0.15, -2.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.065, 0.006, 4, 12]} />
          <meshStandardMaterial color="#e2e8f0" />
        </mesh>
        <mesh position={[-0.15, -2.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.065, 0.006, 4, 12]} />
          <meshStandardMaterial color="#e2e8f0" />
        </mesh>
        {/* 鞋子主体 */}
        <mesh position={[0.15, -2.55, 0.03]} scale={[1, 0.6, 1.35]}>
          <sphereGeometry args={[0.075, 8, 8]} />
          {shoeMat}
        </mesh>
        <mesh position={[-0.15, -2.55, 0.03]} scale={[1, 0.6, 1.35]}>
          <sphereGeometry args={[0.075, 8, 8]} />
          {shoeMat}
        </mesh>
        {/* 鞋底 */}
        <mesh position={[0.15, -2.59, 0.03]} scale={[1.05, 0.2, 1.4]}>
          <boxGeometry args={[0.12, 0.02, 0.12]} />
          <meshStandardMaterial color="#1a0e2e" roughness={0.8} />
        </mesh>
        <mesh position={[-0.15, -2.59, 0.03]} scale={[1.05, 0.2, 1.4]}>
          <boxGeometry args={[0.12, 0.02, 0.12]} />
          <meshStandardMaterial color="#1a0e2e" roughness={0.8} />
        </mesh>
        {/* 鞋扣蝴蝶结 */}
        <mesh position={[0.15, -2.52, 0.1]}>
          <sphereGeometry args={[0.015, 4, 4]} />
          {glowPink}
        </mesh>
        <mesh position={[-0.15, -2.52, 0.1]}>
          <sphereGeometry args={[0.015, 4, 4]} />
          {glowPink}
        </mesh>

        {/* ========== 光环（精简版 2mesh） ========== */}
        <group ref={ringsRef}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.15, 0.008, 8, 48]} />
            <meshBasicMaterial color="#c4b5fd" transparent opacity={0.2} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[Math.PI / 2.08, 0, 0]}>
            <torusGeometry args={[1.3, 0.005, 8, 48]} />
            <meshBasicMaterial color="#f9a8d4" transparent opacity={0.12} side={THREE.DoubleSide} />
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
      <PerspectiveCamera makeDefault position={[0, -0.3, 5.8]} fov={42} />

      <FPSMonitor onFPSUpdate={onFPSUpdate} />
      <VisibilityOptimizer autoRotate={autoRotate ?? false} />

      {/* 主光源 — 参考airi的柔和光照系统 */}
      <hemisphereLight args={['#e8dff5', '#fce7d6', 0.6]} />
      <ambientLight intensity={0.5} color="#faf5ff" />
      <directionalLight position={[5, 8, 6]} intensity={1.2} castShadow color="#fff5ee" shadow-mapSize={1024} />
      {/* 背光 — 轮廓光效果 */}
      <spotLight position={[-4, 5, -5]} angle={0.35} penumbra={0.8} intensity={0.8} color="#d8b4fe" />
      {/* 头顶高光补光 */}
      <pointLight position={[0, 3, 2]} intensity={0.5} color="#ede9fe" distance={8} />
      {/* 底部反射补光 */}
      <pointLight position={[0, -3, 2]} intensity={0.2} color="#fce7f3" distance={6} />

      {/* 环境反射 — sunset更暖更动漫 */}
      <Environment preset="sunset" />

      {/* 模型 / 内置角色 / VRM */}
      {modelScene ? (
        <primitive object={modelScene} position={[0, -1.2, 0]} />
      ) : (
        <AvatarSwitch />
      )}

      {/* 粒子效果 — 柔和双层 */}
      <Sparkles count={50} scale={7} size={1.5} speed={0.15} opacity={0.2} color="#e9d5ff" />
      <Sparkles count={25} scale={4} size={2} speed={0.1} opacity={0.15} color="#fbcfe8" />

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

      {/* Bloom 后处理 — 让发光元素更梦幻 */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.6}
          luminanceSmoothing={0.5}
          intensity={0.8}
          mipmapBlur
        />
      </EffectComposer>
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
        <div className="absolute top-2 right-2 z-10 px-2 py-1 rounded bg-white/70 dark:bg-black/50 text-slate-600 dark:text-white text-xs font-mono backdrop-blur-sm border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none">
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
