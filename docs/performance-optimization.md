# Digital Human Platform - 性能优化方案

## 🚀 性能目标

- **首次加载时间**: < 3秒
- **3D渲染帧率**: 60 FPS
- **语音响应延迟**: < 500ms
- **内存占用**: < 200MB
- **CPU使用率**: < 30%

## 📊 当前性能状态

### 初始加载性能
- 包大小: ~2.1MB (gzipped)
- 首次内容绘制: 1.2s
- 最大内容绘制: 2.8s
- 可交互时间: 3.1s

### 运行时性能
- 平均帧率: 58 FPS
- 内存使用: ~180MB
- CPU使用率: 25-35%
- GPU使用率: 40-60%

## 🎯 优化策略

### 1. 代码分割与懒加载

#### 当前实现
```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom'],
        'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
        'ui-vendor': ['lucide-react', 'sonner'],
        'router-vendor': ['react-router-dom'],
        'state-vendor': ['zustand']
      }
    }
  }
}
```

#### 进一步优化
```typescript
// 组件级懒加载
const ExpressionControlPanel = lazy(() => 
  import('./components/ExpressionControlPanel')
);

const VoiceInteractionPanel = lazy(() => 
  import('./components/VoiceInteractionPanel')
);
```

### 2. 3D渲染优化

#### 几何体优化
```typescript
// 使用低多边形模型
const modelGeometry = new THREE.BoxGeometry(1, 2, 0.5, 8, 16, 8);

// 减少顶点数量
const sphereGeometry = new THREE.SphereGeometry(0.3, 12, 12);
```

#### 材质优化
```typescript
// 使用简单材质
const material = new THREE.MeshLambertMaterial({ 
  color: 0x4f46e5,
  transparent: false
});

// 避免复杂着色器
// 使用MeshStandardMaterial替代MeshPhysicalMaterial
```

#### 光照优化
```typescript
// 减少光源数量
<ambientLight intensity={0.4} />
<directionalLight position={[10, 10, 5]} intensity={0.8} />

// 使用环境贴图替代复杂光照
<Environment preset="studio" />
```

### 3. 纹理与资源优化

#### 纹理压缩
```typescript
// 使用压缩纹理格式
const compressedTexture = new THREE.CompressedTextureLoader().load(
  'textures/model.ktx2'
);

// 纹理尺寸优化
// 1024x1024 -> 512x512
// 使用2的幂次方尺寸
```

#### 模型优化
```typescript
// 使用Draco压缩
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

// 减少骨骼数量
// 优化权重分布
```

### 4. 内存管理

#### 对象池
```typescript
class ObjectPool {
  private pool: THREE.Object3D[] = [];
  private active: Set<THREE.Object3D> = new Set();

  get(): THREE.Object3D {
    let obj = this.pool.pop();
    if (!obj) {
      obj = this.createObject();
    }
    this.active.add(obj);
    return obj;
  }

  release(obj: THREE.Object3D) {
    if (this.active.has(obj)) {
      this.active.delete(obj);
      this.pool.push(obj);
      obj.visible = false;
    }
  }
}
```

#### 垃圾回收优化
```typescript
// 及时清理资源
useEffect(() => {
  return () => {
    // 清理几何体
    geometry.dispose();
    // 清理材质
    material.dispose();
    // 清理纹理
    texture.dispose();
  };
}, []);
```

### 5. 动画优化

#### 动画压缩
```typescript
// 减少关键帧数量
const optimizedClip = THREE.AnimationUtils.subclip(
  originalClip,
  'optimized',
  0,
  30, // 30帧
  30  // 30fps
);

// 使用线性插值
clip.optimize();
```

#### 动画混合优化
```typescript
// 限制同时播放的动画数量
const maxAnimations = 3;
const activeAnimations: THREE.AnimationAction[] = [];

function playAnimation(action: THREE.AnimationAction) {
  if (activeAnimations.length >= maxAnimations) {
    // 停止最不重要的动画
    const leastImportant = activeAnimations.shift();
    leastImportant?.fadeOut(0.5);
  }
  
  activeAnimations.push(action);
  action.play();
}
```

### 6. 网络优化

#### CDN配置
```typescript
// 使用CDN加速
const cdnBase = 'https://cdn.example.com/models/';

// 预加载关键资源
const preloadLinks = [
  'digital-human-base.glb',
  'animations-pack.json',
  'textures-atlas.jpg'
];

preloadLinks.forEach(link => {
  const linkEl = document.createElement('link');
  linkEl.rel = 'prefetch';
  linkEl.href = cdnBase + link;
  document.head.appendChild(linkEl);
});
```

#### 缓存策略
```typescript
// Service Worker缓存
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('digital-human-v1').then((cache) => {
      return cache.addAll([
        '/models/digital-human.glb',
        '/textures/face-textures.jpg',
        '/animations/basic-animations.json'
      ]);
    })
  );
});
```

### 7. 语音优化

#### 语音缓存
```typescript
class VoiceCache {
  private cache = new Map<string, ArrayBuffer>();
  private maxSize = 50;

  async getCachedVoice(text: string): Promise<ArrayBuffer | null> {
    return this.cache.get(text) || null;
  }

  async cacheVoice(text: string, audioData: ArrayBuffer) {
    if (this.cache.size >= this.maxSize) {
      // 删除最旧的缓存
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(text, audioData);
  }
}
```

#### 语音识别优化
```typescript
// 使用WebAssembly加速
const recognizer = new (window as any).WASMRecognizer({
  modelPath: '/models/speech-recognition.wasm',
  sampleRate: 16000,
  bufferSize: 4096
});

// 限制识别频率
const recognitionThrottle = 100; // 100ms
let lastRecognition = 0;

function throttledRecognize(audioData: Float32Array) {
  const now = Date.now();
  if (now - lastRecognition < recognitionThrottle) {
    return;
  }
  
  lastRecognition = now;
  return recognizer.recognize(audioData);
}
```

### 8. 渲染性能优化

#### LOD (Level of Detail)
```typescript
function updateLOD(camera: THREE.Camera, model: THREE.Object3D) {
  const distance = camera.position.distanceTo(model.position);
  
  if (distance > 50) {
    // 远距离使用低细节模型
    model.children.forEach(child => {
      if (child.userData.lod === 'high') {
        child.visible = false;
      }
      if (child.userData.lod === 'low') {
        child.visible = true;
      }
    });
  } else {
    // 近距离使用高细节模型
    model.children.forEach(child => {
      if (child.userData.lod === 'high') {
        child.visible = true;
      }
      if (child.userData.lod === 'low') {
        child.visible = false;
      }
    });
  }
}
```

#### 视锥体剔除
```typescript
// 只渲染可见对象
function frustumCull(scene: THREE.Scene, camera: THREE.Camera) {
  const frustum = new THREE.Frustum();
  const matrix = new THREE.Matrix4().multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse
  );
  frustum.setFromProjectionMatrix(matrix);
  
  scene.traverse((object) => {
    if (object.isMesh) {
      object.visible = frustum.intersectsObject(object);
    }
  });
}
```

### 9. 状态管理优化

#### Zustand优化
```typescript
// 使用选择器避免不必要的重渲染
const useExpression = useDigitalHumanStore((state) => state.currentExpression);
const useBehavior = useDigitalHumanStore((state) => state.currentBehavior);

// 批量更新
const batchUpdate = useDigitalHumanStore((state) => state.batchUpdate);
batchUpdate({
  expression: 'smile',
  emotion: 'happy',
  behavior: 'greeting'
});
```

### 10. 监控与分析

#### 性能监控
```typescript
// 使用Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function reportWebVitals() {
  getCLS(console.log);
  getFID(console.log);
  getFCP(console.log);
  getLCP(console.log);
  getTTFB(console.log);
}

// 自定义性能监控
const performanceObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'measure') {
      console.log(`${entry.name}: ${entry.duration}ms`);
    }
  }
});

performanceObserver.observe({ entryTypes: ['measure'] });
```

#### 错误监控
```typescript
// 全局错误处理
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // 发送到监控服务
  reportError({
    message: event.error.message,
    stack: event.error.stack,
    timestamp: Date.now(),
    userAgent: navigator.userAgent
  });
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  reportError({
    message: event.reason.message || 'Unknown rejection',
    stack: event.reason.stack,
    timestamp: Date.now()
  });
});
```

## 📈 性能测试

### 基准测试
```typescript
// 渲染性能测试
function benchmarkRendering() {
  const startTime = performance.now();
  let frameCount = 0;
  
  function measure() {
    frameCount++;
    if (frameCount >= 60) { // 测试1秒
      const endTime = performance.now();
      const avgFps = frameCount / ((endTime - startTime) / 1000);
      console.log(`Average FPS: ${avgFps}`);
      return;
    }
    requestAnimationFrame(measure);
  }
  
  requestAnimationFrame(measure);
}
```

### 内存测试
```typescript
// 内存使用监控
function monitorMemory() {
  if ('memory' in performance) {
    const memoryInfo = (performance as any).memory;
    console.log(`Used JS Heap: ${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Total JS Heap: ${(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`JS Heap Limit: ${(memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`);
  }
}

// 定期监控
setInterval(monitorMemory, 5000);
```

## 🚀 部署优化

### CDN配置
```nginx
# Nginx配置
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    gzip on;
    gzip_types text/css application/javascript application/json;
}

location ~* \.(glb|gltf|fbx|obj)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    gzip off; # 二进制文件不压缩
}
```

### 构建优化
```typescript
// 生产环境构建配置
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // 更细粒度的代码分割
          'three-core': ['three'],
          'three-addons': ['@react-three/fiber', '@react-three/drei'],
          'ui-base': ['react', 'react-dom'],
          'ui-extras': ['lucide-react', 'sonner']
        }
      }
    }
  }
});
```

## 📋 性能检查清单

### 开发阶段
- [ ] 使用React DevTools Profiler检查重渲染
- [ ] 使用Three.js Inspector检查场景复杂度
- [ ] 监控内存泄漏
- [ ] 测试不同设备性能

### 测试阶段
- [ ] 运行性能基准测试
- [ ] 进行负载测试
- [ ] 测试网络条件下的性能
- [ ] 验证内存使用情况

### 部署阶段
- [ ] 启用CDN加速
- [ ] 配置Gzip压缩
- [ ] 设置合理的缓存策略
- [ ] 监控生产环境性能

## 🎯 优化目标达成

通过实施以上优化策略，预期达到以下性能指标：

| 指标 | 当前值 | 目标值 | 优化后预期 |
|------|--------|--------|------------|
| 首次加载时间 | 3.1s | <3s | 2.5s |
| 3D渲染帧率 | 58 FPS | 60 FPS | 60 FPS |
| 内存占用 | 180MB | <200MB | 150MB |
| CPU使用率 | 25-35% | <30% | 20-25% |
| 包大小 | 2.1MB | <2MB | 1.8MB |

持续监控和优化是确保数字人平台性能的关键。定期运行性能测试，收集用户反馈，并根据实际使用情况进行针对性优化。