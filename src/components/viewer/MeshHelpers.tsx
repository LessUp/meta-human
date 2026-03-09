// MeshHelpers — 可复用的对称 mesh 辅助组件
// 减少 CyberAvatarModel 中大量左右对称重复代码
import { forwardRef } from "react";
import * as THREE from "three";

// ============================================================
// 对称 Mesh 对（左右镜像）
// ============================================================

interface SymmetricPairProps {
  /** X 轴偏移（正值，左侧取负） */
  offsetX: number;
  /** Y 位置 */
  y?: number;
  /** Z 位置 */
  z?: number;
  /** 缩放 */
  scale?: [number, number, number] | number;
  /** 旋转 [x, y, z]（右侧自动镜像 Y 和 Z） */
  rotation?: [number, number, number];
  /** 是否镜像旋转（默认 true） */
  mirrorRotation?: boolean;
  /** 子元素（geometry + material） */
  children: React.ReactNode;
  /** 额外 mesh props */
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/**
 * 对称 Mesh 对 — 自动在 ±offsetX 处生成左右两个 mesh
 */
export function SymmetricPair({
  offsetX,
  y = 0,
  z = 0,
  scale,
  rotation,
  mirrorRotation = true,
  children,
  castShadow,
  receiveShadow,
}: SymmetricPairProps) {
  const scaleArr: [number, number, number] | undefined =
    typeof scale === "number" ? [scale, scale, scale] : scale;
  const leftRot = rotation;
  const rightRot =
    rotation && mirrorRotation
      ? ([rotation[0], -rotation[1], -rotation[2]] as [number, number, number])
      : rotation;

  return (
    <>
      <mesh
        position={[-offsetX, y, z]}
        rotation={leftRot}
        scale={scaleArr}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        {children}
      </mesh>
      <mesh
        position={[offsetX, y, z]}
        rotation={rightRot}
        scale={scaleArr}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        {children}
      </mesh>
    </>
  );
}

// ============================================================
// 带 ref 的对称 Mesh 对
// ============================================================

interface SymmetricRefPairProps extends Omit<SymmetricPairProps, "children"> {
  leftRef: React.RefObject<THREE.Mesh | null>;
  rightRef: React.RefObject<THREE.Mesh | null>;
  children: React.ReactNode;
}

/**
 * 带 ref 的对称 Mesh 对 — 用于需要动画控制的部件（眼睛、眉毛等）
 */
export function SymmetricRefPair({
  offsetX,
  y = 0,
  z = 0,
  scale,
  rotation,
  mirrorRotation = true,
  leftRef,
  rightRef,
  children,
  castShadow,
  receiveShadow,
}: SymmetricRefPairProps) {
  const scaleArr: [number, number, number] | undefined =
    typeof scale === "number" ? [scale, scale, scale] : scale;
  const leftRot = rotation;
  const rightRot =
    rotation && mirrorRotation
      ? ([rotation[0], -rotation[1], -rotation[2]] as [number, number, number])
      : rotation;

  return (
    <>
      <mesh
        ref={leftRef}
        position={[-offsetX, y, z]}
        rotation={leftRot}
        scale={scaleArr}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        {children}
      </mesh>
      <mesh
        ref={rightRef}
        position={[offsetX, y, z]}
        rotation={rightRot}
        scale={scaleArr}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        {children}
      </mesh>
    </>
  );
}

// ============================================================
// 重复环形排列（裙摆褶皱等）
// ============================================================

interface RadialArrayProps {
  count: number;
  radius: number;
  y: number;
  children: (index: number) => React.ReactNode;
}

/**
 * 环形阵列排列
 */
export function RadialArray({ count, radius, y, children }: RadialArrayProps) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i * Math.PI * 2) / count;
        return (
          <group
            key={`radial-${i}`}
            position={[Math.sin(angle) * radius, y, Math.cos(angle) * radius]}
            rotation={[0, -angle, 0]}
          >
            {children(i)}
          </group>
        );
      })}
    </>
  );
}

// ============================================================
// 装饰性 Mesh（简写辅助）
// ============================================================

interface DecoMeshProps {
  position: [number, number, number];
  scale?: [number, number, number] | number;
  rotation?: [number, number, number];
  children: React.ReactNode;
}

/**
 * 简写装饰 mesh — 减少样板代码
 */
export function Deco({ position, scale, rotation, children }: DecoMeshProps) {
  const s: [number, number, number] | undefined =
    typeof scale === "number" ? [scale, scale, scale] : scale;
  return (
    <mesh position={position} scale={s} rotation={rotation}>
      {children}
    </mesh>
  );
}
