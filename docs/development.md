# 开发与运行

## 1. 前置要求

| 工具 | 版本 |
|------|------|
| Node.js | >= 18 |
| npm | >= 9 |
| Python | >= 3.10（运行后端时需要） |

---

## 2. 前端（Vite + React + TypeScript）

### 2.1 安装与启动

```bash
npm ci            # 按 lockfile 精确安装依赖
npm run dev       # 开发服务器 → http://localhost:5173
npm run build     # TypeScript 编译 + Vite 构建
npm run preview   # 本地预览构建产物
```

### 2.2 多模式构建

```bash
npm run build             # 默认构建
npm run build:mobile      # 移动端构建
npm run build:desktop     # 桌面端构建
npm run build:ar          # AR 模式构建
```

通过 Vite `--mode` 参数区分构建模式。

### 2.3 测试

```bash
npm run test          # Vitest watch 模式
npm run test:run      # 单次运行
npm run test:ui       # Vitest UI 界面
npm run test:coverage # 覆盖率报告
```

- 测试框架：Vitest + @testing-library/react
- 测试环境：jsdom
- 属性测试：fast-check（位于 `src/__tests__/properties/`）

### 2.4 代码检查

```bash
npm run lint      # ESLint 检查
```

ESLint 使用 flat config（`eslint.config.js`），零警告策略。

### 2.5 部署

```bash
npm run deploy    # 构建 + 部署到 Vercel
```

部署配置见 `vercel.json`（路由重写规则）。

### 2.6 前端环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_API_BASE_URL` | 后端地址 | `http://localhost:8000` |

---

## 3. 后端（FastAPI + uvicorn）

### 3.1 安装依赖

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r server/requirements.txt
```

依赖清单：`fastapi`、`uvicorn[standard]`、`httpx`。

### 3.2 启动服务

```bash
cd server
uvicorn app.main:app --reload --port 8000
```

启动后可访问：

- `http://localhost:8000/` — 服务信息
- `http://localhost:8000/health` — 健康检查
- `http://localhost:8000/docs` — Swagger UI 交互文档
- `http://localhost:8000/redoc` — ReDoc 文档

### 3.3 后端环境变量

| 变量 | 必填 | 说明 | 默认值 |
|------|:----:|------|--------|
| `OPENAI_API_KEY` | — | OpenAI API Key；不配置时自动使用 Mock 回复 | — |
| `OPENAI_MODEL` | — | 模型名称 | `gpt-3.5-turbo` |
| `OPENAI_BASE_URL` | — | 自定义 API 地址（自动规范化为 `.../v1/chat/completions`） | `https://api.openai.com/v1` |
| `LLM_PROVIDER` | — | LLM 提供方标识（预留扩展） | `openai` |
| `CORS_ALLOW_ORIGINS` | — | 逗号分隔的 Origin 列表 | `localhost:5173,3000` |
| `DIALOGUE_MAX_SESSION_MESSAGES` | — | 会话上下文最大消息数 | `10` |

> 前端独立运行不依赖后端。未启动后端时，前端对话功能会优雅降级。

---

## 4. 浏览器兼容性

- **语音能力**：依赖 Web Speech API，推荐 Chromium 系浏览器（Chrome / Edge）
- **摄像头/麦克风**：需要 HTTPS 或 localhost 环境授权
- **3D 渲染**：需要 WebGL 2.0 支持

---

## 5. 项目结构概览

```
src/
├── pages/                          # 页面组件（3 个）
├── components/                     # UI + 3D 组件（含 ui/ 子目录）
├── core/
│   ├── audio/audioService.ts       # TTS/ASR 语音服务
│   ├── avatar/DigitalHumanEngine.ts # 数字人行为引擎
│   ├── dialogue/                   # 对话服务 + 编排器
│   ├── vision/                     # 视觉识别（MediaPipe）
│   └── performance/                # 性能监控
├── store/digitalHumanStore.ts      # Zustand 全局状态
├── hooks/                          # 自定义 Hooks（含 vrm/ 子目录）
├── __tests__/                      # 测试文件（含 properties/ 属性测试）
└── lib/utils.ts                    # 工具函数（cn = clsx + tailwind-merge）

server/                             # Python FastAPI 后端
├── app/
│   ├── main.py                     # 入口（CORS、健康检查、路由挂载）
│   ├── api/chat.py                 # 对话 API 路由
│   └── services/dialogue.py        # 对话服务（LLM 调用 + Mock 回退）
└── requirements.txt
```
