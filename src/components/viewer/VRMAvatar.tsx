// VRM Avatar 组件 — 借鉴 AIRI 项目的模块化架构
// 从 src/components/VRMAvatar.tsx 迁移到 viewer/ 目录
import { useEffect, useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VRM, VRMUtils } from '@pixiv/three-vrm';
import { useDigitalHumanStore } from '@/store/digitalHumanStore';
import { useVRMLoader } from '@/hooks/vrm/useVRMLoader';
import { useVRMEmote } from '@/hooks/vrm/useVRMEmote';
import { useVRMBlink } from '@/hooks/vrm/useVRMBlink';
import { useVRMLipSync } from '@/hooks/vrm/useVRMLipSync';
import { useVRMEyeSaccades } from '@/hooks/vrm/useVRMEyeSaccades';
import type { VRMEmoteController } from '@/hooks/vrm/useVRMEmote';

interface VRMAvatarProps {
  url: string;
  onLoad?: (vrm: VRM) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

export default function VRMAvatar({ url, onLoad, onError, onProgress }: VRMAvatarProps) {
  const vrmRef = useRef<VRM | null>(null);
  const [loaded, setLoaded] = useState(false);

  // 模块化控制器 refs
  const emoteRef = useRef<VRMEmoteController | null>(null);
  const blinkRef = useRef(useVRMBlink());
  const lipSyncRef = useRef(useVRMLipSync());
  const eyeSaccadesRef = useRef(useVRMEyeSaccades());

  // 上一次的表情名，用于检测变化
  const lastExpressionRef = useRef<string>('neutral');

  // 骨骼动画插值状态
  const animState = useRef({
    headRotX: 0, headRotY: 0, headRotZ: 0,
    spineRotX: 0, spineRotZ: 0,
    hipsPosY: 0,
    leftArmRotZ: 0, rightArmRotZ: 0,
    leftArmRotX: 0, rightArmRotX: 0,
  });

  // 鼠标跟踪
  const mouse = useRef(new THREE.Vector2(0, 0));
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 使用单例 VRM 加载器
  const loader = useMemo(() => useVRMLoader(), []);

  // 加载 VRM 模型
  useEffect(() => {
    let cancelled = false;

    loader.load(
      url,
      (gltf) => {
        if (cancelled) return;

        const vrm = gltf.userData.vrm as VRM;
        if (!vrm) {
          onError?.('文件不是有效的 VRM 模型');
          return;
        }

        // 借鉴 AIRI：优化模型性能
        VRMUtils.removeUnnecessaryVertices(gltf.scene);
        VRMUtils.removeUnnecessaryJoints(gltf.scene);

        // 借鉴 AIRI：禁用视锥裁剪
        vrm.scene.traverse((obj: THREE.Object3D) => {
          obj.frustumCulled = false;
        });

        // 旋转模型朝向摄像机
        VRMUtils.rotateVRM0(vrm);
        vrm.scene.position.set(0, -1.8, 0);

        // 初始化模块化控制器
        emoteRef.current = useVRMEmote(vrm);

        vrmRef.current = vrm;
        setLoaded(true);
        onLoad?.(vrm);

        console.log('VRM 模型加载成功:', vrm.meta);
        console.log('可用表情:', vrm.expressionManager?.expressions.map(e => e.expressionName));
      },
      (progress) => {
        if (cancelled) return;
        if (progress.total > 0) {
          onProgress?.(Math.round((progress.loaded / progress.total) * 100));
        }
      },
      (error) => {
        if (cancelled) return;
        const msg = error instanceof Error ? error.message : '加载 VRM 模型失败';
        console.error('VRM 加载错误:', error);
        onError?.(msg);
      }
    );

    return () => {
      cancelled = true;
      emoteRef.current?.dispose();
      if (vrmRef.current) {
        VRMUtils.deepDispose(vrmRef.current.scene);
        vrmRef.current = null;
      }
    };
  }, [url]);

  // 每帧更新 — 模块化：表情 + 眨眼 + 唇形 + 眼球微动 + 骨骼
  useFrame((state, delta) => {
    const vrm = vrmRef.current;
    if (!vrm) return;

    const t = state.clock.elapsedTime;
    const lerp = THREE.MathUtils.lerp;
    const anim = animState.current;

    const {
      currentExpression, isSpeaking, currentAnimation,
      currentBehavior, expressionIntensity,
    } = useDigitalHumanStore.getState();

    const intensity = Math.max(0, Math.min(1, expressionIntensity ?? 1));
    const isAnim = (name: string) => currentAnimation === name || currentBehavior === name;

    // ---- 模块化表情系统 ----
    if (emoteRef.current) {
      if (currentExpression !== lastExpressionRef.current) {
        emoteRef.current.setEmotion(currentExpression, intensity);
        lastExpressionRef.current = currentExpression;
      }
      emoteRef.current.update(delta);
    }

    // ---- 自然眨眼 ----
    blinkRef.current.update(vrm, delta);
    // ---- 唇形同步 ----
    lipSyncRef.current.update(vrm, delta, isSpeaking);
    // ---- 空闲眼球微动 ----
    eyeSaccadesRef.current.update(vrm, {
      x: mouse.current.x * 0.5,
      y: mouse.current.y * 0.3,
      z: -1,
    }, delta);

    // ---- 骨骼动画 ----
    const headNode = vrm.humanoid.getNormalizedBoneNode('head');
    const spineNode = vrm.humanoid.getNormalizedBoneNode('spine');
    const leftUpperArmNode = vrm.humanoid.getNormalizedBoneNode('leftUpperArm');
    const rightUpperArmNode = vrm.humanoid.getNormalizedBoneNode('rightUpperArm');
    const hipsNode = vrm.humanoid.getNormalizedBoneNode('hips');

    // 头部目标
    let targetHeadRotY = mouse.current.x * 0.3;
    let targetHeadRotX = -mouse.current.y * 0.2;
    let targetHeadRotZ = 0;
    let targetSpineRotX = 0;
    let targetSpineRotZ = 0;
    let targetHipsPosY = 0;

    if (isAnim('nod') || currentBehavior === 'listening') {
      targetHeadRotX = Math.sin(t * 3.5) * 0.2; targetSpineRotX = Math.sin(t * 3.5) * 0.03;
    } else if (isAnim('shakeHead')) {
      targetHeadRotY = Math.sin(t * 5) * 0.4; targetSpineRotZ = Math.sin(t * 5) * 0.02;
    } else if (currentBehavior === 'thinking') {
      targetHeadRotZ = Math.sin(t * 0.8) * 0.12; targetHeadRotY = -0.15 + Math.sin(t * 0.5) * 0.08; targetHeadRotX = 0.05;
    } else if (currentBehavior === 'greeting' || isAnim('wave') || isAnim('waveHand')) {
      targetHeadRotZ = Math.sin(t * 2.5) * 0.1; targetHeadRotY = 0.1 + Math.sin(t * 3) * 0.05; targetHipsPosY = Math.sin(t * 3) * 0.01;
    } else if (isAnim('bow')) {
      targetHeadRotX = -0.3; targetSpineRotX = -0.25;
    } else if (isAnim('lookAround')) {
      targetHeadRotY = Math.sin(t * 1.2) * 0.5; targetHeadRotX = Math.sin(t * 2) * 0.1;
    } else if (isAnim('sleep')) {
      targetHeadRotX = -0.3 + Math.sin(t * 0.4) * 0.03; targetHeadRotZ = 0.2; targetSpineRotX = -0.1;
    } else if (isAnim('cheer')) {
      targetHeadRotX = 0.15; targetHeadRotZ = Math.sin(t * 7) * 0.1; targetHipsPosY = Math.abs(Math.sin(t * 5)) * 0.08;
    } else if (isAnim('dance')) {
      targetHeadRotZ = Math.sin(t * 4) * 0.1; targetHipsPosY = Math.abs(Math.sin(t * 4)) * 0.06;
    } else if (isAnim('excited') || currentBehavior === 'excited') {
      targetHipsPosY = Math.abs(Math.sin(t * 6)) * 0.1; targetHeadRotZ = Math.sin(t * 8) * 0.08;
    } else if (currentBehavior === 'speaking' || isSpeaking) {
      targetHeadRotY = mouse.current.x * 0.15 + Math.sin(t * 1.5) * 0.05;
      targetHeadRotX = -mouse.current.y * 0.08 + Math.sin(t * 2) * 0.03;
    }

    // 平滑插值
    anim.headRotX = lerp(anim.headRotX, targetHeadRotX, 0.1);
    anim.headRotY = lerp(anim.headRotY, targetHeadRotY, 0.1);
    anim.headRotZ = lerp(anim.headRotZ, targetHeadRotZ, 0.1);
    if (headNode) { headNode.rotation.x = anim.headRotX; headNode.rotation.y = anim.headRotY; headNode.rotation.z = anim.headRotZ; }

    anim.spineRotX = lerp(anim.spineRotX, targetSpineRotX, 0.06);
    anim.spineRotZ = lerp(anim.spineRotZ, targetSpineRotZ, 0.06);
    if (spineNode) { spineNode.rotation.x = anim.spineRotX; spineNode.rotation.z = anim.spineRotZ; }

    anim.hipsPosY = lerp(anim.hipsPosY, targetHipsPosY, 0.12);
    if (hipsNode) hipsNode.position.y = anim.hipsPosY;

    // 手臂
    let tLAZ = 0, tRAZ = 0, tLAX = 0, tRAX = 0;
    if (currentBehavior === 'greeting' || isAnim('wave') || isAnim('waveHand')) {
      tRAZ = -Math.PI * 0.6 + Math.sin(t * 5) * 0.25; tRAX = Math.sin(t * 5) * 0.15;
    } else if (isAnim('raiseHand')) { tRAZ = -Math.PI * 0.5; }
    else if (currentBehavior === 'speaking' || isSpeaking) {
      tLAZ = Math.sin(t * 2.5) * 0.06; tRAZ = -Math.sin(t * 2.5 + 1.2) * 0.06;
      tLAX = Math.sin(t * 3) * 0.08; tRAX = Math.sin(t * 3 + 1) * 0.08;
    } else if (isAnim('excited') || currentBehavior === 'excited') {
      tLAZ = Math.PI * 0.4 + Math.sin(t * 7) * 0.2; tRAZ = -Math.PI * 0.4 - Math.sin(t * 7 + 0.5) * 0.2;
    } else if (isAnim('bow')) { tLAX = -0.15; tRAX = -0.15; }
    else if (isAnim('clap')) {
      const cp = Math.sin(t * 10);
      tLAZ = Math.PI * 0.2 + cp * 0.12; tRAZ = -Math.PI * 0.2 - cp * 0.12;
      tLAX = -0.5 + cp * 0.08; tRAX = -0.5 + cp * 0.08;
    } else if (isAnim('thumbsUp')) { tRAZ = -Math.PI * 0.45; tRAX = -0.3; }
    else if (isAnim('shrug')) { tLAZ = Math.PI * 0.3; tRAZ = -Math.PI * 0.3; tLAX = -0.2; tRAX = -0.2; }
    else if (isAnim('cheer')) {
      tLAZ = Math.PI * 0.65 + Math.sin(t * 5) * 0.12; tRAZ = -Math.PI * 0.65 - Math.sin(t * 5 + 0.4) * 0.12;
    } else if (isAnim('crossArms')) { tLAZ = Math.PI * 0.2; tRAZ = -Math.PI * 0.2; tLAX = -0.4; tRAX = -0.4; }
    else if (isAnim('point')) { tRAZ = -Math.PI * 0.35; tRAX = -0.55; }
    else if (isAnim('dance')) {
      tLAZ = Math.PI * 0.3 + Math.sin(t * 4) * 0.3; tRAZ = -Math.PI * 0.3 - Math.sin(t * 4 + Math.PI) * 0.3;
      tLAX = Math.sin(t * 4) * 0.2; tRAX = Math.sin(t * 4 + Math.PI) * 0.2;
    }

    anim.leftArmRotZ = lerp(anim.leftArmRotZ, tLAZ, 0.08);
    anim.rightArmRotZ = lerp(anim.rightArmRotZ, tRAZ, 0.08);
    anim.leftArmRotX = lerp(anim.leftArmRotX, tLAX, 0.08);
    anim.rightArmRotX = lerp(anim.rightArmRotX, tRAX, 0.08);
    if (leftUpperArmNode) { leftUpperArmNode.rotation.z = anim.leftArmRotZ; leftUpperArmNode.rotation.x = anim.leftArmRotX; }
    if (rightUpperArmNode) { rightUpperArmNode.rotation.z = anim.rightArmRotZ; rightUpperArmNode.rotation.x = anim.rightArmRotX; }

    // 呼吸
    if (spineNode && !isAnim('bow') && !isAnim('sleep')) {
      spineNode.rotation.x += Math.sin(t * 1.5) * 0.008;
    }

    vrm.update(delta);
  });

  if (!loaded || !vrmRef.current) return null;
  return <primitive object={vrmRef.current.scene} />;
}
