import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VRM, VRMUtils } from '@pixiv/three-vrm';
import { useDigitalHumanStore } from '../store/digitalHumanStore';
import { useVRMLoader } from '../hooks/vrm/useVRMLoader';
import { useVRMEmote as createVRMEmote } from '../hooks/vrm/useVRMEmote';
import { useVRMBlink } from '../hooks/vrm/useVRMBlink';
import { useVRMLipSync } from '../hooks/vrm/useVRMLipSync';
import { useVRMEyeSaccades } from '../hooks/vrm/useVRMEyeSaccades';
import type { VRMEmoteController } from '../hooks/vrm/useVRMEmote';

// ============================================================
// VRM Avatar 组件 — 借鉴 AIRI 项目的模块化架构
// ============================================================
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
  const loader = useVRMLoader();

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
        emoteRef.current = createVRMEmote(vrm);

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
  }, [loader, onError, onLoad, onProgress, url]);

  // ============================================================
  // 每帧更新 — 模块化：表情 + 眨眼 + 唇形 + 眼球微动 + 骨骼
  // ============================================================
  useFrame((state, delta) => {
    const vrm = vrmRef.current;
    if (!vrm) return;

    const t = state.clock.elapsedTime;
    const lerp = THREE.MathUtils.lerp;
    const anim = animState.current;

    const {
      currentExpression,
      isSpeaking,
      currentAnimation,
      currentBehavior,
      expressionIntensity,
    } = useDigitalHumanStore.getState();

    const intensity = Math.max(0, Math.min(1, expressionIntensity ?? 1));
    const isAnim = (name: string) => currentAnimation === name || currentBehavior === name;

    // ---- 模块化表情系统（借鉴 AIRI useVRMEmote） ----
    if (emoteRef.current) {
      // 检测表情变化，触发平滑过渡
      if (currentExpression !== lastExpressionRef.current) {
        emoteRef.current.setEmotion(currentExpression, intensity);
        lastExpressionRef.current = currentExpression;
      }
      emoteRef.current.update(delta);
    }

    // ---- 自然眨眼（借鉴 AIRI useBlink） ----
    blinkRef.current.update(vrm, delta);

    // ---- 唇形同步 — winner+runner 算法（借鉴 AIRI useVRMLipSync） ----
    lipSyncRef.current.update(vrm, delta, isSpeaking);

    // ---- 空闲眼球微动（借鉴 AIRI useIdleEyeSaccades） ----
    eyeSaccadesRef.current.update(vrm, {
      x: mouse.current.x * 0.5,
      y: mouse.current.y * 0.3,
      z: -1,
    }, delta);

    // ---- 骨骼动画（保留完整的 16 种动作映射） ----
    const headNode = vrm.humanoid.getNormalizedBoneNode('head');
    const spineNode = vrm.humanoid.getNormalizedBoneNode('spine');
    const leftUpperArmNode = vrm.humanoid.getNormalizedBoneNode('leftUpperArm');
    const rightUpperArmNode = vrm.humanoid.getNormalizedBoneNode('rightUpperArm');
    const hipsNode = vrm.humanoid.getNormalizedBoneNode('hips');

    // ---- 头部目标旋转 ----
    let targetHeadRotY = mouse.current.x * 0.3;
    let targetHeadRotX = -mouse.current.y * 0.2;
    let targetHeadRotZ = 0;
    let targetSpineRotX = 0;
    let targetSpineRotZ = 0;
    let targetHipsPosY = 0;

    if (isAnim('nod') || currentBehavior === 'listening') {
      targetHeadRotX = Math.sin(t * 3.5) * 0.2;
      targetSpineRotX = Math.sin(t * 3.5) * 0.03;
    } else if (isAnim('shakeHead')) {
      targetHeadRotY = Math.sin(t * 5) * 0.4;
      targetSpineRotZ = Math.sin(t * 5) * 0.02;
    } else if (currentBehavior === 'thinking') {
      targetHeadRotZ = Math.sin(t * 0.8) * 0.12;
      targetHeadRotY = -0.15 + Math.sin(t * 0.5) * 0.08;
      targetHeadRotX = 0.05;
    } else if (currentBehavior === 'greeting' || isAnim('wave') || isAnim('waveHand')) {
      targetHeadRotZ = Math.sin(t * 2.5) * 0.1;
      targetHeadRotY = 0.1 + Math.sin(t * 3) * 0.05;
      targetHipsPosY = Math.sin(t * 3) * 0.01;
    } else if (isAnim('bow')) {
      targetHeadRotX = -0.3;
      targetSpineRotX = -0.25;
    } else if (isAnim('lookAround')) {
      targetHeadRotY = Math.sin(t * 1.2) * 0.5;
      targetHeadRotX = Math.sin(t * 2) * 0.1;
    } else if (isAnim('sleep')) {
      targetHeadRotX = -0.3 + Math.sin(t * 0.4) * 0.03;
      targetHeadRotZ = 0.2;
      targetSpineRotX = -0.1;
    } else if (isAnim('cheer')) {
      targetHeadRotX = 0.15;
      targetHeadRotZ = Math.sin(t * 7) * 0.1;
      targetHipsPosY = Math.abs(Math.sin(t * 5)) * 0.08;
    } else if (isAnim('excited') || currentBehavior === 'excited') {
      targetHipsPosY = Math.abs(Math.sin(t * 6)) * 0.1;
      targetHeadRotZ = Math.sin(t * 8) * 0.08;
    } else if (currentBehavior === 'speaking' || isSpeaking) {
      targetHeadRotY = mouse.current.x * 0.15 + Math.sin(t * 1.5) * 0.05;
      targetHeadRotX = -mouse.current.y * 0.08 + Math.sin(t * 2) * 0.03;
    }

    // 平滑插值 — 头部
    const headLerp = 0.1;
    anim.headRotX = lerp(anim.headRotX, targetHeadRotX, headLerp);
    anim.headRotY = lerp(anim.headRotY, targetHeadRotY, headLerp);
    anim.headRotZ = lerp(anim.headRotZ, targetHeadRotZ, headLerp);

    if (headNode) {
      headNode.rotation.x = anim.headRotX;
      headNode.rotation.y = anim.headRotY;
      headNode.rotation.z = anim.headRotZ;
    }

    // 平滑插值 — 脊椎
    anim.spineRotX = lerp(anim.spineRotX, targetSpineRotX, 0.06);
    anim.spineRotZ = lerp(anim.spineRotZ, targetSpineRotZ, 0.06);
    if (spineNode) {
      spineNode.rotation.x = anim.spineRotX;
      spineNode.rotation.z = anim.spineRotZ;
    }

    // 平滑插值 — 臀部位移
    anim.hipsPosY = lerp(anim.hipsPosY, targetHipsPosY, 0.12);
    if (hipsNode) {
      hipsNode.position.y = anim.hipsPosY;
    }

    // ---- 手臂动画 ----
    let targetLeftArmRotZ = 0;
    let targetRightArmRotZ = 0;
    let targetLeftArmRotX = 0;
    let targetRightArmRotX = 0;

    if (currentBehavior === 'greeting' || isAnim('wave') || isAnim('waveHand')) {
      targetRightArmRotZ = -Math.PI * 0.6 + Math.sin(t * 5) * 0.25;
      targetRightArmRotX = Math.sin(t * 5) * 0.15;
    } else if (isAnim('raiseHand')) {
      targetRightArmRotZ = -Math.PI * 0.5;
    } else if (currentBehavior === 'speaking' || isSpeaking) {
      targetLeftArmRotZ = Math.sin(t * 2.5) * 0.06;
      targetRightArmRotZ = -Math.sin(t * 2.5 + 1.2) * 0.06;
      targetLeftArmRotX = Math.sin(t * 3) * 0.08;
      targetRightArmRotX = Math.sin(t * 3 + 1) * 0.08;
    } else if (isAnim('excited') || currentBehavior === 'excited') {
      targetLeftArmRotZ = Math.PI * 0.4 + Math.sin(t * 7) * 0.2;
      targetRightArmRotZ = -Math.PI * 0.4 - Math.sin(t * 7 + 0.5) * 0.2;
    } else if (isAnim('bow')) {
      targetLeftArmRotX = -0.15;
      targetRightArmRotX = -0.15;
    } else if (isAnim('clap')) {
      const clapPhase = Math.sin(t * 10);
      targetLeftArmRotZ = Math.PI * 0.2 + clapPhase * 0.12;
      targetRightArmRotZ = -Math.PI * 0.2 - clapPhase * 0.12;
      targetLeftArmRotX = -0.5 + clapPhase * 0.08;
      targetRightArmRotX = -0.5 + clapPhase * 0.08;
    } else if (isAnim('thumbsUp')) {
      targetRightArmRotZ = -Math.PI * 0.45;
      targetRightArmRotX = -0.3;
    } else if (isAnim('shrug')) {
      targetLeftArmRotZ = Math.PI * 0.3;
      targetRightArmRotZ = -Math.PI * 0.3;
      targetLeftArmRotX = -0.2;
      targetRightArmRotX = -0.2;
    } else if (isAnim('cheer')) {
      targetLeftArmRotZ = Math.PI * 0.65 + Math.sin(t * 5) * 0.12;
      targetRightArmRotZ = -Math.PI * 0.65 - Math.sin(t * 5 + 0.4) * 0.12;
    } else if (isAnim('crossArms')) {
      targetLeftArmRotZ = Math.PI * 0.2;
      targetRightArmRotZ = -Math.PI * 0.2;
      targetLeftArmRotX = -0.4;
      targetRightArmRotX = -0.4;
    } else if (isAnim('point')) {
      targetRightArmRotZ = -Math.PI * 0.35;
      targetRightArmRotX = -0.55;
    } else if (isAnim('dance')) {
      targetLeftArmRotZ = Math.PI * 0.3 + Math.sin(t * 4) * 0.3;
      targetRightArmRotZ = -Math.PI * 0.3 - Math.sin(t * 4 + Math.PI) * 0.3;
      targetLeftArmRotX = Math.sin(t * 4) * 0.2;
      targetRightArmRotX = Math.sin(t * 4 + Math.PI) * 0.2;
      targetHipsPosY = Math.abs(Math.sin(t * 4)) * 0.06;
    }

    const armLerp = 0.08;
    anim.leftArmRotZ = lerp(anim.leftArmRotZ, targetLeftArmRotZ, armLerp);
    anim.rightArmRotZ = lerp(anim.rightArmRotZ, targetRightArmRotZ, armLerp);
    anim.leftArmRotX = lerp(anim.leftArmRotX, targetLeftArmRotX, armLerp);
    anim.rightArmRotX = lerp(anim.rightArmRotX, targetRightArmRotX, armLerp);

    if (leftUpperArmNode) {
      leftUpperArmNode.rotation.z = anim.leftArmRotZ;
      leftUpperArmNode.rotation.x = anim.leftArmRotX;
    }
    if (rightUpperArmNode) {
      rightUpperArmNode.rotation.z = anim.rightArmRotZ;
      rightUpperArmNode.rotation.x = anim.rightArmRotX;
    }

    // ---- 呼吸动画（微妙的脊椎起伏） ----
    if (spineNode && !isAnim('bow') && !isAnim('sleep')) {
      spineNode.rotation.x += Math.sin(t * 1.5) * 0.008;
    }

    // 更新 VRM（弹簧骨、约束等）
    vrm.update(delta);
  });

  if (!loaded || !vrmRef.current) return null;

  return <primitive object={vrmRef.current.scene} />;
}
