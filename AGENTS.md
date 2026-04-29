# AGENTS.md

MetaHuman Engine — AI 助手开发规范。

## 技术栈

| 层级     | 技术                                   | 版本      |
| -------- | -------------------------------------- | --------- |
| 框架     | React + TypeScript                     | 19 / 5.8  |
| 构建     | Vite                                   | 6         |
| 3D 渲染  | Three.js + React Three Fiber + Drei    | 0.177 / 9 |
| 状态管理 | Zustand（devtools 中间件）             | 5         |
| 样式     | Tailwind CSS（Vite 插件 `@tailwindcss/vite`） | 4         |
| 测试     | Vitest + Testing Library + jsdom       | 3.2       |
| 代码质量 | ESLint 9 + Prettier 3 + Husky + lint-staged | -  |

**路径别名**：`@/*` → `src/*`（在 `vite.config.ts` 和 `tsconfig.json` 中配置）

## 核心架构

```
src/
├── pages/           → 路由级页面组件（LandingPage, AdvancedDigitalHumanPage）
├── components/      → UI 组件（DigitalHumanViewer, ChatDock, TopHUD...）
│   ├── landing/     → 落地页专用组件
│   └── ui/          → 通用 UI 原语（ErrorBoundary, LoadingSpinner）
├── hooks/           → 业务逻辑 Hooks
├── core/            → 引擎服务层（无 React 依赖）
│   ├── avatar/      → 3D 数字人引擎（DigitalHumanEngine + 常量）
│   ├── audio/       → TTS/ASR 服务（audioService.ts）
│   ├── dialogue/    → 对话服务链（dialogueService → chatTransport → wsClient）
│   ├── vision/      → MediaPipe 面部/姿态推理（visionService + visionMapper）
│   └── performance/ → 设备能力检测
├── store/           → Zustand 状态存储
│   ├── chatSessionStore.ts  → 消息历史、会话 ID、本地持久化
│   ├── systemStore.ts       → 连接状态、性能指标、错误节流
│   └── digitalHumanStore.ts → 数字人状态（表情、动画、行为）
└── lib/             → 工具函数（logger, utils, voiceCommands）
```

## 核心服务

| 服务             | 文件                                      | 职责                                    |
| ---------------- | ----------------------------------------- | --------------------------------------- |
| DigitalHumanEngine | `core/avatar/DigitalHumanEngine.ts`     | 数字人控制门面（表情/动画/行为编排）    |
| DialogueService  | `core/dialogue/dialogueService.ts`        | HTTP 客户端（重试 3 次/超时 15s/降级）  |
| ChatTransport    | `core/dialogue/chatTransport.ts`          | 传输层抽象（HTTP/SSE/WebSocket 自动探测）|
| DialogueOrchestrator | `core/dialogue/dialogueOrchestrator.ts` | 对话轮次编排（并发控制/中止）          |
| AudioService     | `core/audio/audioService.ts`              | TTS 合成 + ASR 识别                    |
| VisionService    | `core/vision/visionService.ts`            | MediaPipe 面部/姿态推理                |

## 关键模式

### Service → Store（核心数据流）

服务通过 `useXStore.getState()` 读写 store，避免 props 传递：

```typescript
const { setSpeaking } = useDigitalHumanStore.getState();
setSpeaking(true);
```

### Store Selector（性能关键）

使用选择器最小化重渲染：

```typescript
// ✅ 推荐：精确选择
const isPlaying = useDigitalHumanStore((s) => s.isPlaying);

// ❌ 避免：解构全部状态
const { isPlaying, ...rest } = useDigitalHumanStore();
```

### 降级策略（必须遵守）

所有外部调用必须有降级方案：

| 失败场景         | 降级行为                    |
| ---------------- | --------------------------- |
| 模型加载失败     | 程序化 CyberAvatar          |
| API 不可用       | 本地 mock 响应（离线模式）  |
| TTS 失败         | 纯文本显示                  |
| Vision 失败      | 优雅禁用面板                |
| WebSocket 不可用 | 回退到 SSE → HTTP           |

### 对话轮次所有权

`dialogueOrchestrator.ts` 使用 `turnId` 实现轮次隔离：
- 每个新轮次分配递增 ID
- `finalizeDialogueTurn` 仅在当前 turnId 匹配时执行清理
- 并发请求被静默忽略（不排队）

## 文件变更影响矩阵

| 修改文件 | 必须同步检查 |
|---------|-------------|
| `dialogueService.ts` | `chatTransport.ts`, `dialogueOrchestrator.ts`, 相关测试 |
| `chatSessionStore.ts` | `useChatStream.ts`, `useAdvancedDigitalHumanController.ts` |
| `systemStore.ts` | `useConnectionHealth.ts`, `TopHUD.tsx` |
| `DigitalHumanEngine.ts` | `constants.ts`, `digitalHumanStore.ts`, `useAdvancedDigitalHumanController.ts` |
| `index.css` | 所有使用自定义 CSS 变量的组件 |

## 开发命令

```bash
npm run dev          # 启动开发服务器 (端口 5173)
npm run build        # 生产构建
npm run build:pages  # GitHub Pages 部署构建
npm run typecheck    # TypeScript 类型检查
npm run lint         # ESLint 检查（0 warnings 策略）
npm run lint:fix     # 自动修复
npm run test:run     # 运行测试
npm run test:coverage # 覆盖率报告 (阈值: lines≥40%)
npm run format       # Prettier 格式化
```

## 禁止行为

- ❌ 不要创建新的 Git 分支（所有工作在 master 上进行）
- ❌ 不要添加新的运行时依赖（除非经过明确讨论）
- ❌ 不要在 `core/` 目录引入 React 依赖
- ❌ 不要在组件中直接调用 `fetch`（使用 `dialogueService`）
- ❌ 不要跳过 `useEffect` 的清理返回
- ❌ 不要使用 `any` 类型（测试文件除外）

## 调试指南

| 症状 | 排查路径 |
|------|---------|
| 页面白屏 | `ErrorBoundary` → Console → `main.tsx` 路由 |
| 对话无响应 | `dialogueService` 重试日志 → `chatTransport` 模式 → 网络面板 |
| 3D 渲染异常 | `DigitalHumanViewer` → WebGL 支持 → `deviceCapability` |
| 语音不工作 | 浏览器兼容性（仅 Chrome/Edge） → `audioService` 初始化 |
| 状态不同步 | Zustand devtools → store selector 是否正确 |
