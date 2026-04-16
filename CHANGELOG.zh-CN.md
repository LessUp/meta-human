# 更新日志

本文档记录 MetaHuman Engine 的所有显著变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [1.0.0] - 2025-04-16

### 🎉 首个稳定版本

MetaHuman Engine 首个稳定版本发布，功能完整，文档全面。

### ✨ 新增

#### 核心功能

- **3D 数字人引擎** — Three.js 实时渲染，情绪驱动表情，骨骼动画
- **语音交互** — Web Speech API 语音合成和识别
- **视觉感知** — MediaPipe 人脸网格和姿态估计，情绪/手势检测
- **对话系统** — 支持流式（SSE）和 WebSocket 的 OpenAI 兼容对话

#### 架构

- **状态管理** — 三个独立的 Zustand store：
  - `chatSessionStore` 消息历史
  - `systemStore` 连接/性能指标
  - `digitalHumanStore` 数字人运行时状态
- **传输抽象** — HTTP/SSE/WebSocket 统一接口，自动选择
- **设备能力检测** — 根据硬件等级自适应渲染

#### 性能

- 低端设备跳帧处理
- 标签页隐藏时暂停动画
- 自适应 DPR、阴影、粒子数
- 渲染性能跟踪（FPS 指标）

### 🔧 变更

#### 代码质量

- 合并重复的可见性处理器为 `useIsTabVisibleRef` hook
- 提取 `rotateCameraHorizontal` 相机控制辅助函数
- 创建类型化常量 `TRANSPORT_LABELS` 和 `CONNECTION_STATUS_TEXT`
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

## [0.9.0] - 2025-03-18

### 新增

- 架构重构，状态域分离
- 抽象 `ChatTransport` 接口
- HTTP、SSE 和 WebSocket 传输实现
- `useAdvancedDigitalHumanController` hook

---

## [0.8.0] - 2025-02-25

### 新增

- SSE 流式对话集成
- 渐进式消息显示
- `firstTokenMs` 和 `responseCompleteMs` 性能跟踪

---

## [0.7.0] - 2025-01-24

### 新增

- Web Speech API TTS 集成
- 队列管理和中断支持
- 浏览器原生语音识别（ASR）
- 命令模式与听写模式

---

## [0.6.0] - 2025-01-23

### 新增

- 组件结构：`DigitalHumanViewer`、`ChatDock`、`TopHUD`、`ControlPanel`
- Tailwind CSS 集成
- 深色模式支持
- 响应式布局

---

## 版本规范

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)：

- **主版本号** — 不兼容的 API 变更
- **次版本号** — 向后兼容的新功能
- **修订号** — 向后兼容的问题修复

---

## 升级指南

查看 [releases/v1.0.0.zh-CN.md](./changelog/releases/v1.0.0.zh-CN.md) 了解详细的迁移说明。

---

[1.0.0]: https://github.com/LessUp/meta-human/releases/tag/v1.0.0
[0.9.0]: https://github.com/LessUp/meta-human/releases/tag/v0.9.0
[0.8.0]: https://github.com/LessUp/meta-human/releases/tag/v0.8.0
[0.7.0]: https://github.com/LessUp/meta-human/releases/tag/v0.7.0
[0.6.0]: https://github.com/LessUp/meta-human/releases/tag/v0.6.0
