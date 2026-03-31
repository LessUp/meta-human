# MetaHuman

基于 React + Three.js 的数字人交互 Demo/SDK，聚焦 3D 展示、语音交互、视觉镜像与 LLM 对话联动。

## 项目定位

本仓库的目标是提供一个可运行、可二次开发的数字人交互样例，而不是完整的平台化产品。

当前重点：

- 3D 数字人展示与动作/表情驱动
- 文本与语音输入输出
- 摄像头视觉镜像与 MediaPipe 推理
- 前后端联调的对话链路
- 无云端配置时的本地 Mock 回退

当前**不包含**：

- 用户系统与权限管理
- 模型管理后台
- 可视化行为编排平台
- 多租户与平台化运维能力

## 核心能力

### 1. 数字人渲染
- 基于 Three.js + React Three Fiber 渲染 3D 数字人
- 支持 GLB/GLTF 模型加载
- 模型缺失或加载失败时可回退到内置 procedural avatar
- 支持表情、情绪与动作联动驱动

### 2. 语音交互
- 基于 Web Speech API 的 TTS / ASR 能力
- 支持录音、播报、静音等交互状态同步
- 可将语音识别结果接入对话链路

### 3. 对话编排
- 前端通过 `/v1/chat` 与后端通信
- 后端返回结构化结果：`replyText`、`emotion`、`action`
- 前端将结果同步到 UI、数字人引擎与语音播报
- 未配置 LLM Key 或调用失败时自动回退 Mock

### 4. 视觉镜像
- 支持摄像头预览与 MediaPipe 推理
- 输出简化的情绪与头部动作映射结果
- 可将视觉状态驱动到数字人表现层

## 技术栈

- 前端：React 18 + TypeScript + Vite
- 3D：Three.js + React Three Fiber + drei
- 状态管理：Zustand
- UI：Tailwind CSS + Lucide React
- 视觉：MediaPipe Face Mesh / Pose
- 后端：FastAPI

## 快速开始

## 1. 前端启动

安装依赖：

```bash
npm ci
```

开发模式：

```bash
npm run dev
```

构建：

```bash
npm run build
```

预览构建产物：

```bash
npm run preview
```

## 2. 后端启动

创建虚拟环境并安装依赖：

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r server/requirements.txt
```

启动服务：

```bash
uvicorn app.main:app --reload --port 8000
```

启动后默认接口：

- `GET http://localhost:8000/health`
- `POST http://localhost:8000/v1/chat`

## 3. 环境变量

前端：

- `VITE_API_BASE_URL`：后端地址，默认 `http://localhost:8000`

后端：

- `OPENAI_API_KEY`：可选；不配置时使用本地 Mock 回复
- `OPENAI_MODEL`：可选；默认模型名
- `OPENAI_BASE_URL`：可选；支持自定义 OpenAI 兼容网关
- `CORS_ALLOW_ORIGINS`：可选；逗号分隔的允许来源列表

## 页面与能力概览

- `/`、`/advanced`：高级数字人页面，功能最完整
- `/digital-human`：简化版数字人页面

主要组件：

- `src/components/DigitalHumanViewer.tsx`：3D 数字人渲染
- `src/components/VoiceInteractionPanel.tsx`：语音交互面板
- `src/components/VisionMirrorPanel.tsx`：视觉镜像面板
- `src/components/ExpressionControlPanel.tsx`：表情控制
- `src/components/BehaviorControlPanel.tsx`：行为控制
- `src/components/ControlPanel.tsx`：快捷控制区

核心模块：

- `src/core/avatar/DigitalHumanEngine.ts`：数字人表现驱动
- `src/core/audio/audioService.ts`：TTS / ASR 服务
- `src/core/dialogue/dialogueService.ts`：对话接口调用
- `src/core/dialogue/dialogueOrchestrator.ts`：对话结果编排
- `src/core/vision/visionService.ts`：摄像头与推理服务
- `src/core/vision/visionMapper.ts`：视觉结果映射

## 目录结构

```text
src/
├── components/          # UI 组件
├── core/                # 数字人、语音、对话、视觉核心能力
├── pages/               # 页面入口
├── store/               # Zustand 状态管理
└── utils/               # 通用工具

server/
└── app/
    ├── api/             # HTTP 路由
    ├── services/        # 后端服务
    └── main.py          # FastAPI 入口
```

## 文档导航

- `docs/project-overview.md`：一页式项目总览，适合汇报、路演、对外介绍
- `docs/architecture.md`：架构说明，聚焦模块边界、职责与数据流
- `docs/development.md`：本地开发、联调顺序与排障指南
- `docs/api.md`：后端 API 契约与回退策略
- `.trae/documents/digital-human-prd.md`：产品设计文档
- `.trae/documents/digital-human-technical-architecture.md`：技术设计文档

推荐阅读顺序：
1. `README.md`
2. `docs/project-overview.md`
3. `docs/architecture.md`
4. `docs/development.md`
5. `docs/api.md`

## 浏览器说明

- 语音能力依赖 Web Speech API，推荐 Chromium 系浏览器
- 摄像头 / 麦克风权限通常要求 `https` 或 `localhost`
- 不同浏览器和系统的语音列表、识别效果可能存在差异

## 许可证

本项目采用 [MIT License](LICENSE)。

## 贡献

1. Fork 本仓库
2. 创建分支：`git checkout -b feature/your-feature`
3. 提交修改
4. 推送分支并发起 Pull Request

如果这个项目对你有帮助，欢迎点个 Star。