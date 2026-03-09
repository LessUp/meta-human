// CyberAvatarModel — Q版角色几何体 JSX（纯渲染，无逻辑）
// 从 DigitalHumanViewer.enhanced.tsx 提取
// 职责：仅包含 mesh 几何结构和共享材质定义
import { useMemo } from "react";
import * as THREE from "three";
import type { CyberAvatarRefs } from "./CyberAvatar";

interface Props {
  refs: CyberAvatarRefs;
}

export default function CyberAvatarModel({ refs }: Props) {
  // 共享材质（useMemo 避免重复创建）— v2 增强版
  const skinMat = useMemo(
    () => (
      <meshPhysicalMaterial
        color="#fdd9c4"
        metalness={0.0}
        roughness={0.42}
        clearcoat={0.25}
        clearcoatRoughness={0.3}
        envMapIntensity={0.7}
        sheen={0.5}
        sheenColor="#ffb8c6"
        transmission={0.08}
        thickness={1.0}
      />
    ),
    [],
  );
  const skinShadowMat = useMemo(
    () => (
      <meshPhysicalMaterial
        color="#f0c4aa"
        metalness={0.0}
        roughness={0.5}
        clearcoat={0.15}
        sheen={0.3}
        sheenColor="#e8a090"
      />
    ),
    [],
  );
  const clothMat = useMemo(
    () => (
      <meshPhysicalMaterial
        color="#f0f4ff"
        metalness={0.02}
        roughness={0.55}
        clearcoat={0.18}
        clearcoatRoughness={0.35}
        envMapIntensity={0.7}
        sheen={0.15}
        sheenColor="#ddd6fe"
      />
    ),
    [],
  );
  const clothAccentMat = useMemo(
    () => (
      <meshPhysicalMaterial
        color="#7b8fba"
        metalness={0.06}
        roughness={0.42}
        clearcoat={0.3}
        clearcoatRoughness={0.25}
        envMapIntensity={0.9}
      />
    ),
    [],
  );
  const clothLineMat = useMemo(
    () => (
      <meshPhysicalMaterial
        color="#98aed0"
        metalness={0.04}
        roughness={0.4}
        clearcoat={0.2}
      />
    ),
    [],
  );
  const hairMat = useMemo(
    () => (
      <meshPhysicalMaterial
        color="#2e1f3e"
        metalness={0.1}
        roughness={0.28}
        clearcoat={0.75}
        clearcoatRoughness={0.08}
        envMapIntensity={1.6}
        sheen={0.55}
        sheenColor="#a78bfa"
      />
    ),
    [],
  );
  const hairHighlightMat = useMemo(
    () => (
      <meshPhysicalMaterial
        color="#6d4c9e"
        metalness={0.08}
        roughness={0.25}
        clearcoat={0.75}
        clearcoatRoughness={0.08}
        envMapIntensity={2.0}
        sheen={0.6}
        sheenColor="#d8b4fe"
      />
    ),
    [],
  );
  const hairTipMat = useMemo(
    () => (
      <meshPhysicalMaterial
        color="#9b72cf"
        metalness={0.06}
        roughness={0.3}
        clearcoat={0.6}
        envMapIntensity={1.5}
        sheen={0.5}
        sheenColor="#e9d5ff"
      />
    ),
    [],
  );
  const eyeWhiteMat = useMemo(
    () => (
      <meshStandardMaterial color="#f8fafc" metalness={0.0} roughness={0.12} />
    ),
    [],
  );
  const blushMat = useMemo(
    () => <meshStandardMaterial color="#f9a8d4" transparent opacity={0.22} />,
    [],
  );
  const sockMat = useMemo(
    () => (
      <meshPhysicalMaterial
        color="#f8f0ff"
        metalness={0.0}
        roughness={0.65}
        sheen={0.2}
        sheenColor="#e8dff5"
      />
    ),
    [],
  );
  const shoeMat = useMemo(
    () => (
      <meshPhysicalMaterial
        color="#2e1f3e"
        metalness={0.12}
        roughness={0.35}
        clearcoat={0.4}
        clearcoatRoughness={0.2}
      />
    ),
    [],
  );
  const glowSoft = useMemo(
    () => (
      <meshStandardMaterial
        color="#c4b5fd"
        emissive="#c4b5fd"
        emissiveIntensity={1.5}
        toneMapped={false}
      />
    ),
    [],
  );
  const glowPink = useMemo(
    () => (
      <meshStandardMaterial
        color="#f9a8d4"
        emissive="#f9a8d4"
        emissiveIntensity={1.2}
        toneMapped={false}
      />
    ),
    [],
  );
  const glowWhite = useMemo(() => <meshBasicMaterial color="#ffffff" />, []);
  const goldMat = useMemo(
    () => (
      <meshPhysicalMaterial
        color="#e8b84b"
        metalness={0.85}
        roughness={0.15}
        clearcoat={0.9}
        envMapIntensity={2.0}
      />
    ),
    [],
  );

  return (
    <>
      {/* ========== 头部组（独立旋转） ========== */}
      <group ref={refs.headGroup}>
        {/* 头部主体 */}
        <mesh ref={refs.head} position={[0, 0, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.72, 32, 32]} />
          {skinMat}
        </mesh>
        {/* 下颌（微妙阴影色差） */}
        <mesh position={[0, -0.32, 0.1]} castShadow scale={[0.78, 0.55, 0.78]}>
          <sphereGeometry args={[0.55, 20, 20]} />
          {skinShadowMat}
        </mesh>
        {/* 腮红（扩大面积、更柔和） */}
        <mesh position={[-0.33, -0.14, 0.54]} scale={[1.15, 0.55, 0.12]}>
          <sphereGeometry args={[0.1, 10, 10]} />
          {blushMat}
        </mesh>
        <mesh position={[0.33, -0.14, 0.54]} scale={[1.15, 0.55, 0.12]}>
          <sphereGeometry args={[0.1, 10, 10]} />
          {blushMat}
        </mesh>
        {/* 鼻子 */}
        <mesh position={[0, -0.08, 0.7]} scale={[0.5, 0.6, 0.35]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          {skinMat}
        </mesh>
        {/* 鼻尖高光 */}
        <mesh position={[0, -0.06, 0.72]} scale={[0.3, 0.25, 0.15]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshBasicMaterial color="#fff5ee" transparent opacity={0.35} />
        </mesh>
        {/* 鼻梁高光 — 提升立体感 */}
        <mesh position={[0, 0.02, 0.71]} scale={[0.15, 0.5, 0.08]}>
          <capsuleGeometry args={[0.012, 0.06, 3, 4]} />
          <meshBasicMaterial color="#fff8f0" transparent opacity={0.2} />
        </mesh>
        {/* 额头高光 — T区光泽 */}
        <mesh position={[0, 0.22, 0.62]} scale={[0.5, 0.35, 0.08]}>
          <sphereGeometry args={[0.08, 8, 6]} />
          <meshBasicMaterial color="#fff5ee" transparent opacity={0.15} />
        </mesh>
        {/* 下巴尖高光 */}
        <mesh position={[0, -0.52, 0.42]} scale={[0.25, 0.2, 0.1]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshBasicMaterial color="#fff5ee" transparent opacity={0.18} />
        </mesh>

        {/* ========== 头发 ========== */}
        <mesh position={[0, 0.1, -0.1]} scale={[1.08, 1.12, 1.02]}>
          <sphereGeometry args={[0.72, 24, 24]} />
          {hairMat}
        </mesh>
        {/* 呆毛（双层：主体+尖端渐变） */}
        <mesh
          position={[0.08, 0.82, 0.12]}
          rotation={[0.3, 0, 0.15]}
          scale={[0.07, 0.3, 0.05]}
        >
          <capsuleGeometry args={[0.15, 0.5, 3, 6]} />
          {hairHighlightMat}
        </mesh>
        <mesh
          position={[0.1, 0.98, 0.16]}
          rotation={[0.35, 0, 0.2]}
          scale={[0.04, 0.12, 0.03]}
        >
          <capsuleGeometry args={[0.08, 0.25, 3, 4]} />
          {hairTipMat}
        </mesh>
        {/* 第二根呆毛（较小） */}
        <mesh
          position={[-0.04, 0.78, 0.18]}
          rotation={[0.4, 0, -0.25]}
          scale={[0.04, 0.18, 0.03]}
        >
          <capsuleGeometry args={[0.1, 0.3, 3, 4]} />
          {hairHighlightMat}
        </mesh>
        {/* 刘海 */}
        <mesh
          position={[0, 0.12, 0.56]}
          rotation={[0.5, 0, 0]}
          scale={[0.82, 0.55, 0.3]}
        >
          <sphereGeometry args={[0.48, 12, 12]} />
          {hairMat}
        </mesh>
        <mesh
          position={[-0.3, 0.05, 0.48]}
          rotation={[0.3, 0.12, 0.1]}
          scale={[0.42, 0.55, 0.22]}
        >
          <sphereGeometry args={[0.38, 10, 10]} />
          {hairMat}
        </mesh>
        <mesh
          position={[0.3, 0.05, 0.48]}
          rotation={[0.3, -0.12, -0.1]}
          scale={[0.42, 0.55, 0.22]}
        >
          <sphereGeometry args={[0.38, 10, 10]} />
          {hairMat}
        </mesh>
        {/* 侧发 */}
        <mesh
          ref={refs.leftSideHair}
          position={[-0.62, -0.1, -0.04]}
          rotation={[0.05, 0, 0.1]}
          scale={[0.32, 0.9, 0.35]}
        >
          <capsuleGeometry args={[0.18, 0.55, 6, 10]} />
          {hairMat}
        </mesh>
        <mesh
          ref={refs.rightSideHair}
          position={[0.62, -0.1, -0.04]}
          rotation={[0.05, 0, -0.1]}
          scale={[0.32, 0.9, 0.35]}
        >
          <capsuleGeometry args={[0.18, 0.55, 6, 10]} />
          {hairMat}
        </mesh>
        {/* 后发尾 */}
        <mesh
          ref={refs.backHair}
          position={[0, -0.38, -0.42]}
          rotation={[0.15, 0, 0]}
          scale={[0.52, 0.85, 0.32]}
        >
          <capsuleGeometry args={[0.22, 0.55, 6, 10]} />
          {hairMat}
        </mesh>
        <mesh
          position={[-0.15, -0.5, -0.4]}
          rotation={[0.12, 0.08, 0.06]}
          scale={[0.22, 0.45, 0.18]}
        >
          <capsuleGeometry args={[0.14, 0.3, 4, 8]} />
          {hairMat}
        </mesh>
        <mesh
          position={[0.15, -0.5, -0.4]}
          rotation={[0.12, -0.08, -0.06]}
          scale={[0.22, 0.45, 0.18]}
        >
          <capsuleGeometry args={[0.14, 0.3, 4, 8]} />
          {hairMat}
        </mesh>
        {/* 天使光环 */}
        <mesh
          position={[0, 0.58, 0.15]}
          rotation={[0.2, 0, 0]}
          scale={[0.6, 0.07, 0.25]}
        >
          <sphereGeometry args={[0.48, 10, 10]} />
          {hairHighlightMat}
        </mesh>
        {/* 左侧发饰蝴蝶结 */}
        <mesh
          position={[-0.58, 0.28, 0.1]}
          rotation={[0, 0.3, 0.35]}
          scale={[0.8, 0.5, 0.35]}
        >
          <sphereGeometry args={[0.08, 6, 6]} />
          {glowPink}
        </mesh>
        <mesh
          position={[-0.48, 0.28, 0.1]}
          rotation={[0, 0.3, 0.25]}
          scale={[0.8, 0.5, 0.35]}
        >
          <sphereGeometry args={[0.08, 6, 6]} />
          {glowPink}
        </mesh>
        {/* 左侧发夹金色中心结 */}
        <mesh position={[-0.53, 0.28, 0.12]}>
          <sphereGeometry args={[0.022, 6, 6]} />
          {goldMat}
        </mesh>
        {/* 右侧星星发夹 */}
        <mesh position={[0.53, 0.28, 0.1]} rotation={[0, -0.3, -0.3]}>
          <octahedronGeometry args={[0.04, 0]} />
          {glowSoft}
        </mesh>
        {/* 右侧发夹金色底座 */}
        <mesh position={[0.53, 0.25, 0.08]} rotation={[0, -0.3, 0]}>
          <capsuleGeometry args={[0.015, 0.06, 3, 6]} />
          {goldMat}
        </mesh>
        {/* 蝴蝶结中心珠 */}
        <mesh position={[-0.53, 0.28, 0.14]}>
          <sphereGeometry args={[0.022, 8, 8]} />
          {glowWhite}
        </mesh>
        {/* 侧发尖端渐变 */}
        <mesh position={[-0.63, -0.55, -0.04]} scale={[0.18, 0.2, 0.2]}>
          <sphereGeometry args={[0.14, 6, 6]} />
          {hairTipMat}
        </mesh>
        <mesh position={[0.63, -0.55, -0.04]} scale={[0.18, 0.2, 0.2]}>
          <sphereGeometry args={[0.14, 6, 6]} />
          {hairTipMat}
        </mesh>
        {/* 后发尾尖端渐变 */}
        <mesh position={[0, -0.72, -0.42]} scale={[0.35, 0.18, 0.2]}>
          <sphereGeometry args={[0.16, 6, 6]} />
          {hairTipMat}
        </mesh>
        {/* 刘海内层高光 */}
        <mesh
          position={[0, 0.15, 0.58]}
          rotation={[0.45, 0, 0]}
          scale={[0.6, 0.32, 0.1]}
        >
          <sphereGeometry args={[0.35, 8, 8]} />
          {hairHighlightMat}
        </mesh>

        {/* ========== 眼睛 ========== */}
        <group position={[0, -0.02, 0.58]}>
          {/* 眼影（上眼着淡紫色阴影） */}
          <mesh position={[-0.23, 0.06, 0.04]} scale={[1.85, 0.6, 0.3]}>
            <sphereGeometry args={[0.1, 10, 10]} />
            <meshStandardMaterial color="#d8b4fe" transparent opacity={0.12} />
          </mesh>
          <mesh position={[0.23, 0.06, 0.04]} scale={[1.85, 0.6, 0.3]}>
            <sphereGeometry args={[0.1, 10, 10]} />
            <meshStandardMaterial color="#d8b4fe" transparent opacity={0.12} />
          </mesh>
          {/* 巩膜 */}
          <mesh
            ref={refs.leftEye}
            position={[-0.23, 0, 0.06]}
            scale={[1.7, 1.5, 0.45]}
          >
            <sphereGeometry args={[0.13, 16, 16]} />
            {eyeWhiteMat}
          </mesh>
          <mesh
            ref={refs.rightEye}
            position={[0.23, 0, 0.06]}
            scale={[1.7, 1.5, 0.45]}
          >
            <sphereGeometry args={[0.13, 16, 16]} />
            {eyeWhiteMat}
          </mesh>
          {/* 虹膜+瞳孔（跟随鼠标） */}
          <group ref={refs.pupilGroup}>
            <mesh position={[-0.23, -0.02, 0.09]} scale={[1.5, 1.45, 0.24]}>
              <sphereGeometry args={[0.09, 16, 16]} />
              <meshStandardMaterial
                color="#4c1d95"
                emissive="#5b21b6"
                emissiveIntensity={0.3}
              />
            </mesh>
            <mesh position={[0.23, -0.02, 0.09]} scale={[1.5, 1.45, 0.24]}>
              <sphereGeometry args={[0.09, 16, 16]} />
              <meshStandardMaterial
                color="#4c1d95"
                emissive="#5b21b6"
                emissiveIntensity={0.3}
              />
            </mesh>
            <mesh position={[-0.23, -0.02, 0.1]} scale={[1.2, 1.2, 0.18]}>
              <sphereGeometry args={[0.065, 12, 12]} />
              <meshStandardMaterial
                color="#7c3aed"
                emissive="#a78bfa"
                emissiveIntensity={0.5}
              />
            </mesh>
            <mesh position={[0.23, -0.02, 0.1]} scale={[1.2, 1.2, 0.18]}>
              <sphereGeometry args={[0.065, 12, 12]} />
              <meshStandardMaterial
                color="#7c3aed"
                emissive="#a78bfa"
                emissiveIntensity={0.5}
              />
            </mesh>
            <mesh position={[-0.23, -0.02, 0.115]} scale={[1, 1, 0.12]}>
              <sphereGeometry args={[0.035, 10, 10]} />
              <meshStandardMaterial
                color="#0f0320"
                emissive="#7c3aed"
                emissiveIntensity={1.0}
                toneMapped={false}
              />
            </mesh>
            <mesh position={[0.23, -0.02, 0.115]} scale={[1, 1, 0.12]}>
              <sphereGeometry args={[0.035, 10, 10]} />
              <meshStandardMaterial
                color="#0f0320"
                emissive="#7c3aed"
                emissiveIntensity={1.0}
                toneMapped={false}
              />
            </mesh>
          </group>
          {/* 高光 */}
          <mesh position={[-0.19, 0.05, 0.13]}>
            <sphereGeometry args={[0.032, 6, 6]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.27, 0.05, 0.13]}>
            <sphereGeometry args={[0.032, 6, 6]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[-0.27, -0.04, 0.12]}>
            <sphereGeometry args={[0.015, 4, 4]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.19, -0.04, 0.12]}>
            <sphereGeometry args={[0.015, 4, 4]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          {/* 虹膜内发光环（渐变效果） */}
          <mesh
            position={[-0.23, -0.02, 0.105]}
            rotation={[0, 0, 0]}
            scale={[1.35, 1.3, 0.06]}
          >
            <torusGeometry args={[0.055, 0.012, 8, 24]} />
            <meshStandardMaterial
              color="#c084fc"
              emissive="#a855f7"
              emissiveIntensity={0.8}
              transparent
              opacity={0.6}
              toneMapped={false}
            />
          </mesh>
          <mesh
            position={[0.23, -0.02, 0.105]}
            rotation={[0, 0, 0]}
            scale={[1.35, 1.3, 0.06]}
          >
            <torusGeometry args={[0.055, 0.012, 8, 24]} />
            <meshStandardMaterial
              color="#c084fc"
              emissive="#a855f7"
              emissiveIntensity={0.8}
              transparent
              opacity={0.6}
              toneMapped={false}
            />
          </mesh>
          {/* 底部反射弧 */}
          <mesh position={[-0.23, -0.08, 0.11]} scale={[1.2, 0.35, 0.08]}>
            <sphereGeometry args={[0.06, 8, 6]} />
            <meshBasicMaterial color="#e0d4ff" transparent opacity={0.4} />
          </mesh>
          <mesh position={[0.23, -0.08, 0.11]} scale={[1.2, 0.35, 0.08]}>
            <sphereGeometry args={[0.06, 8, 6]} />
            <meshBasicMaterial color="#e0d4ff" transparent opacity={0.4} />
          </mesh>
          {/* 上睫毛 */}
          <mesh
            position={[-0.23, 0.11, 0.08]}
            rotation={[0, 0, 0.05]}
            scale={[2.0, 0.3, 0.14]}
          >
            <capsuleGeometry args={[0.04, 0.08, 3, 6]} />
            <meshBasicMaterial color="#1a0e30" />
          </mesh>
          <mesh
            position={[0.23, 0.11, 0.08]}
            rotation={[0, 0, -0.05]}
            scale={[2.0, 0.3, 0.14]}
          >
            <capsuleGeometry args={[0.04, 0.08, 3, 6]} />
            <meshBasicMaterial color="#1a0e30" />
          </mesh>
          {/* 下睫毛（中段） */}
          <mesh
            position={[-0.23, -0.1, 0.08]}
            rotation={[0, 0, 0.03]}
            scale={[1.4, 0.15, 0.08]}
          >
            <capsuleGeometry args={[0.03, 0.06, 3, 4]} />
            <meshBasicMaterial color="#2d1b4e" transparent opacity={0.6} />
          </mesh>
          <mesh
            position={[0.23, -0.1, 0.08]}
            rotation={[0, 0, -0.03]}
            scale={[1.4, 0.15, 0.08]}
          >
            <capsuleGeometry args={[0.03, 0.06, 3, 4]} />
            <meshBasicMaterial color="#2d1b4e" transparent opacity={0.6} />
          </mesh>
          {/* 外眼角睫毛（纤长） */}
          <mesh
            position={[-0.33, 0.06, 0.06]}
            rotation={[0, 0, 0.25]}
            scale={[0.8, 0.2, 0.1]}
          >
            <capsuleGeometry args={[0.02, 0.05, 3, 4]} />
            <meshBasicMaterial color="#1a0e30" transparent opacity={0.8} />
          </mesh>
          <mesh
            position={[0.33, 0.06, 0.06]}
            rotation={[0, 0, -0.25]}
            scale={[0.8, 0.2, 0.1]}
          >
            <capsuleGeometry args={[0.02, 0.05, 3, 4]} />
            <meshBasicMaterial color="#1a0e30" transparent opacity={0.8} />
          </mesh>
          {/* 内眼角细睫毛 */}
          <mesh
            position={[-0.14, 0.04, 0.07]}
            rotation={[0, 0, -0.15]}
            scale={[0.5, 0.15, 0.08]}
          >
            <capsuleGeometry args={[0.015, 0.03, 3, 4]} />
            <meshBasicMaterial color="#2d1b4e" transparent opacity={0.5} />
          </mesh>
          <mesh
            position={[0.14, 0.04, 0.07]}
            rotation={[0, 0, 0.15]}
            scale={[0.5, 0.15, 0.08]}
          >
            <capsuleGeometry args={[0.015, 0.03, 3, 4]} />
            <meshBasicMaterial color="#2d1b4e" transparent opacity={0.5} />
          </mesh>
        </group>

        {/* ========== 眉毛 ========== */}
        <group position={[0, 0.04, 0.58]}>
          <mesh
            ref={refs.leftBrow}
            position={[-0.26, 0.32, 0]}
            rotation={[0, 0, 0.1]}
          >
            <capsuleGeometry args={[0.018, 0.14, 4, 8]} />
            {hairMat}
          </mesh>
          <mesh
            ref={refs.rightBrow}
            position={[0.26, 0.32, 0]}
            rotation={[0, 0, -0.1]}
          >
            <capsuleGeometry args={[0.018, 0.14, 4, 8]} />
            {hairMat}
          </mesh>
        </group>

        {/* ========== 嘴巴 ========== */}
        <mesh
          ref={refs.mouth}
          position={[0, -0.35, 0.64]}
          rotation={[0.15, 0, 0]}
        >
          <torusGeometry args={[0.055, 0.014, 6, 12, Math.PI]} />
          <meshStandardMaterial
            color="#c4607e"
            emissive="#e8a0bf"
            emissiveIntensity={0.3}
          />
        </mesh>
        {/* 上唇高光 */}
        <mesh position={[0, -0.3, 0.67]} scale={[0.6, 0.15, 0.08]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshBasicMaterial color="#fce4ec" transparent opacity={0.3} />
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
        {/* 耳内阴影 */}
        <mesh position={[0.69, -0.06, -0.02]} scale={[0.08, 0.16, 0.1]}>
          <sphereGeometry args={[0.14, 6, 6]} />
          {skinShadowMat}
        </mesh>
        <mesh position={[-0.69, -0.06, -0.02]} scale={[0.08, 0.16, 0.1]}>
          <sphereGeometry args={[0.14, 6, 6]} />
          {skinShadowMat}
        </mesh>
        {/* 星星耳饰 */}
        <mesh position={[0.72, -0.22, 0.02]} scale={[0.5, 0.5, 0.3]}>
          <octahedronGeometry args={[0.03, 0]} />
          {glowSoft}
        </mesh>
        <mesh position={[-0.72, -0.22, 0.02]} scale={[0.5, 0.5, 0.3]}>
          <octahedronGeometry args={[0.03, 0]} />
          {glowSoft}
        </mesh>
      </group>

      {/* ========== 脖子 + 项链 ========== */}
      <mesh position={[0, -0.68, 0.02]}>
        <cylinderGeometry args={[0.13, 0.15, 0.25, 24]} />
        {skinMat}
      </mesh>
      {/* 项链主链（金色） */}
      <mesh position={[0, -0.58, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.16, 0.006, 8, 32]} />
        {goldMat}
      </mesh>
      {/* 项链内层装饰环 */}
      <mesh position={[0, -0.6, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.155, 0.003, 6, 32]} />
        {glowSoft}
      </mesh>
      {/* 吊坠底座（金色小环） */}
      <mesh position={[0, -0.66, 0.165]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.012, 0.003, 6, 12]} />
        {goldMat}
      </mesh>
      {/* 吊坠宝石 */}
      <mesh position={[0, -0.7, 0.165]}>
        <octahedronGeometry args={[0.022, 0]} />
        <meshPhysicalMaterial
          color="#a78bfa"
          metalness={0.1}
          roughness={0.05}
          clearcoat={1.0}
          envMapIntensity={3.0}
          transmission={0.4}
          thickness={0.5}
          ior={2.4}
        />
      </mesh>

      {/* ========== 身体 ========== */}
      <group>
        <mesh position={[0, -0.82, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.12, 0.2, 16]} />
          <meshStandardMaterial
            color="#d4a690"
            transparent
            opacity={0.15}
            side={2}
          />
        </mesh>
        <mesh ref={refs.body} position={[0, -1.35, 0]} castShadow>
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
        {/* 水手领 */}
        <mesh
          position={[0, -0.92, 0.22]}
          rotation={[0.35, 0, 0]}
          scale={[0.95, 0.48, 0.42]}
        >
          <sphereGeometry args={[0.22, 10, 10]} />
          {clothMat}
        </mesh>
        <mesh
          position={[0, -0.88, -0.16]}
          rotation={[-0.2, 0, 0]}
          scale={[0.9, 0.38, 0.38]}
        >
          <sphereGeometry args={[0.22, 8, 8]} />
          {clothMat}
        </mesh>
        {/* 领口蓝色边线 */}
        <mesh
          position={[0, -0.85, 0.3]}
          rotation={[0.35, 0, 0]}
          scale={[0.88, 0.02, 0.35]}
        >
          <sphereGeometry args={[0.22, 8, 4]} />
          {clothAccentMat}
        </mesh>
        <mesh
          position={[0, -0.82, -0.22]}
          rotation={[-0.2, 0, 0]}
          scale={[0.82, 0.02, 0.3]}
        >
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
        <mesh
          position={[-0.05, -1.02, 0.3]}
          rotation={[0, 0, 0.45]}
          scale={[0.9, 0.45, 0.4]}
        >
          <sphereGeometry args={[0.05, 6, 6]} />
          {glowPink}
        </mesh>
        <mesh
          position={[0.05, -1.02, 0.3]}
          rotation={[0, 0, -0.45]}
          scale={[0.9, 0.45, 0.4]}
        >
          <sphereGeometry args={[0.05, 6, 6]} />
          {glowPink}
        </mesh>
        {/* 蝴蝶结金色中心结 */}
        <mesh position={[0, -1.02, 0.32]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          {goldMat}
        </mesh>
        {/* 腰线 */}
        <mesh position={[0, -1.62, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.3, 0.018, 6, 24]} />
          {clothAccentMat}
        </mesh>
        <mesh position={[0, -1.62, 0.27]} scale={[0.6, 0.35, 0.3]}>
          <sphereGeometry args={[0.06, 6, 6]} />
          {clothAccentMat}
        </mesh>
        {/* 缎带垂尾（加长分叉） */}
        <mesh
          position={[-0.03, -1.74, 0.25]}
          rotation={[0, 0, 0.08]}
          scale={[0.06, 0.3, 0.04]}
        >
          <capsuleGeometry args={[0.06, 0.22, 3, 6]} />
          {glowPink}
        </mesh>
        <mesh
          position={[0.03, -1.74, 0.25]}
          rotation={[0, 0, -0.08]}
          scale={[0.06, 0.3, 0.04]}
        >
          <capsuleGeometry args={[0.06, 0.22, 3, 6]} />
          {glowPink}
        </mesh>
        {/* 裙摆 */}
        <mesh ref={refs.skirt} position={[0, -1.88, 0]} castShadow>
          <cylinderGeometry args={[0.32, 0.58, 0.58, 20]} />
          {clothMat}
        </mesh>
        <mesh position={[0, -2.12, 0]}>
          <cylinderGeometry args={[0.53, 0.6, 0.15, 20]} />
          {clothMat}
        </mesh>
        {/* 裙摆褶皱（8条加密） */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <mesh
            key={`pleat-${i}`}
            position={[
              Math.sin((i * Math.PI) / 4) * 0.42,
              -1.95,
              Math.cos((i * Math.PI) / 4) * 0.42,
            ]}
            rotation={[0, (-i * Math.PI) / 4, 0]}
          >
            <boxGeometry args={[0.006, 0.35, 0.004]} />
            <meshStandardMaterial
              color="#d4d4f7"
              transparent
              opacity={i % 2 === 0 ? 0.18 : 0.1}
            />
          </mesh>
        ))}
        <mesh position={[0, -2.14, 0]}>
          <cylinderGeometry args={[0.56, 0.58, 0.04, 20]} />
          <meshStandardMaterial color="#ddd6fe" transparent opacity={0.3} />
        </mesh>
        <mesh position={[0, -2.16, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.57, 0.01, 6, 32]} />
          {glowSoft}
        </mesh>
      </group>

      {/* ========== 手臂 + 手链 + 手指 ========== */}
      <group ref={refs.leftArm} position={[0.42, -0.98, 0]}>
        {/* 上臂 */}
        <mesh position={[0, -0.22, 0]}>
          <capsuleGeometry args={[0.052, 0.32, 6, 8]} />
          {skinMat}
        </mesh>
        {/* 袖口蕾丝环 */}
        <mesh position={[0, -0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.054, 0.004, 4, 12]} />
          {glowSoft}
        </mesh>
        {/* 前臂 */}
        <mesh position={[0, -0.52, 0]}>
          <capsuleGeometry args={[0.042, 0.22, 6, 8]} />
          {skinMat}
        </mesh>
        {/* 手链 */}
        <mesh position={[0, -0.62, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.044, 0.004, 6, 16]} />
          {goldMat}
        </mesh>
        {/* 手掌 */}
        <mesh position={[0, -0.7, 0]} scale={[0.9, 0.6, 0.55]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          {skinMat}
        </mesh>
        {/* 拇指 */}
        <mesh
          position={[0.04, -0.74, 0.02]}
          rotation={[0, 0, 0.5]}
          scale={[0.35, 0.6, 0.35]}
        >
          <capsuleGeometry args={[0.018, 0.03, 3, 4]} />
          {skinMat}
        </mesh>
        {/* 四指组 */}
        <mesh position={[-0.01, -0.78, 0.01]} scale={[0.7, 0.45, 0.4]}>
          <capsuleGeometry args={[0.022, 0.035, 3, 4]} />
          {skinMat}
        </mesh>
        <mesh position={[0.01, -0.78, -0.01]} scale={[0.5, 0.4, 0.35]}>
          <capsuleGeometry args={[0.018, 0.03, 3, 4]} />
          {skinMat}
        </mesh>
      </group>
      <group ref={refs.rightArm} position={[-0.42, -0.98, 0]}>
        {/* 上臂 */}
        <mesh position={[0, -0.22, 0]}>
          <capsuleGeometry args={[0.052, 0.32, 6, 8]} />
          {skinMat}
        </mesh>
        {/* 袖口蕾丝环 */}
        <mesh position={[0, -0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.054, 0.004, 4, 12]} />
          {glowSoft}
        </mesh>
        {/* 前臂 */}
        <mesh position={[0, -0.52, 0]}>
          <capsuleGeometry args={[0.042, 0.22, 6, 8]} />
          {skinMat}
        </mesh>
        {/* 手链 */}
        <mesh position={[0, -0.62, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.044, 0.004, 6, 16]} />
          {goldMat}
        </mesh>
        {/* 手掌 */}
        <mesh position={[0, -0.7, 0]} scale={[0.9, 0.6, 0.55]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          {skinMat}
        </mesh>
        {/* 拇指 */}
        <mesh
          position={[-0.04, -0.74, 0.02]}
          rotation={[0, 0, -0.5]}
          scale={[0.35, 0.6, 0.35]}
        >
          <capsuleGeometry args={[0.018, 0.03, 3, 4]} />
          {skinMat}
        </mesh>
        {/* 四指组 */}
        <mesh position={[0.01, -0.78, 0.01]} scale={[0.7, 0.45, 0.4]}>
          <capsuleGeometry args={[0.022, 0.035, 3, 4]} />
          {skinMat}
        </mesh>
        <mesh position={[-0.01, -0.78, -0.01]} scale={[0.5, 0.4, 0.35]}>
          <capsuleGeometry args={[0.018, 0.03, 3, 4]} />
          {skinMat}
        </mesh>
      </group>

      {/* ========== 腿部 + 袜子 + 鞋子 ========== */}
      {/* 大腿（裙下衬裤） */}
      <mesh position={[0.15, -2.25, 0]}>
        <capsuleGeometry args={[0.068, 0.12, 6, 8]} />
        {clothMat}
      </mesh>
      <mesh position={[-0.15, -2.25, 0]}>
        <capsuleGeometry args={[0.068, 0.12, 6, 8]} />
        {clothMat}
      </mesh>
      {/* 小腿（袜子） */}
      <mesh position={[0.15, -2.42, 0]}>
        <capsuleGeometry args={[0.062, 0.25, 6, 8]} />
        {sockMat}
      </mesh>
      <mesh position={[-0.15, -2.42, 0]}>
        <capsuleGeometry args={[0.062, 0.25, 6, 8]} />
        {sockMat}
      </mesh>
      {/* 袜口蕾丝花边 */}
      <mesh position={[0.15, -2.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.068, 0.008, 6, 16]} />
        <meshStandardMaterial color="#f0e6ff" transparent opacity={0.5} />
      </mesh>
      <mesh position={[-0.15, -2.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.068, 0.008, 6, 16]} />
        <meshStandardMaterial color="#f0e6ff" transparent opacity={0.5} />
      </mesh>
      {/* 袜口小蝴蝶结 */}
      <mesh position={[0.15, -2.28, 0.06]} scale={[0.5, 0.3, 0.25]}>
        <sphereGeometry args={[0.025, 4, 4]} />
        {glowPink}
      </mesh>
      <mesh position={[-0.15, -2.28, 0.06]} scale={[0.5, 0.3, 0.25]}>
        <sphereGeometry args={[0.025, 4, 4]} />
        {glowPink}
      </mesh>
      {/* 鞋子主体 */}
      <mesh position={[0.15, -2.58, 0.03]} scale={[1, 0.6, 1.35]}>
        <sphereGeometry args={[0.075, 10, 10]} />
        {shoeMat}
      </mesh>
      <mesh position={[-0.15, -2.58, 0.03]} scale={[1, 0.6, 1.35]}>
        <sphereGeometry args={[0.075, 10, 10]} />
        {shoeMat}
      </mesh>
      {/* 鞋底 */}
      <mesh position={[0.15, -2.62, 0.03]} scale={[1.05, 0.2, 1.4]}>
        <boxGeometry args={[0.12, 0.02, 0.12]} />
        <meshStandardMaterial color="#1a0e2e" roughness={0.8} />
      </mesh>
      <mesh position={[-0.15, -2.62, 0.03]} scale={[1.05, 0.2, 1.4]}>
        <boxGeometry args={[0.12, 0.02, 0.12]} />
        <meshStandardMaterial color="#1a0e2e" roughness={0.8} />
      </mesh>
      {/* 小跟 */}
      <mesh position={[0.15, -2.61, -0.04]} scale={[0.6, 0.35, 0.5]}>
        <boxGeometry args={[0.08, 0.04, 0.06]} />
        <meshStandardMaterial color="#1a0e2e" roughness={0.7} />
      </mesh>
      <mesh position={[-0.15, -2.61, -0.04]} scale={[0.6, 0.35, 0.5]}>
        <boxGeometry args={[0.08, 0.04, 0.06]} />
        <meshStandardMaterial color="#1a0e2e" roughness={0.7} />
      </mesh>
      {/* 鞋口金色装饰线 */}
      <mesh position={[0.15, -2.53, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.072, 0.003, 4, 12]} />
        {goldMat}
      </mesh>
      <mesh position={[-0.15, -2.53, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.072, 0.003, 4, 12]} />
        {goldMat}
      </mesh>
      {/* 鞋扣 */}
      <mesh position={[0.15, -2.55, 0.1]}>
        <sphereGeometry args={[0.018, 6, 6]} />
        {glowPink}
      </mesh>
      <mesh position={[-0.15, -2.55, 0.1]}>
        <sphereGeometry args={[0.018, 6, 6]} />
        {glowPink}
      </mesh>
      {/* 鞋面蝴蝶结带 */}
      <mesh
        position={[0.15, -2.54, 0.09]}
        rotation={[0.3, 0, 0.4]}
        scale={[0.6, 0.2, 0.2]}
      >
        <capsuleGeometry args={[0.012, 0.03, 3, 4]} />
        {glowPink}
      </mesh>
      <mesh
        position={[-0.15, -2.54, 0.09]}
        rotation={[0.3, 0, -0.4]}
        scale={[0.6, 0.2, 0.2]}
      >
        <capsuleGeometry args={[0.012, 0.03, 3, 4]} />
        {glowPink}
      </mesh>

      {/* ========== 光环 ========== */}
      <group ref={refs.rings}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.15, 0.008, 8, 48]} />
          <meshBasicMaterial
            color="#c4b5fd"
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2.08, 0, 0]}>
          <torusGeometry args={[1.3, 0.005, 8, 48]} />
          <meshBasicMaterial
            color="#f9a8d4"
            transparent
            opacity={0.12}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* 第三层微光环 */}
        <mesh rotation={[Math.PI / 1.95, 0, 0]}>
          <torusGeometry args={[0.95, 0.003, 6, 48]} />
          <meshBasicMaterial
            color="#e9d5ff"
            transparent
            opacity={0.08}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </>
  );
}
