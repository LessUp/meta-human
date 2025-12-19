# MetaHuman 交互 Demo/SDK 架构说明

## 1. 定位与范围

本仓库以“交互 Demo/SDK”为中心：展示 3D 数字人、语音交互、视觉镜像、LLM 对话等能力，并确保在无云端配置时也能稳定运行。

非目标（当前仓库不做/不承诺）：

- 用户体系与权限（注册/登录/管理员）
- 模型管理后台（上传/编辑/发布）
- 行为编辑器（时间轴/复杂编排）
- 平台化部署管理（多租户/灰度/回滚）

## 2. 前端架构（React + Vite + TypeScript）

### 2.1 入口与路由

- 应用入口：`src/main.tsx` → `src/App.tsx`
- 路由：
  - `/`、`/advanced`：`AdvancedDigitalHumanPage`（默认、功能最完整）
  - `/digital-human`：`DigitalHumanPage`（简化版页面）

### 2.2 UI 组件层（`src/components/`）

- `DigitalHumanViewer`
  - Three.js + React Three Fiber 渲染数字人
  - 支持加载 GLB/GLTF；加载失败或未配置模型时使用内置 procedural avatar 兜底
- `ControlPanel`
  - 播放/重置、录音、静音等快捷控制
- `VoiceInteractionPanel`
  - ASR/TTS 面板（Web Speech API）
  - 录音/静音状态与全局 store 同步
- `VisionMirrorPanel`
  - 摄像头预览 + MediaPipe 推理结果展示
- `ExpressionControlPanel`、`BehaviorControlPanel`
  - 手动驱动表情/行为，用于演示与调试

### 2.3 状态管理（`src/store/digitalHumanStore.ts`）

- 状态源：Zustand
- 关键状态：
  - 会话：`sessionId`（localStorage：`metahuman_session_id`）
  - 播放与音频：`isPlaying`、`isRecording`、`isMuted`、`isSpeaking`
  - 表情与动作：`currentEmotion`、`currentExpression`、`currentAnimation`
  - 系统状态：`connectionStatus`、`error`

UI 层尽量“只读 store + 调用高层 action”，避免直接操作底层 Web API。

### 2.4 核心能力层（`src/core/`）

- `core/avatar/DigitalHumanEngine.ts`
  - 统一驱动数字人表现（情绪/表情/动画/复合动作）
- `core/audio/audioService.ts`
  - `ttsService`：文字转语音（Web Speech API）
  - `asrService`：语音识别（Web Speech API）
  - 负责同步 store 中的录音/说话等状态
- `core/dialogue/dialogueService.ts`
  - 与后端 `/v1/chat` 通讯（超时、重试、降级）
- `core/dialogue/dialogueOrchestrator.ts`
  - 将 `{ replyText, emotion, action }` 应用到 UI/store/engine/TTS（如存在）
- `core/vision/visionService.ts` + `core/vision/visionMapper.ts`
  - 摄像头管理、FaceMesh/Pose 推理
  - 将原始关键点映射为简化的 `emotion` 与头部动作（`nod`/`shakeHead` 等）

## 3. 后端架构（FastAPI）

- 入口：`server/app/main.py`
- API：
  - `GET /health`
  - `POST /v1/chat`
- 对话服务：`server/app/services/dialogue.py`
  - 当配置 `OPENAI_API_KEY` 时：调用 OpenAI Chat Completions
  - 未配置 key 或请求异常：回退本地 Mock（保证 Demo 可用）

## 4. 关键数据流

### 4.1 文本/语音 → 对话 → 驱动数字人

1. 用户输入文本，或通过 ASR 得到文本
2. 前端 `sendUserInput()` 调用后端 `POST /v1/chat`
3. 后端返回结构化数据：`{ replyText, emotion, action }`
4. 前端更新：
   - 聊天记录
   - `DigitalHumanEngine`（表情/情绪/动作）
   - 未静音时：`ttsService.speak(replyText)`

### 4.2 摄像头 → 视觉镜像

1. `visionService` 获取视频帧并运行推理
2. `visionMapper` 输出简化状态（emotion、nod/shake 等）
3. 页面/引擎应用到数字人表现（表情与动作）
