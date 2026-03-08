# MetaHuman 架构说明

## 1. 定位与范围

本仓库是 **3D 数字人交互 Demo/SDK**：展示实时 3D 渲染、语音交互、视觉镜像、LLM 对话等能力，无云端配置时也能稳定运行。

**非目标**：用户体系、模型管理后台、行为编辑器、平台化部署。

---

## 2. 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript 5 + Vite 5 |
| 3D 渲染 | Three.js r158 + @react-three/fiber + @react-three/drei |
| VRM 支持 | @pixiv/three-vrm 3.5（加载 `.vrm` 模型） |
| 状态管理 | Zustand 4 |
| 样式 | Tailwind CSS 3（`darkMode: "class"`） |
| 图标 | Lucide React |
| 通知 | Sonner |
| 路由 | React Router DOM 6 |
| 测试 | Vitest + @testing-library/react + fast-check |
| 后端 | FastAPI + httpx（Python） |
| 部署 | Vercel |

---

## 3. 前端架构

### 3.1 入口与路由

`src/main.tsx` → `src/App.tsx`（React.lazy 懒加载 + ErrorBoundary + Suspense）

| 路由 | 页面 | 说明 |
|------|------|------|
| `/`、`/advanced` | `AdvancedDigitalHumanPage` | 主页面，功能最完整 |
| `/digital-human` | `DigitalHumanPage` | 简化版页面 |
| `*` | `NotFoundPage` | 404 页面（渐变 + 粒子效果） |

### 3.2 3D 渲染层

**双模式 Avatar 系统**：

- **CyberAvatar**（`DigitalHumanViewer.enhanced.tsx`）— 纯几何体赛博风数字人，无需外部模型
  - 头部组 `headGroupRef`：颅骨、下颌、鼻子、5 层眼球、眉毛、嘴巴、耳机 — 独立旋转
  - 身体组 `group`：躯干、胸甲、能量核心、肩甲、分段手臂 — 整体倾斜/弹跳
  - 装饰：全息光环旋转 + 情绪灯光颜色变化
  - 4 种共享 `useMemo` 材质：`skinMat` / `armorMat` / `frameMat` / `glowCyan`
- **VRM Avatar**（`VRMAvatar.tsx` + `hooks/vrm/`）— 加载 `.vrm` 模型
  - `useVRMLoader`：模型加载
  - `useVRMBlink`：自动眨眼
  - `useVRMEmote`：表情映射
  - `useVRMEyeSaccades`：眼球微动
  - `useVRMLipSync`：口型同步
- **基础版**（`DigitalHumanViewer.tsx`）— 支持 GLB/GLTF 加载，失败时回退 procedural avatar

**动画系统**：`useFrame` 驱动，`animState` ref 存储插值目标，`THREE.MathUtils.lerp` 平滑过渡。

### 3.3 UI 组件层（`src/components/`）

| 组件 | 说明 |
|------|------|
| `ControlPanel` | 播放/重置、录音、静音等快捷控制 |
| `BehaviorControlPanel.new.tsx` | 行为控制面板（25 种动作，3 列网格） |
| `ExpressionControlPanel.new.tsx` | 表情控制面板（11 种表情） |
| `VoiceInteractionPanel.dark.tsx` | ASR/TTS 语音面板（Web Speech API） |
| `VisionMirrorPanel` | 摄像头预览 + MediaPipe 情感检测 |
| `KeyboardShortcutsHelp` | 键盘快捷键帮助弹窗 |
| `ui/ErrorBoundary` | 全局错误边界（支持重试） |
| `ui/LoadingSpinner` | 加载动画（3 种尺寸 + 全屏遮罩） |

> 文件命名约定：`.new.tsx` = 中文化重构版，`.dark.tsx` = 深色主题版

### 3.4 状态管理（`src/store/digitalHumanStore.ts`）

Zustand 单一 Store，关键类型：

- **`EmotionType`**（5 种）：`neutral` · `happy` · `surprised` · `sad` · `angry`
- **`ExpressionType`**（11 种）：`neutral` · `smile` · `laugh` · `surprise` · `sad` · `angry` · `blink` · `eyebrow_raise` · `eye_blink` · `mouth_open` · `head_nod`
- **`BehaviorType`**（25 种）：`idle` · `greeting` · `listening` · `thinking` · `speaking` · `excited` · `wave` · `greet` · `think` · `nod` · `shakeHead` · `dance` · `speak` · `waveHand` · `raiseHand` · `bow` · `clap` · `thumbsUp` · `headTilt` · `shrug` · `lookAround` · `cheer` · `sleep` · `crossArms` · `point`
- **`AvatarType`**：`cyber` · `vrm`
- **`ConnectionStatus`**：`connected` · `connecting` · `disconnected` · `error`

关键状态分组：会话（`sessionId`、`chatHistory`）、播放/音频（`isPlaying`、`isRecording`、`isMuted`、`isSpeaking`）、表情/动作（`currentEmotion`、`currentExpression`、`currentAnimation`）、系统（`connectionStatus`、`errors`、`performanceMetrics`）。

防抖机制：高频更新限制每秒 10 次（`debouncedSetState`）。

### 3.5 核心能力层（`src/core/`）

| 模块 | 文件 | 职责 |
|------|------|------|
| 行为引擎 | `avatar/DigitalHumanEngine.ts` | 动画队列、组合动作（`perform<Action>()`）、情感↔表情映射 |
| 语音 | `audio/audioService.ts` | TTS（文字转语音）+ ASR（语音识别），Web Speech API |
| 对话 | `dialogue/dialogueService.ts` | 与后端 `/v1/chat` 通讯（重试、超时、降级） |
| 对话编排 | `dialogue/dialogueOrchestrator.ts` | 将 `{replyText, emotion, action}` 分发到 Store/Engine/TTS |
| 视觉 | `vision/visionService.ts` | 摄像头管理、FaceMesh/Pose 推理 |
| 视觉映射 | `vision/visionMapper.ts` | 关键点 → 简化 emotion + 头部动作 |
| 性能 | `performance/performanceMonitor.ts` | FPS 计算与性能指标采集 |

### 3.6 Hooks（`src/hooks/`）

| Hook | 说明 |
|------|------|
| `useTheme` | 主题切换（dark/light），`localStorage` 持久化，默认深色 |
| `usePerformance` | 性能监控指标 |
| `useTouch` | 触控手势（滑动、点击、双击、长按） |
| `vrm/*` | VRM 模型专用 Hooks（加载、眨眼、表情、眼球微动、口型同步） |

### 3.7 双主题系统

- Tailwind CSS `darkMode: "class"` 模式
- `<html>` 元素添加/移除 `dark` class
- **所有 UI 组件**必须同时写浅色基础样式 + `dark:` 变体
- 默认深色主题，支持切换

---

## 4. 后端架构（FastAPI）

- **入口**：`server/app/main.py`
- **API**：详见 [api.md](./api.md)
  - `GET /health` — 健康检查
  - `POST /v1/chat` — 对话主接口
  - `DELETE /v1/chat/session/{id}` — 清除会话
  - `GET /v1/chat/session/{id}/history` — 查询会话历史
- **对话服务**（`server/app/services/dialogue.py`）：
  - 配置 `OPENAI_API_KEY` 时调用 OpenAI Chat Completions
  - 未配置或异常时回退智能 Mock（关键词匹配 + 随机回复）
  - 会话历史存储在内存中（最多 20 轮）
  - 支持 `OPENAI_BASE_URL` 自动规范化（兼容域名 / `/v1` / 完整路径）
  - 支持 `LLM_PROVIDER` 预留多 Provider 扩展

---

## 5. 关键数据流

### 5.1 文本/语音 → 对话 → 驱动数字人

```
用户输入文本 / ASR 语音识别
  → dialogueService.sendUserInput()
  → POST /v1/chat
  → 后端返回 { replyText, emotion, action }
  → dialogueOrchestrator 分发：
      ├─ chatHistory 更新
      ├─ DigitalHumanEngine（情感 + 表情 + 动画）
      └─ ttsService.speak(replyText)（未静音时）
```

### 5.2 摄像头 → 视觉镜像

```
visionService 获取视频帧 → MediaPipe FaceMesh/Pose 推理
  → visionMapper 输出简化状态（emotion、nod/shake 等）
  → 应用到数字人（表情与动作）
```

### 5.3 UI 面板 → 直接驱动

```
BehaviorControlPanel / ExpressionControlPanel
  → DigitalHumanEngine.setBehavior() / setExpression()
  → Store 更新 → 3D Viewer useFrame 读取并渲染
```
