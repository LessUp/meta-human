# 架构概览

MetaHuman Engine 系统设计和数据流。

---

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                          UI 层                                   │
│   页面 → 组件 → Hooks → Store                                   │
│   React · TypeScript · Tailwind CSS                             │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        核心引擎层                                │
│   数字人 · 对话 · 视觉 · 音频 · 性能                            │
│   Three.js · Web Speech API · MediaPipe                         │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         状态层                                   │
│   chatSessionStore · systemStore · digitalHumanStore            │
│   Zustand · Immer · Persist                                     │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        外部服务                                  │
│   OpenAI API · Edge TTS · Whisper ASR · FastAPI                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 层职责

### UI 层

**职责：** 渲染界面，处理用户交互

**关键组件：**

| 组件 | 文件 | 用途 |
|------|------|------|
| `DigitalHumanViewer` | `components/DigitalHumanViewer.tsx` | 3D 视口和数字人渲染 |
| `ChatDock` | `components/ChatDock.tsx` | 支持流式的聊天界面 |
| `TopHUD` | `components/TopHUD.tsx` | 状态栏和指标 |
| `ControlPanel` | `components/ControlPanel.tsx` | 快捷操作面板 |
| `SettingsDrawer` | `components/SettingsDrawer.tsx` | 配置面板 |

### 核心引擎层

**职责：** 业务逻辑和领域特定操作

**模块：**

| 模块 | 入口 | 用途 |
|------|------|------|
| 数字人 | `core/avatar/DigitalHumanEngine.ts` | 3D 渲染和动画 |
| 对话 | `core/dialogue/dialogueService.ts` | 对话传输和编排 |
| 视觉 | `core/vision/visionService.ts` | 人脸和姿态检测 |
| 音频 | `core/audio/ttsService.ts` | 语音合成和识别 |
| 性能 | `core/performance/deviceCapability.ts` | 硬件优化 |

### 状态层

**职责：** 应用状态管理

**Store：**

| Store | 文件 | 职责 |
|-------|------|------|
| `chatSessionStore` | `store/chatSessionStore.ts` | 消息历史、会话生命周期 |
| `systemStore` | `store/systemStore.ts` | 连接、错误、性能 |
| `digitalHumanStore` | `store/digitalHumanStore.ts` | 数字人运行时状态 |

### 外部服务

**职责：** 后端 API 和第三方集成

| 服务 | 协议 | 用途 |
|------|------|------|
| 对话 API | HTTP/SSE/WebSocket | AI 对话 |
| TTS | HTTP | 语音合成 |
| ASR | HTTP | 语音识别 |
| 健康检查 | HTTP | 服务状态 |

---

## 数据流

### 文字对话流

```
用户输入文字
       │
       ▼
ChatDock.handleSend()
       │
       ▼
useChatStream.handleChatSend()
       │
       ▼
runDialogueTurnStream()
       │
       ├──► chatSessionStore.addMessage('user', text)
       ├──► chatSessionStore.addMessage('assistant', '', streaming)
       │
       ▼
chatTransport.stream()
       │
       ├──► onStreamToken → updateMessage(id, text)
       └──► onDone → apply response.emotion, response.action
              │
              ▼
       ttsService.speak(replyText) [如启用]
              │
              ▼
       digitalHumanEngine.perform({ emotion, action })
```

### 语音输入流

```
用户点击录音
       │
       ▼
asrService.start()
       │
       ▼
用户说话
       │
       ▼
onResult(text)
       │
       ▼
handleChatSend(text) → [同文字流]
```

### 视觉流

```
用户启用摄像头
       │
       ▼
visionService.start()
       │
       ▼
MediaPipe 推理（每帧）
       │
       ▼
visionMapper.mapFaceToEmotion(landmarks)
       │
       ▼
{ emotion, motion }
       │
       ├──► digitalHumanEngine.setEmotion(emotion)
       └──► digitalHumanEngine.playAnimation(motion)
```

---

## 状态管理

### Store 分离策略

```typescript
// ❌ 之前：单体 Store
const useDigitalHumanStore = create(() => ({
  chatHistory: [],      // 对话域
  connectionStatus: '', // 系统域
  isPlaying: false,     // 数字人域
}));

// ✅ 之后：聚焦 Store
const useChatSessionStore = create(() => ({
  chatHistory: [],      // 仅对话
}));

const useSystemStore = create(() => ({
  connectionStatus: '', // 仅系统
}));

const useDigitalHumanStore = create(() => ({
  isPlaying: false,     // 仅数字人
}));
```

**好处：**
- 最小化重渲染
- 清晰的职责边界
- 易于测试和调试
- 独立持久化

### Store 交互

```
┌──────────────────┐     ┌──────────────────┐
│ chatSessionStore │◄────│   对话组件        │
│  - chatHistory   │     │  - ChatDock      │
│  - sessionId     │     │  - MessageList   │
└──────────────────┘     └──────────────────┘
         │                        │
         │ addMessage()           │ handleSend()
         ▼                        ▼
┌──────────────────────────────────────────┐
│          dialogueOrchestrator            │
└──────────────────────────────────────────┘
         │                        ▲
         ▼                        │
┌──────────────────┐     ┌──────────────────┐
│ digitalHumanStore│────►│   数字人组件      │
│  - emotion       │     │  - Viewer        │
│  - animation     │     │  - Controls      │
└──────────────────┘     └──────────────────┘
         │
         ▼
┌──────────────────┐
│  systemStore     │
│  - status        │
│  - errors        │
└──────────────────┘
```

---

## 传输抽象

### 传输接口

```typescript
interface ChatTransport {
  // 发送消息并接收完整响应
  send(message: ChatMessage): Promise<ChatResponse>;
  
  // 发送消息并接收流式响应
  stream(
    message: ChatMessage,
    callbacks: StreamCallbacks
  ): Promise<void>;
  
  // 检查可用性
  probe(): Promise<boolean>;
}
```

### 传输层次

```
ChatTransport (接口)
    │
    ├── HTTPTransport
    │   └── POST /v1/chat
    │
    ├── SSETransport
    │   └── POST /v1/chat/stream
    │   └── EventSource
    │
    └── WebSocketTransport
        └── WebSocket /ws
```

### 自动选择优先级

```typescript
async function selectTransport(): Promise<ChatTransport> {
  // 1. 尝试 WebSocket（延迟最低）
  if (await wsTransport.probe()) {
    return wsTransport;
  }
  
  // 2. 尝试 SSE（支持流式）
  if (await sseTransport.probe()) {
    return sseTransport;
  }
  
  // 3. 降级到 HTTP（通用）
  return httpTransport;
}
```

---

## 性能优化

### 自适应渲染

设备等级检测和质量调整：

```typescript
// core/performance/deviceCapability.ts
export const deviceTiers = {
  high: {
    shadows: 2048,
    particles: 100,
    dpr: [1, 2],
    postProcessing: true,
  },
  medium: {
    shadows: 1024,
    particles: 50,
    dpr: [1, 1.5],
    postProcessing: false,
  },
  low: {
    shadows: false,
    particles: 20,
    dpr: [1, 1.2],
    postProcessing: false,
  },
};
```

### 动画节流

```typescript
// 标签页不可见时暂停
useIsTabVisibleRef((isVisible) => {
  if (!isVisible) {
    digitalHumanEngine.pause();
  } else {
    digitalHumanEngine.resume();
  }
});

// 低端设备跳帧
if (deviceTier === 'low' && frameCount % 2 !== 0) {
  return; // 跳过每第二帧
}
```

### 状态优化

```typescript
// ✅ 好：仅订阅需要的值
const isPlaying = useDigitalHumanStore((s) => s.isPlaying);

// ❌ 坏：订阅整个 store
const store = useDigitalHumanStore();
```

---

## 错误处理

### 降级链

```
1. 尝试主操作
       │
       ▼ (失败)
2. 尝试降级操作
       │
       ▼ (失败)
3. 显示用户友好消息
4. 保持应用功能
```

### 降级矩阵

| 操作 | 主方案 | 降级方案 | 最后手段 |
|------|--------|----------|----------|
| 对话 API | OpenAI | 本地模拟 | 错误消息 |
| 3D 模型 | GLB 文件 | 程序化形象 | 占位符 |
| TTS | Web Speech | 静默（文字） | — |
| 视觉 | MediaPipe | 面板禁用 | — |

---

## 扩展点

### 添加新情绪

1. 在 `store/digitalHumanStore.ts` 添加类型
2. 在 `core/avatar/constants.ts` 添加映射
3. 在 `ExpressionControlPanel.tsx` 添加 UI 选项

### 添加新动画

1. 在 `store/digitalHumanStore.ts` 添加类型
2. 在 `DigitalHumanViewer.tsx` CyberAvatar 组件中实现
3. 在 `DigitalHumanEngine.ts` 添加触发

### 添加新传输

1. 实现 `ChatTransport` 接口
2. 添加到传输注册表
3. 更新自动选择逻辑

---
