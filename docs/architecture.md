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

## 5. 当前架构评估

- 优点
  - 已经形成 `page -> hooks -> orchestrator/service -> store` 的基本分层，`AdvancedDigitalHumanPage` 比早期版本更薄。
  - 前端对后端断连有 fallback，适合 Demo/SDK 场景。
  - 3D、语音、视觉、对话四条主能力链路已经能独立演进。
- 当前主要问题
  - 聊天消息生命周期分散在 hook、orchestrator、store 三处，容易出现占位消息、流式结束、错误清理不同步。
  - 传输层当前同时存在普通 HTTP、SSE、预研 WebSocket，但还没有统一的 transport 抽象。
  - UI store 同时承载渲染态、会话态、系统态，后续复杂度继续上升时会增加无关重渲染和状态耦合。
  - 视觉、语音、3D 渲染都偏浏览器能力驱动，缺少统一的健康状态和性能观测面板。

## 6. 后续技术路线图

### Phase 1: 稳定交互主链路

- 收敛消息生命周期：用户消息、助手占位、流式 token、结束态、错误态由同一条消息状态流管理。
- 补齐流式聊天测试：重点覆盖并发请求、占位消息清理、fallback、TTS 失败。
- 清理高频路径上的无效订阅，优先优化聊天区、HUD、控制面板的 store 订阅方式。

### Phase 2: 统一实时传输层

- 抽象 `chat transport` 接口，屏蔽 `POST /v1/chat`、`SSE /v1/chat/stream`、`WebSocket /ws` 的差异。
- 默认保留 SSE，WebSocket 作为增强模式接入，不把页面逻辑和具体传输协议绑定。
- 给 transport 增加连接态、重连策略、超时和 server capability 探测。
- 支持通过 `VITE_CHAT_TRANSPORT=http|sse|websocket` 切换策略，便于灰度验证。
- `auto` 模式下新增运行时 probe：优先尝试 WebSocket 握手，失败则回落到 SSE，再退化到 HTTP；当前结果同步到 `systemStore.chatTransportMode`。

### Phase 3: 拆分状态域

- 将当前 store 按 `session/chat`、`avatar/runtime`、`system/connection` 三个域拆分。
- 减少 3D 渲染状态和聊天 UI 状态的相互影响，降低页面级组件重渲染。
- 将可序列化状态和不可序列化运行时对象彻底分开。
- 当前已完成第一步：`sessionId/chatHistory` 与消息增删改逻辑已迁移到独立 `chatSessionStore`，`digitalHumanStore` 保留跨域协调动作 `initSession`。
- 当前已完成第二步：`error/isLoading/connectionStatus/isConnected` 已迁移到独立 `systemStore`，连接健康检查、聊天错误反馈、HUD 与输入区状态展示均已接入新域。

### Phase 4: 体验与性能优化

- Viewer 根据设备能力动态调节粒子数、阴影、DPR 和后处理开关。
- 为聊天区、设置面板、模型加载过程补充 skeleton/placeholder，减少跳变感。
- 增加前端性能埋点：首屏加载、模型加载耗时、首 token 时间、完整回复时间。
- 当前已完成首轮聊天指标采集：最近一次对话的 `firstTokenMs` 与 `responseCompleteMs` 已记录到 `systemStore.chatPerformance`，并在 `TopHUD` 中展示。

## 7. 本轮已落地优化

- 修复流式聊天占位消息 `id` 不一致导致的消息不更新问题。
- 修复流式结束回调重复触发问题，避免 UI 状态重复收尾。
- 聊天气泡在流式开始但尚未收到 token 时，展示明确的生成态文案。
- 聊天 hook 改为 selector 订阅，减少因 store 全量订阅带来的额外重渲染。
- 新增统一 `chat transport` 抽象，并让 orchestrator 改为依赖 transport 而不是直接依赖具体协议实现。
- 修复流式降级到 fallback 时丢失 `connectionStatus/error` 的问题。
- 抽离独立 `chatSessionStore`，将聊天消息与会话 ID 从 `digitalHumanStore` 中分域，降低聊天 UI 对主运行时 store 的耦合。
- 抽离独立 `systemStore`，将连接状态、加载态和错误态从 `digitalHumanStore` 中分域，进一步收窄主 store 职责边界。
- 新增 chat transport capability probe，并在健康检查时刷新自动选择结果，为后续 WebSocket 灰度与能力探测打基础。
- 抽离 `useAdvancedDigitalHumanController`，将高级页面的业务控制逻辑从布局组件中移出，降低页面组件复杂度并为后续 controller 测试留出边界。
- 增加聊天性能快照采集与 HUD 可视化，可直接观察最近一次请求的首 token 时间和完整响应时间。
