<p align="center">
  <img src="public/favicon.svg" width="80" alt="MetaHuman Engine" />
</p>

<h1 align="center">MetaHuman Engine</h1>

<p align="center">
  基于 Web 技术的实时 3D 数字人交互引擎
</p>

<p align="center">
  <a href="README.md">English</a> | <strong>简体中文</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61dafb?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Three.js-r158-black?logo=threedotjs" alt="Three.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5-646cff?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
</p>

---

## 概述

MetaHuman Engine 是一个模块化的浏览器端数字人交互引擎，提供 **3D 虚拟形象渲染**、**语音对话**、**视觉感知** 和 **行为控制** 等核心能力。适用于虚拟客服、直播数字人、教育助手等场景。

## 核心特性

| 模块 | 能力 | 技术方案 |
|------|------|----------|
| **Avatar** | 3D 实时渲染、表情控制、骨骼动画 | Three.js + React Three Fiber |
| **Audio** | TTS 语音合成、ASR 语音识别 | Web Speech API |
| **Dialogue** | 多轮对话、本地降级、流式响应（预留） | REST API + 重试机制 |
| **Vision** | 人脸情感分析、头部动作检测、手势识别 | MediaPipe Face Mesh & Pose |

## 快速开始

### 环境要求

- **Node.js** ≥ 18.0.0
- **npm** ≥ 9.0.0

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/LessUp/meta-human.git
cd meta-human

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 环境变量

复制 `.env.example` 为 `.env.local`，按需修改：

```bash
cp .env.example .env.local
```

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_API_BASE_URL` | 后端对话服务地址 | `http://localhost:8000` |

## 项目结构

```
src/
├── core/                   # 核心引擎层
│   ├── avatar/             #   3D 虚拟形象引擎
│   ├── audio/              #   语音服务（TTS / ASR）
│   ├── dialogue/           #   对话编排与通信
│   └── vision/             #   视觉感知与情感映射
├── components/             # UI 组件
│   ├── ui/                 #   通用 UI 组件
│   ├── DigitalHumanViewer  #   3D 查看器
│   ├── ControlPanel        #   控制面板
│   └── ...                 #   表情 / 行为 / 语音 / 视觉面板
├── hooks/                  # 自定义 Hooks
├── store/                  # Zustand 全局状态
├── pages/                  # 页面组件
├── lib/                    # 工具函数
├── App.tsx                 # 路由入口
└── main.tsx                # 应用入口
```

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建 |
| `npm run build:pages` | GitHub Pages 构建（`/meta-human/`） |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | ESLint 检查 |
| `npm run lint:fix` | ESLint 自动修复 |
| `npm run format` | Prettier 格式化 |
| `npm run test` | 运行测试（watch 模式） |
| `npm run test:run` | 运行测试（单次） |
| `npm run test:coverage` | 测试覆盖率报告 |
| `npm run typecheck` | TypeScript 类型检查 |

## 技术栈

- **前端框架** — React 18 + TypeScript
- **3D 渲染** — Three.js + React Three Fiber + Drei
- **状态管理** — Zustand
- **样式** — Tailwind CSS
- **构建** — Vite 5
- **测试** — Vitest + Testing Library
- **CI/CD** — GitHub Actions
- **部署** — GitHub Pages

## 部署说明

### GitHub Pages

当前仓库以 **GitHub Pages** 作为主要发布方式。

1. 在仓库中配置名为 `VITE_API_BASE_URL` 的 Repository Variable
2. 推送到 `master`，或手动运行 `Deploy Pages` workflow
3. 首次部署成功后，站点地址为：

```text
https://lessup.github.io/meta-human/
```

Pages 上的前端路由会使用 Hash URL，例如：

```text
https://lessup.github.io/meta-human/#/advanced
```

### Render 后端部署

使用仓库根目录的 `render.yaml` 可以把 FastAPI 后端部署到 Render。

1. 在 Render 中从本仓库创建 Blueprint 服务
2. 确认生成的服务配置为：
   - Root Directory：`server`
   - Build Command：`pip install -r requirements.txt`
   - Start Command：`uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Health Check Path：`/health`
3. 在 Render 中配置后端环境变量
   - Pages 联通至少需要：`CORS_ALLOW_ORIGINS=https://lessup.github.io`
   - 需要真实大模型回复时，再配置：`OPENAI_API_KEY`
   - 完整变量列表见 `server/.env.example`
4. 部署成功后，复制 Render 服务地址，例如：

```text
https://your-render-service.onrender.com
```

5. 在 GitHub Actions 的 Repository Variables 中设置：

```text
VITE_API_BASE_URL=https://your-render-service.onrender.com
```

6. 重新运行 `Deploy Pages` workflow，让前端指向 Render 后端

### 构建命令

```bash
# 常规生产构建
npm run build

# GitHub Pages 构建（/meta-human/ 基础路径）
npm run build:pages
```

> Pages workflow 会从 GitHub Actions 的 Repository Variables 中读取 `VITE_API_BASE_URL`。如果未配置，线上构建会回退到 `http://localhost:8000`，不适合生产环境。

> 后端部署变量请以 `server/.env.example` 为参考模板。

## 架构概览


```
┌──────────────────────────────────────────┐
│                  UI Layer                 │
│   Pages ← Components ← Hooks ← Store    │
├──────────────────────────────────────────┤
│               Core Engine                │
│  ┌────────┐ ┌───────┐ ┌────────┐ ┌─────┐│
│  │ Avatar │ │ Audio │ │Dialogue│ │Vision││
│  └────────┘ └───────┘ └────────┘ └─────┘│
├──────────────────────────────────────────┤
│            External Services             │
│  Three.js  Web Speech  REST API MediaPipe│
└──────────────────────────────────────────┘
```

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feat/my-feature`)
3. 提交变更 (`git commit -m 'feat: add my feature'`)
4. 推送分支 (`git push origin feat/my-feature`)
5. 发起 Pull Request

请遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

## 许可证

[MIT](LICENSE)
