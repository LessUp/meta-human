// CyberAvatar — Q版动漫角色 3D 模型（动画逻辑部分）
// 从 DigitalHumanViewer.enhanced.tsx 提取
// 职责：动画状态管理 + useFrame 逻辑
// 几何体 JSX 见 CyberAvatarModel.tsx
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import { useDigitalHumanStore } from "@/store/digitalHumanStore";
import { useMousePosition } from "./useMousePosition";
import { EMOTION_LIGHT_COLORS } from "./materials";
import {
  computeHeadBodyTarget,
  computeArmTarget,
  getRingConfig,
  getLightIntensity,
} from "./animation-config";
import CyberAvatarModel from "./CyberAvatarModel";

// 动画状态类型
export interface CyberAnimState {
  headRotX: number;
  headRotY: number;
  headRotZ: number;
  bodyRotX: number;
  bodyRotZ: number;
  bodyPosY: number;
  mouthOpen: number;
  leftEyeScaleY: number;
  rightEyeScaleY: number;
  leftBrowY: number;
  rightBrowY: number;
  leftBrowRotZ: number;
  rightBrowRotZ: number;
  leftArmRotZ: number;
  rightArmRotZ: number;
  leftArmRotX: number;
  rightArmRotX: number;
  bodyScale: number;
  sideHairSwing: number;
  backHairSwing: number;
  pupilOffsetX: number;
  pupilOffsetY: number;
}

// Refs 收集（传给子模型组件）
export interface CyberAvatarRefs {
  group: React.RefObject<THREE.Group | null>;
  headGroup: React.RefObject<THREE.Group | null>;
  head: React.RefObject<THREE.Mesh | null>;
  leftEye: React.RefObject<THREE.Mesh | null>;
  rightEye: React.RefObject<THREE.Mesh | null>;
  mouth: React.RefObject<THREE.Mesh | null>;
  leftBrow: React.RefObject<THREE.Mesh | null>;
  rightBrow: React.RefObject<THREE.Mesh | null>;
  rings: React.RefObject<THREE.Group | null>;
  body: React.RefObject<THREE.Mesh | null>;
  leftArm: React.RefObject<THREE.Group | null>;
  rightArm: React.RefObject<THREE.Group | null>;
  emotionLight: React.RefObject<THREE.PointLight | null>;
  leftSideHair: React.RefObject<THREE.Mesh | null>;
  rightSideHair: React.RefObject<THREE.Mesh | null>;
  backHair: React.RefObject<THREE.Mesh | null>;
  pupilGroup: React.RefObject<THREE.Group | null>;
  skirt: React.RefObject<THREE.Mesh | null>;
}

export default function CyberAvatar() {
  // 所有 refs
  const refs: CyberAvatarRefs = {
    group: useRef<THREE.Group>(null),
    headGroup: useRef<THREE.Group>(null),
    head: useRef<THREE.Mesh>(null),
    leftEye: useRef<THREE.Mesh>(null),
    rightEye: useRef<THREE.Mesh>(null),
    mouth: useRef<THREE.Mesh>(null),
    leftBrow: useRef<THREE.Mesh>(null),
    rightBrow: useRef<THREE.Mesh>(null),
    rings: useRef<THREE.Group>(null),
    body: useRef<THREE.Mesh>(null),
    leftArm: useRef<THREE.Group>(null),
    rightArm: useRef<THREE.Group>(null),
    emotionLight: useRef<THREE.PointLight>(null),
    leftSideHair: useRef<THREE.Mesh>(null),
    rightSideHair: useRef<THREE.Mesh>(null),
    backHair: useRef<THREE.Mesh>(null),
    pupilGroup: useRef<THREE.Group>(null),
    skirt: useRef<THREE.Mesh>(null),
  };

  const mouse = useMousePosition();

  // 动画状态（通过 ref 保持跨帧连续性）
  const animState = useRef<CyberAnimState>({
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
    sideHairSwing: 0,
    backHairSwing: 0,
    pupilOffsetX: 0,
    pupilOffsetY: 0,
  });

  const {
    currentExpression,
    isSpeaking,
    currentAnimation,
    currentBehavior,
    currentEmotion,
    expressionIntensity,
  } = useDigitalHumanStore();

  // ============================================================
  // 每帧动画更新（核心逻辑，保持 lerp 插值）
  // ============================================================
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const intensity = Math.max(0, Math.min(1, expressionIntensity ?? 1));
    const lerp = THREE.MathUtils.lerp;
    const anim = animState.current;
    const isAnim = (name: string) =>
      currentAnimation === name || currentBehavior === name;

    // ---- 头部 + 身体 ----
    const hbt = computeHeadBodyTarget(
      t,
      mouse.current.x,
      mouse.current.y,
      currentBehavior,
      isSpeaking,
      isAnim,
    );
    anim.headRotX = lerp(anim.headRotX, hbt.headRotX, 0.1);
    anim.headRotY = lerp(anim.headRotY, hbt.headRotY, 0.1);
    anim.headRotZ = lerp(anim.headRotZ, hbt.headRotZ, 0.1);
    anim.bodyRotX = lerp(anim.bodyRotX, hbt.bodyRotX, 0.06);
    anim.bodyRotZ = lerp(anim.bodyRotZ, hbt.bodyRotZ, 0.06);
    anim.bodyPosY = lerp(anim.bodyPosY, hbt.bodyPosY, 0.12);

    if (refs.headGroup.current) {
      refs.headGroup.current.rotation.x = anim.headRotX;
      refs.headGroup.current.rotation.y = anim.headRotY;
      refs.headGroup.current.rotation.z = anim.headRotZ;
    }
    if (refs.group.current) {
      refs.group.current.rotation.x = anim.bodyRotX;
      refs.group.current.rotation.z = anim.bodyRotZ;
      refs.group.current.position.y = anim.bodyPosY;
    }

    // ---- 嘴巴 ----
    let targetMouthOpen = 0;
    if (isSpeaking)
      targetMouthOpen =
        (Math.sin(t * 12) * 0.5 + 0.5) * 0.4 +
        (Math.sin(t * 18 + 1.2) * 0.5 + 0.5) * 0.2;
    if (currentExpression === "smile" || currentExpression === "laugh")
      targetMouthOpen =
        currentExpression === "laugh" ? 0.5 * intensity : 0.15 * intensity;
    else if (currentExpression === "surprise")
      targetMouthOpen = 0.6 * intensity;
    else if (currentExpression === "angry") targetMouthOpen = 0.1 * intensity;
    anim.mouthOpen = lerp(anim.mouthOpen, targetMouthOpen, 0.15);
    if (refs.mouth.current) {
      refs.mouth.current.scale.y = 0.3 + anim.mouthOpen * 2;
      refs.mouth.current.scale.x =
        1 +
        (currentExpression === "smile" || currentExpression === "laugh"
          ? 0.3 * intensity
          : 0);
      refs.mouth.current.position.y = -0.3 - anim.mouthOpen * 0.1;
    }

    // ---- 眼睛 ----
    const blinkCycle = Math.sin(t * 3);
    const isBlinking = blinkCycle > 0.98 || currentExpression === "blink";
    let tLEY = 1,
      tREY = 1;
    if (currentExpression === "smile" || currentExpression === "laugh") {
      tLEY = 0.4;
      tREY = 0.4;
    } else if (currentExpression === "surprise") {
      tLEY = 1.4;
      tREY = 1.4;
    } else if (currentExpression === "sad") {
      tLEY = 0.7;
      tREY = 0.7;
    } else if (currentExpression === "angry") {
      tLEY = 0.6;
      tREY = 0.6;
    }
    tLEY = lerp(1, tLEY, intensity);
    tREY = lerp(1, tREY, intensity);
    if (isBlinking) {
      tLEY = 0.05;
      tREY = 0.05;
    }
    anim.leftEyeScaleY = lerp(
      anim.leftEyeScaleY,
      tLEY,
      isBlinking ? 0.5 : 0.15,
    );
    anim.rightEyeScaleY = lerp(
      anim.rightEyeScaleY,
      tREY,
      isBlinking ? 0.5 : 0.15,
    );
    if (refs.leftEye.current) refs.leftEye.current.scale.y = anim.leftEyeScaleY;
    if (refs.rightEye.current)
      refs.rightEye.current.scale.y = anim.rightEyeScaleY;

    // ---- 眉毛 ----
    let tLBY = 0,
      tRBY = 0;
    if (currentExpression === "surprise") {
      tLBY = 0.08 * intensity;
      tRBY = 0.08 * intensity;
    } else if (currentExpression === "angry") {
      tLBY = -0.06 * intensity;
      tRBY = -0.06 * intensity;
    } else if (currentExpression === "sad") {
      tLBY = 0.04 * intensity;
      tRBY = -0.02 * intensity;
    }
    if (isAnim("cheer") || isAnim("thumbsUp")) {
      tLBY = 0.06;
      tRBY = 0.06;
    } else if (isAnim("sleep")) {
      tLBY = -0.04;
      tRBY = -0.04;
    } else if (isAnim("headTilt")) {
      tLBY = 0.05;
    }
    anim.leftBrowY = lerp(anim.leftBrowY, tLBY, 0.1);
    anim.rightBrowY = lerp(anim.rightBrowY, tRBY, 0.1);
    if (refs.leftBrow.current)
      refs.leftBrow.current.position.y = 0.32 + anim.leftBrowY;
    if (refs.rightBrow.current)
      refs.rightBrow.current.position.y = 0.32 + anim.rightBrowY;

    let tLBRZ = hbt.leftBrowRotZ,
      tRBRZ = hbt.rightBrowRotZ;
    if (isAnim("headTilt")) tRBRZ = -0.2;
    anim.leftBrowRotZ = lerp(anim.leftBrowRotZ, tLBRZ, 0.1);
    anim.rightBrowRotZ = lerp(anim.rightBrowRotZ, tRBRZ, 0.1);
    if (refs.leftBrow.current)
      refs.leftBrow.current.rotation.z = anim.leftBrowRotZ;
    if (refs.rightBrow.current)
      refs.rightBrow.current.rotation.z = anim.rightBrowRotZ;

    // ---- 手臂 ----
    const arm = computeArmTarget(t, currentBehavior, isSpeaking, isAnim);
    anim.leftArmRotZ = lerp(anim.leftArmRotZ, arm.leftArmRotZ, 0.08);
    anim.rightArmRotZ = lerp(anim.rightArmRotZ, arm.rightArmRotZ, 0.08);
    anim.leftArmRotX = lerp(anim.leftArmRotX, arm.leftArmRotX, 0.08);
    anim.rightArmRotX = lerp(anim.rightArmRotX, arm.rightArmRotX, 0.08);
    if (refs.leftArm.current) {
      refs.leftArm.current.rotation.z = anim.leftArmRotZ;
      refs.leftArm.current.rotation.x = anim.leftArmRotX;
    }
    if (refs.rightArm.current) {
      refs.rightArm.current.rotation.z = anim.rightArmRotZ;
      refs.rightArm.current.rotation.x = anim.rightArmRotX;
    }
    if (arm.extraBodyPosY !== undefined)
      anim.bodyPosY = lerp(anim.bodyPosY, arm.extraBodyPosY, 0.12);
    if (arm.extraBodyRotZ !== undefined)
      anim.bodyRotZ = lerp(anim.bodyRotZ, arm.extraBodyRotZ, 0.06);
    if (refs.group.current) {
      refs.group.current.position.y = anim.bodyPosY;
      refs.group.current.rotation.z = anim.bodyRotZ;
    }

    // ---- 呼吸（含肩部微起伏） ----
    const breathPhase = Math.sin(t * 1.5);
    const breathScale = 1 + breathPhase * 0.018;
    if (refs.body.current) {
      refs.body.current.scale.x = breathScale;
      refs.body.current.scale.z = breathScale;
      refs.body.current.scale.y = 1 + breathPhase * 0.005;
    }

    // ---- 裙摆 ----
    if (refs.skirt.current) {
      refs.skirt.current.rotation.z =
        Math.sin(t * 1.6) * 0.015 + anim.bodyRotZ * 0.3;
      refs.skirt.current.rotation.x = Math.sin(t * 1.2) * 0.01;
    }

    // ---- 头发物理（增强惯性） ----
    const hVY = hbt.headRotY - anim.headRotY;
    const hVX = hbt.headRotX - anim.headRotX;
    const sideTarget =
      -hVY * 3.5 + Math.sin(t * 1.8) * 0.025 + Math.sin(t * 3.2) * 0.008;
    const backTarget =
      -hVX * 2.2 + Math.sin(t * 1.3) * 0.02 + Math.sin(t * 2.7) * 0.006;
    anim.sideHairSwing = lerp(anim.sideHairSwing, sideTarget, 0.06);
    anim.backHairSwing = lerp(anim.backHairSwing, backTarget, 0.06);
    if (refs.leftSideHair.current)
      refs.leftSideHair.current.rotation.z = 0.1 + anim.sideHairSwing * 0.9;
    if (refs.rightSideHair.current)
      refs.rightSideHair.current.rotation.z = -0.1 - anim.sideHairSwing * 0.9;
    if (refs.backHair.current)
      refs.backHair.current.rotation.x = 0.15 + anim.backHairSwing * 0.7;

    // ---- 瞳孔 ----
    anim.pupilOffsetX = lerp(anim.pupilOffsetX, mouse.current.x * 0.012, 0.06);
    anim.pupilOffsetY = lerp(anim.pupilOffsetY, -mouse.current.y * 0.008, 0.06);
    if (refs.pupilGroup.current) {
      refs.pupilGroup.current.position.x = anim.pupilOffsetX;
      refs.pupilGroup.current.position.y = anim.pupilOffsetY;
    }

    // ---- 光环 ----
    if (refs.rings.current) {
      const rc = getRingConfig(currentBehavior, isSpeaking, isAnim);
      refs.rings.current.rotation.y += rc.speed * 0.02;
      refs.rings.current.rotation.z =
        Math.sin(t * 0.5) * 0.1 + Math.sin(t * 10) * rc.wobble * 0.05;
    }

    // ---- 情绪灯光 ----
    if (refs.emotionLight.current) {
      const ec =
        EMOTION_LIGHT_COLORS[currentEmotion] || EMOTION_LIGHT_COLORS.neutral;
      refs.emotionLight.current.color.lerp(new THREE.Color(ec), 0.05);
      refs.emotionLight.current.intensity = lerp(
        refs.emotionLight.current.intensity,
        getLightIntensity(isSpeaking, isAnim),
        0.05,
      );
    }
  });

  return (
    <group ref={refs.group}>
      <pointLight
        ref={refs.emotionLight}
        position={[0, 0.5, 2.5]}
        intensity={2}
        color="#a78bfa"
        distance={8}
      />
      <pointLight
        position={[0, -0.05, 2.5]}
        intensity={0.8}
        color="#fff5ee"
        distance={4}
      />
      <pointLight
        position={[0, 0.1, 2.8]}
        intensity={0.3}
        color="#ede9fe"
        distance={3}
      />
      <Float speed={1.8} rotationIntensity={0.08} floatIntensity={0.25}>
        <CyberAvatarModel refs={refs} />
      </Float>
    </group>
  );
}
