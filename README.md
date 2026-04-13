<div align="center">

<br />

<img src="public/favicon.svg" alt="MetaHuman" width="64" height="64" />

<br />

# MetaHuman

**下一代 Web 3D 数字人交互引擎**

*开箱即用的数字人 Demo/SDK — 3D 渲染 · 语音交互 · 视觉镜像 · LLM 对话，一个仓库跑通全链路*

<br />

[![CI](https://github.com/LessUp/MetaHuman/actions/workflows/ci.yml/badge.svg)](https://github.com/LessUp/MetaHuman/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-informational.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-≥18-68a063?logo=node.js&logoColor=white)](package.json)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)](package.json)
[![Three.js](https://img.shields.io/badge/Three.js-r158-black?logo=three.js&logoColor=white)](package.json)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)](server/requirements.txt)

<br />

</div>

---

## 为什么选择 MetaHuman

构建数字人 Demo 通常需要整合 3D 渲染、语音、视觉、LLM 等多个独立技术栈，联调成本高、链路长、易断裂。MetaHuman 将这些能力封装为一个**前后端一体、开箱即用、优雅降级**的完整交互闭环。

| 痛点 | MetaHuman 的解法 |
|:---|:---|
| 搭建数字人 Demo 联调链路长 | 前后端一个仓库，`npm run dev` + `uvicorn` 即可运行完整闭环 |
| 没有云端配置就无法演示 | 无 API Key 时自动 Mock 回退，离线也能完整体验 |
| 3D 模型资产难以获取 | 内置赛博风程序化头像，模型缺失时无缝降级 |
| 表情/动作/对话各模块割裂 | 统一状态管理 + 对话编排器，LLM 输出直接驱动数字人行为 |

---

## 功能概览

<table>
<tr>
<td width="50%">

### 🎭 3D 数字人渲染
- Three.js + React Three Fiber 渲染引擎
- GLB/GLTF 模型加载，模型缺失时回退程序化头像
- 表情 / 情绪 / 动作联动驱动
- OrbitControls 交互式视角控制

</td>
<td width="50%">

### 🎙 语音交互
- Web Speech API 驱动 ASR 语音识别 + TTS 语音播报
- 语音命令快捷控制（播放/暂停/打招呼/跳舞）
- 录音 / 静音 / 播报状态实时同步

</td>
</tr>
<tr>
<td width="50%">

### 🤖 LLM 对话编排
- FastAPI 后端，`/v1/chat` 结构化输出
- 兼容 OpenAI / DeepSeek / 通义千问等接口
- 会话历史管理，TTL 自动清理
- 异常时智能 Mock 降级，不中断体验

</td>
<td width="50%">

### 👁 视觉镜像
- MediaPipe Face Mesh / Pose 实时推理
- 摄像头画面 + 情绪 / 动作信号映射
- 视觉结果直接驱动数字人表现层

</td>
</tr>
</table>

---

## 技术架构

```
┌─────────────────────────────────────────────────────┐
│                    Browser                           │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ 3D Viewer │  │  Voice   │  │  Vision Mirror    │  │
│  │ Three.js  │  │ WebSpeech│  │  MediaPipe        │  │
│  └─────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│        │              │                  │            │
│        └──────────────┼──────────────────┘            │
│                       ▼                               │
│              ┌────────────────┐                       │
│              │  Zustand Store │ ◄── 全局状态中枢       │
│              └────────┬───────┘                       │
│                       ▼                               │
│              ┌────────────────┐                       │
│              │  Orchestrator  │ ◄── 对话结果编排       │
│              └────────┬───────┘                       │
└───────────────────────┼──────────────────────────────┘
                        ▼  HTTP
┌──────────────────────────────────────────────────────┐
│                   FastAPI Backend                     │
│                                                       │
│   POST /v1/chat ──► DialogueService ──► LLM API      │
│                           │                            │
│                     Smart Mock Fallback                │
└──────────────────────────────────────────────────────┘
```

<details>
<summary><strong>完整技术栈</strong></summary>

| 层级 | 技术 | 用途 |
|:---|:---|:---|
| 前端框架 | React 18 + TypeScript | UI 与交互逻辑 |
| 构建工具 | Vite | 开发服务器与生产构建 |
| 3D 渲染 | Three.js + React Three Fiber + drei | 数字人模型渲染与动画 |
| 状态管理 | Zustand | 全局状态（情绪/表情/动作/连接） |
| UI 样式 | Tailwind CSS + Lucide Icons | 界面样式与图标 |
| 语音能力 | Web Speech API | ASR 语音识别 + TTS 语音合成 |
| 视觉推理 | MediaPipe Face Mesh / Pose | 面部与姿态检测 |
| 后端框架 | FastAPI | HTTP API 与 CORS 中间件 |
| LLM 接入 | OpenAI Compatible API | 对话生成，支持多种 LLM 提供方 |
| 部署 | Vercel (前端) + 任意 Python 主机 (后端) | 生产环境部署 |

</details>

---

## 快速开始

### 环境要求

- **Node.js** ≥ 18
- **Python** ≥ 3.11
- **操作系统** — macOS / Linux / Windows (WSL2)
- **浏览器** — Chrome / Edge（语音功能需要 Chromium 内核）

### 安装与启动

**1. 克隆仓库**

```bash
git clone https://github.com/LessUp/MetaHuman.git
cd MetaHuman
```

**2. 启动前端**

```bash
npm ci
npm run dev                # → http://localhost:5173
```

**3. 启动后端**

```bash
cd server
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**4. 打开浏览器** → `http://localhost:5173`

> **提示**：不配置任何 API Key 即可体验完整交互流程。后端在 Mock 模式下会根据输入内容智能生成回复。

<details>
<summary><strong>环境变量配置（可选）</strong></summary>

| 变量 | 位置 | 默认值 | 说明 |
|:---|:---|:---|:---|
| `VITE_API_BASE_URL` | 前端 | `http://localhost:8000` | 后端服务地址 |
| `OPENAI_API_KEY` | 后端 | — | LLM API 密钥，不配置则使用 Mock |
| `OPENAI_MODEL` | 后端 | `gpt-3.5-turbo` | 模型名称 |
| `OPENAI_BASE_URL` | 后端 | `https://api.openai.com/v1` | 兼容 OpenAI 接口的自定义网关 |
| `CORS_ALLOW_ORIGINS` | 后端 | `localhost:5173/3000` | 逗号分隔的允许跨域来源 |

</details>

<details>
<summary><strong>键盘快捷键</strong></summary>

| 按键 | 功能 |
|:---|:---|
| `Space` | 播放 / 暂停 |
| `M` | 静音切换 |
| `V` | 录音切换 |
| `S` | 设置面板 |
| `R` | 重置状态 |
| `1` | 打招呼 |
| `2` | 跳舞 |
| `3` | 说话 |
| `4` | 随机表情 |
| `Esc` | 关闭设置面板 |

</details>

---

## 项目结构

```
MetaHuman/
├── src/                          # 前端源码
│   ├── components/               #   UI 组件
│   │   ├── DigitalHumanViewer    #     3D 渲染视图 + 赛博风程序化头像
│   │   ├── ControlPanel          #     播放/录音/静音快捷控制
│   │   ├── VoiceInteractionPanel #     语音参数配置面板
│   │   ├── VisionMirrorPanel     #     摄像头视觉镜像面板
│   │   ├── ExpressionControlPanel#     表情调试面板
│   │   └── BehaviorControlPanel  #     行为调试面板
│   ├── core/                     #   核心能力层（稳定接口，屏蔽底层细节）
│   │   ├── avatar/               #     数字人引擎（情绪/表情/动作驱动）
│   │   ├── audio/                #     TTS/ASR 服务（共享单例）
│   │   ├── dialogue/             #     对话服务 + 结果编排器
│   │   └── vision/               #     摄像头服务 + 视觉映射
│   ├── pages/                    #   页面入口
│   │   ├── AdvancedDigitalHuman  #     主页面（全功能暗色 HUD 风格）
│   │   └── DigitalHuman          #     简化版页面
│   ├── store/                    #   Zustand 全局状态 + 类型常量导出
│   └── __tests__/                #   测试用例
│
├── server/                       # 后端源码
│   └── app/
│       ├── api/                  #   HTTP 路由（含输入校验）
│       ├── services/             #   对话服务（会话管理 + TTL 清理）
│       └── main.py               #   FastAPI 入口 + CORS + 健康检查
│
├── docs/                         # 项目文档
│   ├── project-overview.md       #   项目总览
│   ├── architecture.md           #   架构说明
│   ├── development.md            #   开发指南
│   └── api.md                    #   API 文档
│
├── .github/workflows/ci.yml      # CI（Lint + Test + Build）
├── vercel.json                   # Vercel 部署配置
└── README.md
```

---

## API 接口

| 方法 | 路径 | 说明 |
|:---|:---|:---|
| `GET` | `/health` | 健康检查 |
| `POST` | `/v1/chat` | 对话接口 |

**请求示例：**

```bash
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"userText": "你好", "sessionId": "demo"}'
```

**响应示例：**

```json
{
  "replyText": "您好！很高兴见到您，有什么可以帮助您的吗？",
  "emotion": "happy",
  "action": "wave"
}
```

| 字段 | 类型 | 取值范围 |
|:---|:---|:---|
| `replyText` | string | — |
| `emotion` | enum | `neutral` · `happy` · `surprised` · `sad` · `angry` |
| `action` | enum | `idle` · `wave` · `greet` · `think` · `nod` · `shakeHead` · `dance` · `speak` |

---

## 文档

| 文档 | 说明 |
|:---|:---|
| [项目总览](docs/project-overview.md) | 一页式项目介绍，适合汇报与对外展示 |
| [架构说明](docs/architecture.md) | 模块边界、职责划分与关键数据流 |
| [开发指南](docs/development.md) | 本地开发、联调顺序与排障指南 |
| [API 文档](docs/api.md) | 后端接口契约与回退策略 |

---

## 浏览器兼容性

| | Chrome / Edge | Firefox | Safari |
|:---|:---:|:---:|:---:|
| 3D 渲染 | ✅ | ✅ | ✅ |
| 语音识别 (ASR) | ✅ | ❌ | ⚠️ |
| 语音合成 (TTS) | ✅ | ✅ | ✅ |
| 视觉镜像 (MediaPipe) | ✅ | ✅ | ✅ |

> 语音识别依赖 Web Speech API，目前仅 Chromium 内核浏览器完整支持。

---

## 贡献

欢迎贡献代码、报告问题或提出建议：

1. **Fork** 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交修改：请遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范
4. 发起 **Pull Request**

---

## 许可证

本项目基于 [MIT License](LICENSE) 开源，可自由用于商业和个人项目。

---

<div align="center">

如果这个项目对你有帮助，请给个 **Star** ⭐ 支持一下

</div>
