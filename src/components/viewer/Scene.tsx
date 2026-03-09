// Scene — 3D 场景组件（灯光、环境、后处理、轨道控制）
// v2：参考 AIRI ThreeScene.vue 优化灯光系统和后处理参数
import * as THREE from 'three';
import {
  PerspectiveCamera,
  OrbitControls,
  Environment,
  Sparkles,
  ContactShadows,
} from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import FPSMonitor from './FPSMonitor';
import VisibilityOptimizer from './VisibilityOptimizer';
import AvatarSwitch from './AvatarSwitch';

interface SceneProps {
  autoRotate?: boolean;
  modelScene?: THREE.Group | null;
  onFPSUpdate?: (fps: number) => void;
}

export default function Scene({ autoRotate, modelScene, onFPSUpdate }: SceneProps) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, -0.3, 5.8]} fov={40} />

      <FPSMonitor onFPSUpdate={onFPSUpdate} />
      <VisibilityOptimizer />

      {/* ========== 灯光系统（参考 AIRI 三层光照） ========== */}
      {/* 半球光 — 天空/地面双色环境光 */}
      <hemisphereLight args={['#e8dff5', '#fce7d6', 0.7]} />
      {/* 环境补光 */}
      <ambientLight intensity={0.4} color="#faf5ff" />

      {/* 主方向光 — 柔和阴影 */}
      <directionalLight
        position={[4, 8, 6]}
        intensity={1.0}
        castShadow
        color="#fff5ee"
        shadow-mapSize={1024}
        shadow-bias={-0.0001}
      />
      {/* 补充方向光 — 侧面补光 */}
      <directionalLight
        position={[-3, 4, 2]}
        intensity={0.3}
        color="#e8dff5"
      />

      {/* 背光 — 轮廓光（参考 AIRI 边缘高光） */}
      <spotLight
        position={[-4, 5, -5]}
        angle={0.35}
        penumbra={0.8}
        intensity={0.7}
        color="#d8b4fe"
      />
      {/* 顶部柔光 */}
      <pointLight position={[0, 3, 2]} intensity={0.4} color="#ede9fe" distance={8} />
      {/* 底部暖色反射光 */}
      <pointLight position={[0, -3, 2]} intensity={0.15} color="#fce7f3" distance={6} />
      {/* 正面柔和补光 — 减少阴影过深 */}
      <pointLight position={[0, 0.5, 4]} intensity={0.2} color="#f5f3ff" distance={6} />

      {/* 环境反射 */}
      <Environment preset="sunset" />

      {/* 模型 / 内置角色 / VRM */}
      {modelScene ? (
        <primitive object={modelScene} position={[0, -1.2, 0]} />
      ) : (
        <AvatarSwitch />
      )}

      {/* 粒子效果（微妙的浮动光点） */}
      <Sparkles count={40} scale={7} size={1.2} speed={0.12} opacity={0.15} color="#e9d5ff" />
      <Sparkles count={20} scale={4} size={1.8} speed={0.08} opacity={0.1} color="#fbcfe8" />

      {/* 地面阴影 */}
      <ContactShadows
        resolution={1024}
        scale={10}
        blur={2.5}
        opacity={0.25}
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
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
      />

      {/* Bloom 后处理 — 参考 AIRI 的柔和光晕效果 */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.65}
          luminanceSmoothing={0.6}
          intensity={0.7}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}
