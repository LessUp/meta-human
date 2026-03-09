// VRM Avatar 组件 — 借鉴 AIRI 项目的模块化架构
// v2：完整对齐 AIRI 功能集（AnimationMixer + spring bone + combineSkeletons + 包围盒定位）
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { VRM, VRMUtils } from "@pixiv/three-vrm";
import { useDigitalHumanStore } from "@/store/digitalHumanStore";
import { useVRMLoader } from "@/hooks/vrm/useVRMLoader";
import { useVRMEmote } from "@/hooks/vrm/useVRMEmote";
import { useVRMBlink } from "@/hooks/vrm/useVRMBlink";
import { useVRMLipSync } from "@/hooks/vrm/useVRMLipSync";
import { useVRMEyeSaccades } from "@/hooks/vrm/useVRMEyeSaccades";
import { createVRMAnimationController } from "@/hooks/vrm/useVRMAnimation";
import type { VRMEmoteController } from "@/hooks/vrm/useVRMEmote";
import type { VRMAnimationController } from "@/hooks/vrm/useVRMAnimation";

interface VRMAvatarProps {
  url: string;
  idleAnimationUrl?: string;
  onLoad?: (vrm: VRM) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

/**
 * 计算模型包围盒 — 参考 AIRI computeBoundingBox
 */
function computeModelBounds(scene: THREE.Object3D) {
  const box = new THREE.Box3();
  const childBox = new THREE.Box3();
  scene.updateMatrixWorld(true);
  scene.traverse((obj) => {
    if (!obj.visible) return;
    const mesh = obj as THREE.Mesh;
    if (!mesh.isMesh || !mesh.geometry) return;
    if (mesh.name.startsWith("VRMC_springBone_collider")) return;
    const geo = mesh.geometry;
    if (!geo.boundingBox) geo.computeBoundingBox();
    childBox.copy(geo.boundingBox!);
    childBox.applyMatrix4(mesh.matrixWorld);
    box.union(childBox);
  });
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  return { size, center };
}

/**
 * 计算骨骼动画目标值（头部 + 身体 + 手臂）
 * 抽取为纯函数，保持 useFrame 干净
 */
function computeSkeletonTargets(
  t: number,
  mouseX: number,
  mouseY: number,
  currentBehavior: string,
  isSpeaking: boolean,
  isAnim: (name: string) => boolean,
) {
  // 头部
  let headRotX = -mouseY * 0.2;
  let headRotY = mouseX * 0.3;
  let headRotZ = 0;
  let spineRotX = 0;
  let spineRotZ = 0;
  let hipsPosY = 0;

  if (isAnim("nod") || currentBehavior === "listening") {
    headRotX = Math.sin(t * 3.5) * 0.2;
    spineRotX = Math.sin(t * 3.5) * 0.03;
  } else if (isAnim("shakeHead")) {
    headRotY = Math.sin(t * 5) * 0.4;
    spineRotZ = Math.sin(t * 5) * 0.02;
  } else if (currentBehavior === "thinking") {
    headRotZ = Math.sin(t * 0.8) * 0.12;
    headRotY = -0.15 + Math.sin(t * 0.5) * 0.08;
    headRotX = 0.05;
  } else if (
    currentBehavior === "greeting" ||
    isAnim("wave") ||
    isAnim("waveHand")
  ) {
    headRotZ = Math.sin(t * 2.5) * 0.1;
    headRotY = 0.1 + Math.sin(t * 3) * 0.05;
    hipsPosY = Math.sin(t * 3) * 0.01;
  } else if (isAnim("bow")) {
    headRotX = -0.3;
    spineRotX = -0.25;
  } else if (isAnim("lookAround")) {
    headRotY = Math.sin(t * 1.2) * 0.5;
    headRotX = Math.sin(t * 2) * 0.1;
  } else if (isAnim("sleep")) {
    headRotX = -0.3 + Math.sin(t * 0.4) * 0.03;
    headRotZ = 0.2;
    spineRotX = -0.1;
  } else if (isAnim("cheer")) {
    headRotX = 0.15;
    headRotZ = Math.sin(t * 7) * 0.1;
    hipsPosY = Math.abs(Math.sin(t * 5)) * 0.08;
  } else if (isAnim("dance")) {
    headRotZ = Math.sin(t * 4) * 0.1;
    hipsPosY = Math.abs(Math.sin(t * 4)) * 0.06;
  } else if (isAnim("excited") || currentBehavior === "excited") {
    hipsPosY = Math.abs(Math.sin(t * 6)) * 0.1;
    headRotZ = Math.sin(t * 8) * 0.08;
  } else if (currentBehavior === "speaking" || isSpeaking) {
    headRotY = mouseX * 0.15 + Math.sin(t * 1.5) * 0.05;
    headRotX = -mouseY * 0.08 + Math.sin(t * 2) * 0.03;
  }

  // 手臂
  let leftArmRotZ = 0,
    rightArmRotZ = 0,
    leftArmRotX = 0,
    rightArmRotX = 0;

  if (currentBehavior === "greeting" || isAnim("wave") || isAnim("waveHand")) {
    rightArmRotZ = -Math.PI * 0.6 + Math.sin(t * 5) * 0.25;
    rightArmRotX = Math.sin(t * 5) * 0.15;
  } else if (isAnim("raiseHand")) {
    rightArmRotZ = -Math.PI * 0.5;
  } else if (currentBehavior === "speaking" || isSpeaking) {
    leftArmRotZ = Math.sin(t * 2.5) * 0.06;
    rightArmRotZ = -Math.sin(t * 2.5 + 1.2) * 0.06;
    leftArmRotX = Math.sin(t * 3) * 0.08;
    rightArmRotX = Math.sin(t * 3 + 1) * 0.08;
  } else if (isAnim("excited") || currentBehavior === "excited") {
    leftArmRotZ = Math.PI * 0.4 + Math.sin(t * 7) * 0.2;
    rightArmRotZ = -Math.PI * 0.4 - Math.sin(t * 7 + 0.5) * 0.2;
  } else if (isAnim("bow")) {
    leftArmRotX = -0.15;
    rightArmRotX = -0.15;
  } else if (isAnim("clap")) {
    const cp = Math.sin(t * 10);
    leftArmRotZ = Math.PI * 0.2 + cp * 0.12;
    rightArmRotZ = -Math.PI * 0.2 - cp * 0.12;
    leftArmRotX = -0.5 + cp * 0.08;
    rightArmRotX = -0.5 + cp * 0.08;
  } else if (isAnim("thumbsUp")) {
    rightArmRotZ = -Math.PI * 0.45;
    rightArmRotX = -0.3;
  } else if (isAnim("shrug")) {
    leftArmRotZ = Math.PI * 0.3;
    rightArmRotZ = -Math.PI * 0.3;
    leftArmRotX = -0.2;
    rightArmRotX = -0.2;
  } else if (isAnim("cheer")) {
    leftArmRotZ = Math.PI * 0.65 + Math.sin(t * 5) * 0.12;
    rightArmRotZ = -Math.PI * 0.65 - Math.sin(t * 5 + 0.4) * 0.12;
  } else if (isAnim("crossArms")) {
    leftArmRotZ = Math.PI * 0.2;
    rightArmRotZ = -Math.PI * 0.2;
    leftArmRotX = -0.4;
    rightArmRotX = -0.4;
  } else if (isAnim("point")) {
    rightArmRotZ = -Math.PI * 0.35;
    rightArmRotX = -0.55;
  } else if (isAnim("dance")) {
    leftArmRotZ = Math.PI * 0.3 + Math.sin(t * 4) * 0.3;
    rightArmRotZ = -Math.PI * 0.3 - Math.sin(t * 4 + Math.PI) * 0.3;
    leftArmRotX = Math.sin(t * 4) * 0.2;
    rightArmRotX = Math.sin(t * 4 + Math.PI) * 0.2;
  }

  return {
    headRotX,
    headRotY,
    headRotZ,
    spineRotX,
    spineRotZ,
    hipsPosY,
    leftArmRotZ,
    rightArmRotZ,
    leftArmRotX,
    rightArmRotX,
  };
}

export default function VRMAvatar({
  url,
  idleAnimationUrl,
  onLoad,
  onError,
  onProgress,
}: VRMAvatarProps) {
  const vrmRef = useRef<VRM | null>(null);
  const [loaded, setLoaded] = useState(false);

  // 模块化控制器 refs
  const emoteRef = useRef<VRMEmoteController | null>(null);
  const animControllerRef = useRef<VRMAnimationController | null>(null);
  const blinkRef = useRef(useVRMBlink());
  const lipSyncRef = useRef(useVRMLipSync());
  const eyeSaccadesRef = useRef(useVRMEyeSaccades());

  // 上一次的表情名，用于检测变化
  const lastExpressionRef = useRef<string>("neutral");

  // 骨骼动画插值状态
  const animState = useRef({
    headRotX: 0,
    headRotY: 0,
    headRotZ: 0,
    spineRotX: 0,
    spineRotZ: 0,
    hipsPosY: 0,
    leftArmRotZ: 0,
    rightArmRotZ: 0,
    leftArmRotX: 0,
    rightArmRotX: 0,
  });

  // 鼠标跟踪
  const mouse = useRef(new THREE.Vector2(0, 0));
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // 使用单例 VRM 加载器
  const loader = useMemo(() => useVRMLoader(), []);

  // 清理函数
  const cleanup = useCallback(() => {
    emoteRef.current?.dispose();
    emoteRef.current = null;
    animControllerRef.current?.dispose();
    animControllerRef.current = null;
    if (vrmRef.current) {
      VRMUtils.deepDispose(vrmRef.current.scene);
      vrmRef.current = null;
    }
  }, []);

  // 加载 VRM 模型
  useEffect(() => {
    let cancelled = false;

    loader.load(
      url,
      (gltf) => {
        if (cancelled) return;

        const vrm = gltf.userData.vrm as VRM;
        if (!vrm) {
          onError?.("文件不是有效的 VRM 模型");
          return;
        }

        // ---- 性能优化（参考 AIRI） ----
        VRMUtils.removeUnnecessaryVertices(gltf.scene);
        // 合并骨骼（AIRI 关键优化，大幅提升性能）
        if (typeof VRMUtils.combineSkeletons === "function") {
          VRMUtils.combineSkeletons(gltf.scene);
        }
        VRMUtils.removeUnnecessaryJoints(gltf.scene);

        // 禁用视锥裁剪（参考 AIRI）
        vrm.scene.traverse((obj: THREE.Object3D) => {
          obj.frustumCulled = false;
        });

        // 材质增强 — 参考 AIRI 的材质遍历设置
        vrm.scene.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh && child.material) {
            const mats = Array.isArray(child.material)
              ? child.material
              : [child.material];
            mats.forEach((mat) => {
              if (
                mat instanceof THREE.MeshStandardMaterial ||
                mat instanceof THREE.MeshPhysicalMaterial
              ) {
                mat.envMapIntensity = 1.0;
                mat.needsUpdate = true;
              }
            });
          }
        });

        // ---- 模型定位（参考 AIRI 包围盒计算） ----
        const { size, center } = computeModelBounds(vrm.scene);
        vrm.scene.position.set(-center.x, -center.y + size.y * 0.05, -center.z);

        // 旋转模型朝向摄像机（VRM0 兼容）
        VRMUtils.rotateVRM0(vrm);

        // 重置 spring bone（参考 AIRI）
        (vrm as VRM).springBoneManager?.reset();
        vrm.scene.updateMatrixWorld(true);

        // ---- 初始化模块化控制器 ----
        emoteRef.current = useVRMEmote(vrm);
        animControllerRef.current = createVRMAnimationController(vrm);

        // 如果提供了闲置动画 URL，加载并播放
        if (idleAnimationUrl) {
          animControllerRef.current
            .loadAndPlay(idleAnimationUrl)
            .catch((err) => {
              console.warn("闲置动画加载失败:", err);
            });
        }

        vrmRef.current = vrm;
        setLoaded(true);
        onLoad?.(vrm);

        console.log("VRM 模型加载成功:", vrm.meta);
        console.log(
          "模型尺寸:",
          size.toArray().map((v) => v.toFixed(2)),
        );
        console.log(
          "可用表情:",
          vrm.expressionManager?.expressions.map((e) => e.expressionName),
        );
        console.log(
          "Spring Bone 数量:",
          vrm.springBoneManager?.joints.size ?? 0,
        );
      },
      (progress) => {
        if (cancelled) return;
        if (progress.total > 0) {
          onProgress?.(Math.round((progress.loaded / progress.total) * 100));
        }
      },
      (error) => {
        if (cancelled) return;
        const msg =
          error instanceof Error ? error.message : "加载 VRM 模型失败";
        console.error("VRM 加载错误:", error);
        onError?.(msg);
      },
    );

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [url, idleAnimationUrl]);

  // ============================================================
  // 每帧更新 — 完整渲染管线（参考 AIRI onBeforeRender 顺序）
  // 顺序：AnimationMixer → 表情 → 眨眼 → 唇形 → 眼球 → 骨骼叠加
  //       → humanoid.update → lookAt.update → expressionManager.update
  //       → springBoneManager.update
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
    const isAnim = (name: string) =>
      currentAnimation === name || currentBehavior === name;

    // 1. AnimationMixer 更新
    animControllerRef.current?.update(delta);

    // 2. 模块化表情系统
    if (emoteRef.current) {
      if (currentExpression !== lastExpressionRef.current) {
        emoteRef.current.setEmotion(currentExpression, intensity);
        lastExpressionRef.current = currentExpression;
      }
      emoteRef.current.update(delta);
    }

    // 3. 自然眨眼
    blinkRef.current.update(vrm, delta);

    // 4. 唇形同步
    lipSyncRef.current.update(vrm, delta, isSpeaking);

    // 5. 空闲眼球微动
    eyeSaccadesRef.current.update(
      vrm,
      {
        x: mouse.current.x * 0.5,
        y: mouse.current.y * 0.3,
        z: -1,
      },
      delta,
    );

    // 6. 骨骼叠加动画
    const targets = computeSkeletonTargets(
      t,
      mouse.current.x,
      mouse.current.y,
      currentBehavior,
      isSpeaking,
      isAnim,
    );

    const headNode = vrm.humanoid.getNormalizedBoneNode("head");
    const spineNode = vrm.humanoid.getNormalizedBoneNode("spine");
    const leftUpperArmNode = vrm.humanoid.getNormalizedBoneNode("leftUpperArm");
    const rightUpperArmNode =
      vrm.humanoid.getNormalizedBoneNode("rightUpperArm");
    const hipsNode = vrm.humanoid.getNormalizedBoneNode("hips");

    anim.headRotX = lerp(anim.headRotX, targets.headRotX, 0.1);
    anim.headRotY = lerp(anim.headRotY, targets.headRotY, 0.1);
    anim.headRotZ = lerp(anim.headRotZ, targets.headRotZ, 0.1);
    if (headNode) {
      headNode.rotation.x = anim.headRotX;
      headNode.rotation.y = anim.headRotY;
      headNode.rotation.z = anim.headRotZ;
    }

    anim.spineRotX = lerp(anim.spineRotX, targets.spineRotX, 0.06);
    anim.spineRotZ = lerp(anim.spineRotZ, targets.spineRotZ, 0.06);
    if (spineNode) {
      spineNode.rotation.x = anim.spineRotX;
      spineNode.rotation.z = anim.spineRotZ;
    }

    anim.hipsPosY = lerp(anim.hipsPosY, targets.hipsPosY, 0.12);
    if (hipsNode) hipsNode.position.y = anim.hipsPosY;

    anim.leftArmRotZ = lerp(anim.leftArmRotZ, targets.leftArmRotZ, 0.08);
    anim.rightArmRotZ = lerp(anim.rightArmRotZ, targets.rightArmRotZ, 0.08);
    anim.leftArmRotX = lerp(anim.leftArmRotX, targets.leftArmRotX, 0.08);
    anim.rightArmRotX = lerp(anim.rightArmRotX, targets.rightArmRotX, 0.08);
    if (leftUpperArmNode) {
      leftUpperArmNode.rotation.z = anim.leftArmRotZ;
      leftUpperArmNode.rotation.x = anim.leftArmRotX;
    }
    if (rightUpperArmNode) {
      rightUpperArmNode.rotation.z = anim.rightArmRotZ;
      rightUpperArmNode.rotation.x = anim.rightArmRotX;
    }

    // 呼吸
    if (spineNode && !isAnim("bow") && !isAnim("sleep")) {
      spineNode.rotation.x += Math.sin(t * 1.5) * 0.008;
    }

    // 7. AIRI 完整更新链
    vrm.humanoid?.update();
    vrm.expressionManager?.update();
    // spring bone 物理模拟（头发/裙摆/配饰自然晃动）
    vrm.springBoneManager?.update(delta);
  });

  if (!loaded || !vrmRef.current) return null;
  return <primitive object={vrmRef.current.scene} />;
}
