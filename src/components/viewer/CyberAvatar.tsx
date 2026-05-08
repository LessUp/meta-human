/**
 * 程序化数字人头像组件。
 *
 * 使用 Three.js 基础几何体构建的赛博风格头像，
 * 支持表情、动画和语音同步。
 */

import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { useDigitalHumanStore } from '@/store/digitalHumanStore';
import { useIsTabVisibleRef } from '@/hooks';
import type { DeviceCapabilities } from '@/core/performance';

interface CyberAvatarProps {
  prefersReducedMotion: boolean;
  deviceCaps: DeviceCapabilities;
}

export function CyberAvatar({ prefersReducedMotion, deviceCaps }: CyberAvatarProps) {
  const group = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);

  // 使用 ref 避免 useFrame 中触发重渲染
  const storeRef = useRef(useDigitalHumanStore.getState());
  const intensityRef = useRef(storeRef.current.expressionIntensity ?? 0.8);
  const isVisibleRef = useIsTabVisibleRef();

  // 订阅 store 变化，更新 ref 而不触发重渲染
  useEffect(() => {
    const unsubscribe = useDigitalHumanStore.subscribe((state) => {
      storeRef.current = state;
      intensityRef.current = state.expressionIntensity ?? 0.8;
    });
    return unsubscribe;
  }, []);

  // 低端设备跳帧
  const frameSkipRef = useRef(0);
  const frameSkipTarget = deviceCaps.tier === 'low' ? 2 : 1;

  useFrame((state) => {
    // 标签页不可见时跳过动画
    if (!isVisibleRef.current) return;

    // 低端设备跳帧
    if (deviceCaps.tier === 'low') {
      frameSkipRef.current++;
      if (frameSkipRef.current % frameSkipTarget !== 0) return;
    }

    const t = state.clock.elapsedTime;
    // 从 ref 读取状态，避免重渲染
    const { currentExpression, isSpeaking, currentAnimation } = storeRef.current;
    const intensity = Math.max(0, Math.min(1, intensityRef.current));

    // 减少动画模式且非必要动画时跳过
    if (prefersReducedMotion && currentAnimation === 'idle' && !isSpeaking) {
      return;
    }

    // 漂浮逻辑由 <Float> 组件处理
    if (group.current) {
      // 基于动画状态的头部运动
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
        // idle — 平滑返回中立旋转
        group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, 0, 0.1);
        group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, 0, 0.1);
        group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, 0, 0.1);
      }
    }

    // 说话动画（下巴/头部摆动）
    if (!prefersReducedMotion && isSpeaking && headRef.current) {
      headRef.current.rotation.x = Math.sin(t * 15) * 0.05;
    }

    // 表情
    if (leftEyeRef.current?.scale && rightEyeRef.current?.scale) {
      const baseScaleY = 1;
      let targetScaleY = baseScaleY;

      // 眨眼逻辑
      const blink = Math.sin(t * 3);
      const isBlinking = blink > 0.98 || currentExpression === 'blink';

      // 情绪逻辑
      if (currentExpression === 'smile') {
        targetScaleY = 0.5;
      } else if (currentExpression === 'surprise') {
        targetScaleY = 1.3;
      }

      const scaleY = isBlinking ? 0.1 : THREE.MathUtils.lerp(baseScaleY, targetScaleY, intensity);

      leftEyeRef.current.scale.y = THREE.MathUtils.lerp(leftEyeRef.current.scale.y, scaleY, 0.2);
      rightEyeRef.current.scale.y = THREE.MathUtils.lerp(rightEyeRef.current.scale.y, scaleY, 0.2);
    }

    // 光环动画（低端设备跳过以提升性能）
    if (!prefersReducedMotion && ringsRef.current?.rotation && deviceCaps.tier !== 'low') {
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
      {/* 漂浮容器 */}
      <Float
        speed={prefersReducedMotion ? 0 : 2}
        rotationIntensity={0.2}
        floatIntensity={prefersReducedMotion ? 0 : 0.5}
      >
        {/* --- 头部 --- */}
        <mesh ref={headRef} position={[0, 0, 0]} castShadow receiveShadow>
          {/* 主头部形状 - 平滑的胶囊/球体混合 */}
          <sphereGeometry args={[0.8, 64, 64]} />
          <meshPhysicalMaterial
            color="#e2e8f0"
            metalness={0.6}
            roughness={0.2}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        </mesh>

        {/* --- 眼睛 --- */}
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
          {/* 眼睛发光球体（瞳孔） */}
          <mesh position={[-0.25, 0, 0.05]} scale={[1, 0.1, 1]}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={4} />
          </mesh>
          <mesh position={[0.25, 0, 0.05]} scale={[1, 0.1, 1]}>
            <sphereGeometry args={[0.09, 16, 16]} />
            <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={4} />
          </mesh>
        </group>

        {/* --- 颈部/底座 --- */}
        <mesh position={[0, -1, 0]}>
          <cylinderGeometry args={[0.3, 0.4, 0.8, 32]} />
          <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* --- 全息光环 --- */}
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

        {/* --- 耳机 --- */}
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
