// Scene — 3D 场景组件（灯光、环境、后处理、轨道控制）
// 从 DigitalHumanViewer.enhanced.tsx 提取
// 参考 AIRI ThreeScene.vue 的模块化设计
import * as THREE from 'three';
import { PerspectiveCamera, OrbitControls, Environment, Sparkles, ContactShadows, Html } from '@react-three/drei';
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
      <PerspectiveCamera makeDefault position={[0, -0.3, 5.8]} fov={42} />

      <FPSMonitor onFPSUpdate={onFPSUpdate} />
      <VisibilityOptimizer />

      {/* 主光源 — 参考 AIRI 的柔和光照系统 */}
      <hemisphereLight args={['#e8dff5', '#fce7d6', 0.6]} />
      <ambientLight intensity={0.5} color="#faf5ff" />
      <directionalLight position={[5, 8, 6]} intensity={1.2} castShadow color="#fff5ee" shadow-mapSize={1024} />
      {/* 背光 — 轮廓光 */}
      <spotLight position={[-4, 5, -5]} angle={0.35} penumbra={0.8} intensity={0.8} color="#d8b4fe" />
      {/* 头顶高光 */}
      <pointLight position={[0, 3, 2]} intensity={0.5} color="#ede9fe" distance={8} />
      {/* 底部反射 */}
      <pointLight position={[0, -3, 2]} intensity={0.2} color="#fce7f3" distance={6} />

      {/* 环境反射 */}
      <Environment preset="sunset" />

      {/* 模型 / 内置角色 / VRM */}
      {modelScene ? (
        <primitive object={modelScene} position={[0, -1.2, 0]} />
      ) : (
        <AvatarSwitch />
      )}

      {/* 粒子效果 */}
      <Sparkles count={50} scale={7} size={1.5} speed={0.15} opacity={0.2} color="#e9d5ff" />
      <Sparkles count={25} scale={4} size={2} speed={0.1} opacity={0.15} color="#fbcfe8" />

      {/* 地面阴影 */}
      <ContactShadows
        resolution={1024} scale={10} blur={2.5} opacity={0.3}
        far={10} color="#94a3b8" position={[0, -3.2, 0]}
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

      {/* Bloom 后处理 */}
      <EffectComposer>
        <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.5} intensity={0.8} mipmapBlur />
      </EffectComposer>
    </>
  );
}
