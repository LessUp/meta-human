# 开发与运行

## 1. 前置要求

- Node.js：>= 18
- npm：>= 9
- Python：建议 >= 3.10（用于运行 FastAPI 后端）

## 2. 前端（Vite + React）

### 2.1 安装与启动

- 安装依赖（推荐按 lockfile 精确安装）：

```bash
npm ci
```

- 开发模式：

```bash
npm run dev
```

- 构建：

```bash
npm run build
```

- 本地预览构建产物：

```bash
npm run preview
```

### 2.2 前端环境变量

- `VITE_API_BASE_URL`
  - 说明：后端地址
  - 默认：`http://localhost:8000`

## 3. 后端（FastAPI）

### 3.1 安装依赖

建议在项目根目录创建虚拟环境：

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r server/requirements.txt
```

### 3.2 启动服务

```bash
uvicorn app.main:app --reload --port 8000
```

启动后可访问：

- `GET http://localhost:8000/health`
- `POST http://localhost:8000/v1/chat`

### 3.3 后端环境变量

- `OPENAI_API_KEY`
  - 可选；不配置时后端自动使用本地 Mock 回复
- `OPENAI_MODEL`
  - 可选；默认：`gpt-3.5-turbo`
- `OPENAI_BASE_URL`
  - 可选；支持传入域名、`/v1` 前缀或完整路径，例如：
    - `https://api.openai.com`
    - `https://api.openai.com/v1`
    - `https://api.openai.com/v1/chat/completions`
    - `http://localhost:8080`（自建网关/代理）
  - 后端会自动规范化为最终的 `.../v1/chat/completions`
- `CORS_ALLOW_ORIGINS`
  - 可选；逗号分隔的 Origin 列表（默认允许本地 `5173/3000`）

## 4. 浏览器能力说明

- 语音能力依赖 Web Speech API：推荐 Chromium 系浏览器；不同系统/浏览器的 voice 列表可能不同。
- 摄像头/麦克风权限通常要求 https 或 localhost 环境。
