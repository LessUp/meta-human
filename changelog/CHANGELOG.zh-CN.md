# 更新日志

MetaHuman Engine 版本更新日志。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [1.0.0] - 2025-04-16

### 🎉 首个稳定版本

MetaHuman Engine 首个稳定版本发布，功能完整。

### ✨ 新增

#### 核心功能

- **3D 数字人引擎** — Three.js 实时渲染，情绪驱动表情，骨骼动画
- **语音交互** — TTS 语音合成，ASR 语音识别（Web Speech API）
- **视觉感知** — MediaPipe 人脸网格和姿态估计，情绪/手势检测
- **对话系统** — OpenAI 兼容对话，支持 SSE 流式和 WebSocket

#### 架构

- **状态管理** — 三个独立 Zustand store：
  - `chatSessionStore` 消息历史
  - `systemStore` 连接/性能指标
  - `digitalHumanStore` 数字人运行时状态
- **传输抽象** — HTTP/SSE/WebSocket 统一接口，自动选择
- **设备能力检测** — 根据硬件等级自适应渲染

#### 性能优化

- 低端设备跳帧处理
- 标签页隐藏时暂停动画
- 自适应 DPR、阴影、粒子数
- 渲染性能追踪（FPS 指标）

### 🔧 变更

#### 代码质量

- 合并重复的可见性处理器为 `useIsTabVisibleRef` hook
- 提取 `rotateCameraHorizontal` 相机控制辅助函数
- 创建类型化常量 `TRANSPORT_LABELS`、`CONNECTION_STATUS_TEXT`
- 用结构化日志替换 `console.*` 调用
- 为键盘处理添加 `useCallback` 优化

#### 对话系统

- 添加 abort controller 支持请求取消
- 改进流式响应的中断清理
- 增强错误处理和优雅降级
- 统一对话轮次准备逻辑

#### 音频服务

- 增强 `dispose()` 清理防止内存泄漏
- ASR 服务添加预设定时器清理
- 改进回调的代际追踪

### 🐛 修复

- 事件监听器未清理导致的内存泄漏
- 过宽的 store 订阅导致不必要的重渲染
- 对话编排中的竞态条件
- TTS 误报错误
- 语音命令误触发
- WebSocket 异常处理
- 卸载后动画状态残留
- useEffect 无限重载问题

---

## 版本历史

### 2025-04-16 - v1.0.0 发布

**文档重构**

- 完全重写 README.md 和 README.zh-CN.md
- 创建完整的 docs/ 目录：
  - `index.md` / `index.zh-CN.md` — 文档首页
  - `api/` — API 参考（REST + WebSocket）
  - `guide/` — 用户指南
  - `architecture/` — 架构文档
  - `contributing/` — 贡献指南

**代码改进**

- 设备能力检测系统
- 渲染性能追踪
- 模型加载指标
- 对话取消支持

### 2025-03-18 - 架构重构

**状态域拆分**

- 从主 store 分离 `chatSessionStore`
- 分离 `systemStore` 用于连接/错误状态
- 降低跨域耦合

**传输层**

- 抽象 `ChatTransport` 接口
- 实现 HTTP、SSE、WebSocket 传输
- 自动探测能力检测

**控制器提取**

- 创建 `useAdvancedDigitalHumanController` hook
- 降低页面组件复杂度

### 2025-02-25 - 功能增强

**SSE 流式**

- 前端集成 SSE 流式对话
- 渐进式消息显示
- 逐字渲染

**性能指标**

- 添加 `firstTokenMs` 追踪
- 添加 `responseCompleteMs` 追踪
- HUD 指标可视化

### 2025-01-24 - 语音音频集成

**TTS 服务**

- Web Speech API 集成
- 队列管理
- 中断支持

**ASR 服务**

- 浏览器原生语音识别
- 命令模式 vs 听写模式
- 语音活动检测

### 2025-01-23 - UI 重构

**组件结构**

- `DigitalHumanViewer` - 3D 视口，程序化兜底
- `ChatDock` - 聊天界面，流式支持
- `TopHUD` - 状态栏，指标展示
- `ControlPanel` - 快捷操作
- `SettingsDrawer` - 分页设置

**样式**

- Tailwind CSS 集成
- 深色模式支持
- 响应式布局

---

## 版本规范

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)：

- **主版本号** - 不兼容的 API 变更
- **次版本号** - 向后兼容的新功能
- **修订号** - 向后兼容的问题修复

---

## 升级指南

### 升级到 v1.0.0

**状态 Store 变更**

如果之前直接使用 `digitalHumanStore` 获取聊天历史：

```typescript
// 之前
const chatHistory = useDigitalHumanStore((s) => s.chatHistory);

// 之后
const chatHistory = useChatSessionStore((s) => s.chatHistory);
```

**传输配置**

新增环境变量选择传输方式：

```bash
# .env.local
VITE_CHAT_TRANSPORT=auto  # 选项: http, sse, websocket, auto
```

**日志使用**

用结构化日志替换 console 调用：

```typescript
// 之前
console.log('message');

// 之后
import { loggers } from '@/lib/logger';
const logger = loggers.app;
logger.info('message');
```

---

## 链接

- [发布说明](./RELEASE_NOTES.md)
- [详细发布说明 v1.0.0](./releases/v1.0.0.zh-CN.md)

---

[1.0.0]: https://github.com/LessUp/meta-human/releases/tag/v1.0.0
