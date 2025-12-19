# MetaHuman 架构统一 + UI/UX 升级 + 文档重构

**日期**: 2025-12-18  
**类型**: 架构整合、体验升级、文档重构

---

## 概述

本次迭代聚焦于：

- 统一前后端接口契约与状态模型，消除代码/设计/文档不一致。
- 提升前端 UI/UX（视觉一致性、交互细节、可用性、可访问性）。
- 补齐项目中标记的 TODO/未完成能力，并让现有功能形成稳定闭环。
- 重构 `.trae/documents` 与 `docs` 文档体系，保留与当前实现一致的设计/实现文档。

---

## 变更记录

### 1) 架构与契约统一

- 清理对话服务重试过程中的调试输出，减少运行时噪音。
- 后端：规范化 `OPENAI_BASE_URL`，自动补全 `/v1/chat/completions`（兼容传入域名/`/v1`/完整路径等多种形式），并增强 LLM 请求错误日志（URL、状态码、响应摘要）。

### 2) 前端 UI/UX 升级

- Advanced 面板顶部增加“新会话”快捷入口，用于一键触发 `initSession()` 并清空输入。
- 修复快捷键监听逻辑的声明顺序问题，避免 TypeScript 在 hook 依赖中出现“声明之前使用”的报错。

### 3) 功能补齐 / TODO 完成

- `VoiceInteractionPanel`：`onSpeak` 改为可选回调（避免无意义的测试日志依赖）。
- `VoiceInteractionPanel`：录音/静音状态改为与全局 store 同步，消除“面板内状态 vs 全局状态”不一致。
- `AdvancedDigitalHumanPage`：移除 `VoiceInteractionPanel` 的 TTS 测试 `console.log` 回调，避免“假功能”。

### 4) 文档重构与清理

- 删除 `docs/` 与 `.trae/documents/` 中与当前 Demo/SDK 实现不一致的过期文档，避免“文档承诺 > 代码能力”的误导。
- `docs/`：重建精简、可落地的文档集合：
  - `docs/architecture.md`：以当前代码为准的前后端/核心模块架构说明与数据流。
  - `docs/development.md`：前后端本地运行、环境变量与浏览器能力说明。
  - `docs/api.md`：后端 `/health` 与 `/v1/chat` 的最小契约与回退策略说明。
- `.trae/documents/`：重写与当前实现一致的精简 PRD 与技术架构：
  - `digital-human-prd.md`：明确 Demo/SDK 定位、关键路径、非目标。
  - `digital-human-technical-architecture.md`：以实际目录结构/接口契约为准的架构说明。

### 5) 工程清理

- 移除 ASR 识别结果、视觉单帧异常等 `console.log/console.debug` 调试输出（保留必要的 `console.error/warn`）。
- 删除未使用文件：`src/pages/Home.tsx`、`src/components/Empty.tsx`。
- 安装前端依赖（`npm ci`），修复缺失的 `node_modules` 导致的类型/模块解析错误。
- `DigitalHumanViewer`：`GLTFLoader` 引入补全 `.js` 扩展名，兼容 `tsconfig` 的 `moduleResolution: bundler`。
- `DigitalHumanViewer`：修复模型加载失败回调参数为 `unknown` 时访问 `error.message` 的类型错误，保证 `npm run build` 通过。
