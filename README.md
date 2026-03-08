# MetaHuman - 3D 数字人交互平台

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-r158-000000?logo=threedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)

基于 Web 技术的 3D 数字人交互平台，支持实时 3D 渲染、语音交互、表情控制和智能行为系统。全中文界面，深色/浅色双主题。

---

## 界面预览

> 运行 `npm run dev` 后访问 `http://localhost:5173` 查看完整效果

| 主界面 | 控制面板 | 404 页面 |
|:---:|:---:|:---:|
| ![主界面](docs/screenshots/main-ui.png) | ![控制面板](docs/screenshots/control-panel.png) | ![404 页面](docs/screenshots/404-page.png) |

> 截图说明：请运行项目后手动截图并保存到 `docs/screenshots/` 目录。

---

## 核心功能

### 3D 数字人渲染

- 双模式 Avatar 系统：**CyberAvatar**（纯几何体赛博风）+ **VRM Avatar**（`.vrm` 模型加载）
- 基于 Three.js + React Three Fiber 的实时渲染
- 25 种行为动画（挥手、鞠躬、鼓掌、思考、跳舞等）
- 11 种面部表情（微笑、大笑、惊讶、悲伤、愤怒等）
- 鼠标头部跟踪 + 情绪灯光系统
- lerp 插值平滑动画过渡

### 语音交互

- TTS 语音合成 + ASR 语音识别（Web Speech API）
- 中文语音优先，支持自定义语音参数
- 语音命令直接触发动作（"打招呼"、"跳舞"等）

### LLM 对话

- 前端 → 后端 `/v1/chat` → OpenAI Chat Completions
- 后端返回结构化数据驱动数字人（情感 + 动作 + 回复）
- 无 API Key 时自动降级为智能 Mock 回复
- 多轮对话上下文、会话管理

### 视觉镜像

- 摄像头实时预览 + MediaPipe FaceMesh/Pose 推理
- 面部关键点映射为情感和头部动作
- 实时 FPS 显示

### 键盘快捷键

| 按键 | 功能 |
|:---:|:---|
| `空格` | 播放/暂停 |
| `R` | 重置数字人 |
| `M` | 静音切换 |
| `V` | 录音切换 |
| `S` | 设置面板开关 |
| `Esc` | 关闭面板 |
| `1`~`4` | 快速触发预设行为 |

> 输入框聚焦时快捷键不生效。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript 5 + Vite 5 |
| 3D 渲染 | Three.js r158 + @react-three/fiber + @react-three/drei |
| VRM | @pixiv/three-vrm 3.5 |
| 状态管理 | Zustand 4 |
| 样式 | Tailwind CSS 3（双主题 `darkMode: "class"`） |
| 图标 | Lucide React |
| 通知 | Sonner |
| 路由 | React Router DOM 6 |
| 测试 | Vitest + @testing-library/react + fast-check |
| 后端 | FastAPI + httpx（Python） |
| 部署 | Vercel |

---

## 快速开始

### 前端

```bash
npm ci            # 安装依赖
npm run dev       # 开发服务器 → http://localhost:5173
npm run build     # 构建
```

### 后端（可选）

```bash
cd server
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

> 前端独立运行不依赖后端。未启动后端时对话功能优雅降级。

### 测试

```bash
npm run test          # watch 模式
npm run test:run      # 单次运行
npm run lint          # ESLint 检查
```

---

## 项目结构

```
src/
├── pages/                              # 页面组件
│   ├── AdvancedDigitalHumanPage.tsx     # 主页面（全功能）
│   ├── DigitalHumanPage.tsx            # 简化版页面
│   └── NotFoundPage.tsx                # 404 页面
├── components/                         # UI + 3D 组件
│   ├── DigitalHumanViewer.enhanced.tsx  # 核心：CyberAvatar 3D 渲染
│   ├── VRMAvatar.tsx                   # VRM 模型渲染
│   ├── BehaviorControlPanel.new.tsx    # 行为控制（25 种动作）
│   ├── ExpressionControlPanel.new.tsx  # 表情控制（11 种表情）
│   ├── VoiceInteractionPanel.dark.tsx  # 语音交互面板
│   ├── VisionMirrorPanel.tsx           # 摄像头情感检测
│   ├── ControlPanel.tsx                # 基础控制面板
│   ├── KeyboardShortcutsHelp.tsx       # 快捷键帮助
│   └── ui/                            # 基础 UI 组件
├── core/                               # 核心引擎
│   ├── avatar/DigitalHumanEngine.ts    # 行为引擎（动画队列 + 组合动作）
│   ├── audio/audioService.ts           # TTS/ASR 语音服务
│   ├── dialogue/                       # 对话服务 + 编排器
│   ├── vision/                         # 视觉识别（MediaPipe）
│   └── performance/                    # 性能监控
├── store/digitalHumanStore.ts          # Zustand 全局状态
├── hooks/                              # 自定义 Hooks（含 vrm/ 子目录）
├── __tests__/                          # 测试文件
└── lib/utils.ts                        # 工具函数

server/                                 # Python FastAPI 后端
├── app/
│   ├── main.py                         # 入口
│   ├── api/chat.py                     # 对话 API
│   └── services/dialogue.py            # 对话服务（LLM + Mock）
└── requirements.txt
```

---

## 文档

- **[架构说明](docs/architecture.md)** — 前后端架构、核心模块、数据流
- **[开发指南](docs/development.md)** — 安装运行、环境变量、浏览器兼容性
- **[API 契约](docs/api.md)** — 后端接口规范与回退策略
- **[更新日志](changelog/)** — 版本迭代记录

---

## 浏览器兼容性

- 语音能力依赖 Web Speech API，推荐 **Chrome / Edge**
- 摄像头/麦克风需要 HTTPS 或 localhost 环境
- 3D 渲染需要 WebGL 2.0 支持

---

## 贡献

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m "feat: add your feature"`
4. 推送并创建 Pull Request

提交规范：[Conventional Commits](https://www.conventionalcommits.org/)（`feat:` / `fix:` / `docs:` / `style:` / `refactor:`）

详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

---

## 许可证

[MIT](LICENSE)
