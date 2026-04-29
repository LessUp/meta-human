# MetaHuman 数字人引擎

<p align="center">
  <img src="public/favicon.svg" width="120" alt="MetaHuman Engine" />
</p>

<p align="center">
  <strong>让 AI 拥有实时互动的数字身躯</strong>
</p>

<p align="center">
  基于浏览器的 3D 数字人引擎，集成语音、视觉、对话能力
  <br />
  <strong>零配置</strong> · <strong>离线可用</strong> · <strong>生产级</strong>
</p>

<p align="center">
  <a href="https://github.com/LessUp/meta-human/actions"><img src="https://img.shields.io/github/actions/workflow/status/LessUp/meta-human/ci.yml?branch=master&label=CI&style=flat-square" alt="CI 状态" /></a>
  <a href="https://lessup.github.io/meta-human/"><img src="https://img.shields.io/badge/Demo-在线-green?style=flat-square&logo=githubpages" alt="在线演示" /></a>
  <a href="https://github.com/LessUp/meta-human/releases"><img src="https://img.shields.io/github/v/release/LessUp/meta-human?style=flat-square&label=版本" alt="版本" /></a>
  <img src="https://img.shields.io/badge/Bundle-~240KB(gzip)-blue?style=flat-square&label=size" alt="包体积" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Three.js-0.177-000000?style=flat-square&logo=threedotjs&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="许可证" /></a>
</p>

<p align="center">
  <a href="#quick-start"><strong>快速开始</strong></a> ·
  <a href="#features"><strong>功能</strong></a> ·
  <a href="#performance"><strong>性能</strong></a> ·
  <a href="#architecture"><strong>架构</strong></a> ·
  <a href="docs/"><strong>文档</strong></a> ·
  <a href="CHANGELOG.md"><strong>更新日志</strong></a> ·
  <a href="README.md"><strong>English</strong></a>
</p>

---

## ✨ 在线演示

🚀 **[立即体验 →](https://lessup.github.io/meta-human/)**

> 在浏览器中直接体验完整的交互式 3D 数字人。
> 无需安装或 API Key！

---

## 📸 预览

<p align="center">
  <img src="docs/assets/preview.svg" width="800" alt="MetaHuman Engine 预览 - 情绪驱动的 3D 数字人和实时对话" />
</p>

<p align="center">
  <em>情绪驱动的 3D 数字人和实时对话</em>
</p>

---

## 🚀 Quick Start

### 前提条件

- Node.js ≥ 22
- npm ≥ 10

### 安装

```bash
# 克隆并安装
git clone https://github.com/LessUp/meta-human.git
cd meta-human
npm install

# 启动开发服务器
npm run dev
```

打开 **http://localhost:5173** —— 你的 3D 数字人已就绪！

> 💡 **无需 API Key。** 引擎自动降级到本地模拟模式，开箱即用。

---

## 🎯 Features

### 🎭 3D 数字人引擎

<table>
<tr>
<td width="50%">

| 功能          | 说明                               |
| ------------- | ---------------------------------- |
| GLB/GLTF 支持 | 加载自定义模型或使用内置程序化形象 |
| 情绪驱动      | 高兴、惊讶、悲伤、愤怒自动映射表情 |
| 骨骼动画      | 挥手、问候、点头、跳舞，由对话触发 |
| 自适应性能    | 60fps 渲染，根据设备能力调节画质   |

</td>
<td>

```typescript
import { digitalHumanEngine } from './core/avatar';

digitalHumanEngine.perform({
  emotion: 'happy',
  expression: 'smile',
  animation: 'wave',
});
```

**注意：** 本项目使用 Vite 路径别名。详见 [路径别名](#path-aliases) 配置。

</td>
</tr>
</table>

### 🗣️ 语音交互

| 功能         | 说明                        |
| ------------ | --------------------------- |
| TTS 语音合成 | Edge TTS 提供自然流畅的语音 |
| ASR 语音识别 | 浏览器原生语音转文字        |
| 智能静音     | 用户说话时自动暂停播报      |
| 语音检测     | 录音时提供视觉反馈          |

```typescript
import { ttsService, asrService } from './core/audio';

await ttsService.speak('你好！有什么可以帮您？');

asrService.start({
  onResult: (text) => dialogueService.send(text),
});
```

### 🧠 智能对话

| 功能       | 说明                                  |
| ---------- | ------------------------------------- |
| 多模态响应 | 返回 `{ replyText, emotion, action }` |
| 流式输出   | 通过 SSE 实时逐字响应                 |
| 优雅降级   | API 不可用时自动回退 Mock             |
| 会话管理   | 持久化对话上下文                      |

```typescript
import { dialogueService } from './core/dialogue';

const response = await dialogueService.send({
  text: '讲个笑话',
  sessionId: 'user-123',
});
// → { replyText: '...', emotion: 'happy', action: 'laugh' }
```

### 👁️ 视觉感知

| 功能     | 说明                         |
| -------- | ---------------------------- |
| 人脸网格 | 468 个关键点捕捉微表情       |
| 姿态估计 | 上半身手势识别               |
| 情绪映射 | 实时情绪推断                 |
| 隐私优先 | 全部在浏览器处理，数据不上传 |

---

## ⚡ Performance

典型设备上的性能基准：

| 指标         | 桌面端           | 移动端（中端） | 移动端（低端） |
| ------------ | ---------------- | -------------- | -------------- |
| **渲染性能** | 60 FPS           | 60 FPS         | 30 FPS         |
| **TTS 延迟** | < 200ms          | < 300ms        | < 500ms        |
| **包体积**   | 180 KB (gzipped) | 180 KB         | 180 KB         |
| **内存占用** | ~120 MB          | ~80 MB         | ~60 MB         |

> 性能根据设备能力自动调节。详见[性能模块文档](docs/architecture/)。

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          UI 层                                   │
│   ChatDock · TopHUD · ControlPanel · SettingsDrawer             │
└─────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                        核心引擎层                                │
│   Avatar · Dialogue · Vision · Audio · Performance              │
└─────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                         状态层                                   │
│   chatSessionStore · systemStore · digitalHumanStore            │
└─────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                        外部服务                                  │
│   Three.js · Web Speech API · MediaPipe · OpenAI API            │
└─────────────────────────────────────────────────────────────────┘
```

### 状态管理

三个独立域，最小化重渲染：

| Store               | 职责                                 |
| ------------------- | ------------------------------------ |
| `chatSessionStore`  | 消息历史、会话生命周期               |
| `systemStore`       | 连接状态、错误、性能指标             |
| `digitalHumanStore` | 数字人运行时状态（表情、动画、音频） |

**[📖 架构文档 →](docs/architecture/)**

---

## 📁 项目结构

```
src/
├── core/                          # 引擎模块
│   ├── avatar/                    # 3D 渲染与动画
│   │   ├── DigitalHumanEngine.ts  # 统一驱动入口
│   │   └── constants.ts           # 表情、动作常量
│   ├── audio/                     # TTS & ASR 服务
│   ├── dialogue/                  # 对话传输与编排
│   │   ├── dialogueService.ts     # API 客户端
│   │   ├── dialogueOrchestrator.ts
│   │   └── chatTransport.ts       # HTTP/SSE/WebSocket
│   ├── vision/                    # MediaPipe 管道
│   │   ├── visionService.ts
│   │   └── visionMapper.ts
│   └── performance/               # 设备能力检测
├── components/                    # React 组件
│   ├── DigitalHumanViewer.tsx     # 3D 视口
│   ├── ChatDock.tsx               # 聊天界面
│   ├── TopHUD.tsx                 # 状态栏
│   ├── ControlPanel.tsx           # 快捷控制
│   ├── VoiceInteractionPanel.tsx
│   ├── VisionMirrorPanel.tsx
│   └── ui/                        # 共享原语
├── store/                         # Zustand 状态
│   ├── chatSessionStore.ts
│   ├── systemStore.ts
│   └── digitalHumanStore.ts
├── hooks/                         # 自定义 Hooks
├── pages/                         # 路由页面
└── lib/                           # 工具函数
```

### 路径别名

本项目使用 Vite 路径别名，配置在 `vite.config.ts` 和 `tsconfig.json`：

| 别名   | 映射路径 |
| ------ | -------- |
| `@/*`  | `src/*`  |

---

## 🌐 部署

### GitHub Pages（前端）

```bash
npm run build:pages
```

1. 在 GitHub 仓库变量中设置 `VITE_API_BASE_URL`
2. 推送到 `master` — CI 自动部署
3. 访问：`https://lessup.github.io/meta-human/`

**[📖 部署指南 →](docs/guide/installation.zh-CN.md)**

---

## 🛠️ 脚本

### 开发

```bash
npm run dev              # 启动开发服务器（端口 5173）
npm run preview          # 预览生产构建
npm run preview:https    # HTTPS 预览
```

### 构建

```bash
npm run build            # 生产构建
npm run build:pages      # GitHub Pages 构建
npm run build:mobile     # 移动端优化构建
npm run build:desktop    # 桌面端优化构建
npm run build:ar         # AR 功能构建
npm run build:analyze    # 构建并分析包体积
```

### 质量

```bash
npm run lint             # ESLint 检查
npm run lint:fix         # 自动修复
npm run format           # Prettier 格式化
npm run format:check     # 仅检查格式化
npm run typecheck        # TypeScript 检查
```

### 测试

```bash
npm run test             # Vitest 监听模式
npm run test:run         # 运行一次
npm run test:coverage    # 覆盖率报告
npm run test:ui          # Vitest UI 模式
```

---

## 🧰 浏览器支持

| 功能            | Chrome | Edge   | Firefox   | Safari    |
| --------------- | ------ | ------ | --------- | --------- |
| 核心引擎        | 90+ ✅ | 90+ ✅ | 90+ ✅    | 15+ ✅    |
| TTS（语音合成） | 90+ ✅ | 90+ ✅ | 90+ ✅    | 15+ ✅    |
| ASR（语音识别） | 90+ ✅ | 90+ ✅ | ❌ 不支持 | ❌ 不支持 |
| MediaPipe 视觉  | 90+ ✅ | 90+ ✅ | 90+ ✅    | 15+ ⚠️    |

> **ASR 限制：** 语音识别功能需要 Chrome 或 Edge 浏览器。Firefox 和 Safari 用户可使用文字输入。

> **Safari 提示：** MediaPipe 视觉功能可能需要开启实验性功能。

---

## 📚 文档

- **[快速开始](docs/guide/)** — 5 分钟快速上手
- **[API 参考](docs/api/)** — 后端 API 文档
- **[架构设计](docs/architecture/)** — 系统设计
- **[配置说明](docs/guide/configuration.zh-CN.md)** — 环境变量与设置
- **[贡献指南](docs/contributing/)** — 贡献指南
- **[更新日志](CHANGELOG.md)** — 版本历史

---

## 🛣️ 路线图

查看 [CHANGELOG.md](CHANGELOG.md) 了解已发布功能，或访问 [GitHub Projects](https://github.com/LessUp/meta-human/projects) 了解开发计划。

- [x] 核心 3D 数字人渲染
- [x] 语音交互（TTS/ASR）
- [x] 视觉感知（MediaPipe）
- [x] 流式对话
- [ ] 移动端 AR 支持
- [ ] 自定义形象上传
- [ ] 多语言 TTS

---

## 🤝 贡献

我们欢迎贡献！请查看我们的[贡献指南](docs/contributing/)。

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feat/amazing-feature`
3. 提交变更：`git commit -m 'feat: add amazing feature'`
4. 推送：`git push origin feat/amazing-feature`
5. 发起 Pull Request

遵循 [Conventional Commits](https://www.conventionalcommits.org/lang/zh-CN/) 规范。

---

## 📄 许可证

[MIT](LICENSE) © LessUp

---

<p align="center">
  <strong>用 ❤️ 打造，让每个人都能拥有自己的数字人</strong>
</p>

<p align="center">
  <a href="https://github.com/LessUp/meta-human/stargazers">⭐ 在 GitHub 上星标</a> ·
  <a href="https://x.com/LessUpHQ">🐦 关注 X</a>
</p>
