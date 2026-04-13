<div align="center">

# MetaHuman

**基于 Web 的 3D 数字人交互 Demo/SDK**

3D 渲染 · 语音交互 · 视觉镜像 · LLM 对话

[![CI](https://github.com/LessUp/MetaHuman/actions/workflows/ci.yml/badge.svg)](https://github.com/LessUp/MetaHuman/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)](package.json)
[![React](https://img.shields.io/badge/React-18-blue)](package.json)
[![Three.js](https://img.shields.io/badge/Three.js-0.158-orange)](package.json)

</div>

---

## 项目定位

MetaHuman 是一个**可运行、可展示、可二开**的数字人交互样例工程，以最低复杂度将 3D 数字人、语音、视觉与 LLM 对话串联为完整闭环。

适用于：售前演示 · PoC 验证 · 技术方案打样 · 业务二次开发

> **注意**：本仓库定位为 Demo/SDK，不包含用户系统、模型管理后台、行为编排平台等平台化能力。

---

## 核心能力

| 能力 | 技术方案 | 说明 |
|:---|:---|:---|
| **3D 数字人渲染** | Three.js + React Three Fiber | 支持 GLB/GLTF 模型加载，表情/情绪/动作驱动，模型缺失时回退内置赛博风头像 |
| **语音交互** | Web Speech API | ASR 语音识别 + TTS 语音播报，支持录音/静音状态同步，语音命令快捷控制 |
| **对话编排** | FastAPI + OpenAI 兼容接口 | `/v1/chat` 返回结构化结果（文本/情绪/动作），无 Key 时自动 Mock 回退，带会话历史管理 |
| **视觉镜像** | MediaPipe Face Mesh / Pose | 摄像头画面 + 推理结果映射为情绪/动作信号，驱动数字人表现 |

### 架构亮点

- **优雅降级** — LLM 不可用时智能 Mock 回复，模型缺失时回退程序化头像，前后端均可独立运行
- **会话管理** — 后端自动维护会话历史，支持 TTL 过期清理和存储上限，防止内存泄漏
- **统一状态** — Zustand 集中管理数字人状态（情绪/表情/动作/连接），类型安全的常量约束
- **键盘快捷键** — `Space` 播放/暂停、`M` 静音、`V` 录音、`S` 设置面板、`1-4` 快速命令

---

## 技术栈

```
Frontend:  React 18 · TypeScript · Vite · Tailwind CSS · Zustand
3D:        Three.js · React Three Fiber · drei
Vision:    MediaPipe Face Mesh / Pose
Backend:   FastAPI · OpenAI Compatible API
```

---

## 快速开始

### 前端

```bash
npm ci
npm run dev          # 开发模式
npm run build        # 生产构建
npm run preview      # 预览构建产物
```

### 后端

```bash
cd server
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

启动后可用接口：
- `GET  http://localhost:8000/health` — 健康检查
- `POST http://localhost:8000/v1/chat` — 对话接口

### 环境变量

| 变量 | 位置 | 必填 | 默认值 | 说明 |
|:---|:---|:---:|:---|:---|
| `VITE_API_BASE_URL` | 前端 | 否 | `http://localhost:8000` | 后端地址 |
| `OPENAI_API_KEY` | 后端 | 否 | — | 不配置时使用 Mock 回复 |
| `OPENAI_MODEL` | 后端 | 否 | — | 模型名称 |
| `OPENAI_BASE_URL` | 后端 | 否 | — | 自定义 OpenAI 兼容网关 |
| `CORS_ALLOW_ORIGINS` | 后端 | 否 | — | 逗号分隔的允许来源列表 |

> **提示**：所有环境变量均可选，开箱即用。不配置任何 API Key 即可体验完整交互流程。

---

## 项目结构

```
src/
├── components/        # UI 组件（Viewer、语音面板、视觉面板、控制面板等）
├── core/              # 核心能力层
│   ├── avatar/        #   数字人引擎驱动
│   ├── audio/         #   TTS / ASR 服务（共享单例）
│   ├── dialogue/      #   对话服务 + 结果编排
│   └── vision/        #   摄像头服务 + 视觉映射
├── pages/             # 页面入口
├── store/             # Zustand 全局状态（含类型常量导出）

server/
└── app/
    ├── api/           # HTTP 路由（含输入校验）
    ├── services/      # 对话服务（会话管理 + TTL 清理）
    └── main.py        # FastAPI 入口
```

**页面路由**：`/` `/advanced` → 高级数字人页（功能最完整） ｜ `/digital-human` → 简化版页面

---

## 数据流

```
文本输入 ─┐
语音输入 ─┼→ dialogueService → POST /v1/chat → 后端返回 {replyText, emotion, action}
视觉输入 ─┘                                                       ↓
                                              dialogueOrchestrator 编排
                                            ┌───┴───┐────────┐
                                          聊天区  数字人引擎  TTS播报
```

---

## 文档导航

| 文档 | 内容 |
|:---|:---|
| [项目总览](docs/project-overview.md) | 一页式项目介绍，适合汇报与对外展示 |
| [架构说明](docs/architecture.md) | 模块边界、职责划分与关键数据流 |
| [开发指南](docs/development.md) | 本地开发、联调顺序与排障指南 |
| [API 文档](docs/api.md) | 后端接口契约与回退策略 |

---

## 浏览器要求

- 语音能力依赖 Web Speech API，推荐 **Chromium 系浏览器**
- 摄像头/麦克风权限要求 `https` 或 `localhost` 环境
- 不同浏览器和系统的语音列表、识别效果可能存在差异

---

## 贡献

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交修改并发起 Pull Request

---

## 许可证

[MIT License](LICENSE)

---

如果这个项目对你有帮助，欢迎 Star 支持。
