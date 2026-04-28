# AGENTS.md

AI 助手工作规范。

## OpenSpec 工作流

新功能开发必须遵循 OpenSpec 驱动流程：

| 命令                     | 用途               |
| ------------------------ | ------------------ |
| `/opsx:propose "<idea>"` | 创建变更提案       |
| `/opsx:explore`          | 探索问题、明确需求 |
| `/opsx:apply`            | 按任务清单实施     |
| `/opsx:archive`          | 归档已完成的变更   |

**关键目录：**

- `openspec/specs/` — 系统行为规范（真相来源）
- `openspec/changes/` — 活跃的变更提案
- `openspec/changes/archive/` — 已完成变更

**何时需要提案：** 新功能、行为变更、核心重构、新依赖。  
**可跳过：** 明确的 bug 修复、文档更新、配置调整、测试补充。

## 技术栈

- **框架：** React 19 + TypeScript
- **构建：** Vite 6
- **3D：** Three.js + React Three Fiber v9 + Drei
- **状态：** Zustand 5
- **样式：** Tailwind CSS 4
- **测试：** Vitest + Testing Library

**路径别名：** `@/*` → `src/*`

## 核心架构

```
pages/          → 路由级组件
  └── hooks/    → 业务逻辑 hooks
       └── core/ → 引擎服务
            └── store/ → Zustand 状态
```

**核心服务：**

| 服务         | 文件                                    | 职责                          |
| ------------ | --------------------------------------- | ----------------------------- |
| Avatar       | `core/avatar/DigitalHumanEngine.ts`     | 数字人控制门面                |
| Audio        | `core/audio/audioService.ts`            | TTS 合成、语音识别            |
| Dialogue     | `core/dialogue/dialogueService.ts`      | HTTP 客户端（重试/超时/降级） |
| Orchestrator | `core/dialogue/dialogueOrchestrator.ts` | 对话轮次编排                  |
| Vision       | `core/vision/visionService.ts`          | MediaPipe 面部/姿态推理       |

**状态存储：**

| Store               | 范围                   |
| ------------------- | ---------------------- |
| `chatSessionStore`  | 消息、会话 ID          |
| `systemStore`       | 连接、错误、性能指标   |
| `digitalHumanStore` | 数字人状态、音频、行为 |

## 关键模式

### Service → Store

服务通过 `useXStore.getState()` 读写 store，避免 props 传递：

```typescript
const { setSpeaking } = useDigitalHumanStore.getState();
setSpeaking(true);
```

### Store Selector

使用选择器最小化重渲染：

```typescript
// 推荐
const isPlaying = useDigitalHumanStore((s) => s.isPlaying);

// 避免
const { isPlaying, ...rest } = useDigitalHumanStore();
```

### 降级策略

所有外部调用必须有降级方案：

- 模型加载失败 → 程序化 CyberAvatar
- API 不可用 → 本地 mock 响应
- TTS 失败 → 纯文本显示
- Vision 失败 → 优雅禁用面板

## 开发命令

```bash
npm run dev          # 启动开发服务器 (端口 5173)
npm run build        # 生产构建
npm run typecheck    # TypeScript 检查
npm run lint         # ESLint 检查
npm run test:run     # 运行测试
npm run test:coverage # 覆盖率报告 (目标 ≥50%)
```

## 实施提示

- 主要修改 `AdvancedDigitalHumanPage`
- 数字人反应：检查 `DigitalHumanEngine.ts` + `dialogueOrchestrator.ts`
- 对话问题：检查 `dialogueService.ts` 重试/降级逻辑
- 事件监听器：必须在 `useEffect` 返回中清理
