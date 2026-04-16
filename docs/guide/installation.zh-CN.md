# 安装指南

MetaHuman Engine 完整安装说明。

---

## 系统要求

### 最低要求

| 组件 | 规格 |
|------|------|
| 操作系统 | Windows 10+、macOS 11+ 或 Linux (Ubuntu 20.04+) |
| 内存 | 4 GB |
| 磁盘 | 2 GB 可用空间 |
| 浏览器 | Chrome 90+、Edge 90+、Firefox 90+、Safari 15+ |

### 推荐配置

| 组件 | 规格 |
|------|------|
| 内存 | 8 GB |
| 显卡 | 支持 WebGL 2.0 *(最佳 3D 性能)* |
| 网络 | 宽带 *(流式响应)* |

---

## 前端安装

### 步骤 1：安装 Node.js

**macOS (Homebrew)：**
```bash
brew install node@18
```

**Ubuntu/Debian：**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Windows：**
从 [nodejs.org](https://nodejs.org/) 下载 LTS 版本

**验证安装：**
```bash
node --version  # 应显示 v18.x.x
npm --version   # 应显示 9.x.x 或更高
```

### 步骤 2：克隆和设置

```bash
# 克隆仓库
git clone https://github.com/LessUp/meta-human.git
cd meta-human

# 安装依赖
npm install

# 验证安装
npm run typecheck
```

### 步骤 3：配置环境

创建 `.env.local`：

```bash
# 后端 API 地址（可选 - 未设置时使用模拟）
VITE_API_BASE_URL=http://localhost:8000

# 传输模式：http、sse、websocket、auto
VITE_CHAT_TRANSPORT=auto
```

### 步骤 4：启动开发

```bash
npm run dev
```

访问 **http://localhost:5173**

---

## 后端安装

### 选项 1：本地 Python 环境

**步骤 1：安装 Python 3.10+**

**macOS：**
```bash
brew install python@3.10
```

**Ubuntu：**
```bash
sudo apt-get update
sudo apt-get install python3.10 python3.10-venv
```

**Windows：**
从 [python.org](https://python.org/) 下载

**验证：**
```bash
python --version  # 应显示 3.10.x 或更高
```

**步骤 2：设置虚拟环境**

```bash
cd server

# 创建虚拟环境
python -m venv venv

# 激活
source venv/bin/activate  # Linux/Mac
# 或: venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt
```

**步骤 3：配置环境**

创建 `server/.env`：

```bash
# AI 响应必需（可选 - 无密钥时模拟模式可用）
OPENAI_API_KEY=sk-your-api-key-here

# 可选：自定义端点
OPENAI_BASE_URL=https://api.openai.com/v1

# 可选：模型选择
OPENAI_MODEL=gpt-3.5-turbo

# 速率限制（每分钟请求数）
RATE_LIMIT_RPM=60

# 跨域来源（逗号分隔）
CORS_ALLOW_ORIGINS=http://localhost:5173,https://yourdomain.com
```

**步骤 4：启动后端**

```bash
uvicorn app.main:app --reload --port 8000
```

后端运行在 **http://localhost:8000**

API 文档在 **http://localhost:8000/docs**

---

### 选项 2：Docker（生产推荐）

**步骤 1：安装 Docker**

参考 [docker.com](https://docker.com/) 获取平台特定说明。

**步骤 2：构建并运行**

```bash
# 构建镜像
docker build -t metahuman-backend ./server

# 运行容器
docker run -p 8000:8000 \
  -e OPENAI_API_KEY=sk-... \
  -e CORS_ALLOW_ORIGINS=http://localhost:5173 \
  metahuman-backend
```

**或使用 docker-compose：**

```yaml
version: '3.8'
services:
  backend:
    build: ./server
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - CORS_ALLOW_ORIGINS=http://localhost:5173
```

---

## 生产部署

### 前端：GitHub Pages

**步骤 1：构建**

```bash
npm run build:pages
```

**步骤 2：配置仓库**

1. 进入 GitHub 仓库 → Settings → Pages
2. 设置源为 "GitHub Actions"

**步骤 3：设置环境变量**

进入 Settings → Secrets and variables → Actions：

| 变量 | 值 |
|------|-----|
| `VITE_API_BASE_URL` | 你的后端 URL |

**步骤 4：部署**

```bash
git push origin main
```

或手动触发 "Deploy Pages" 工作流。

---

### 后端：Render

**步骤 1：创建 Blueprint 服务**

使用项目根目录的 `render.yaml` 从 GitHub 导入。

**步骤 2：配置服务**

| 设置 | 值 |
|------|-----|
| 根目录 | `server` |
| 构建命令 | `pip install -r requirements.txt` |
| 启动命令 | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| 健康检查 | `/health` |

**步骤 3：设置环境变量**

```
CORS_ALLOW_ORIGINS=https://your-frontend-domain.com
OPENAI_API_KEY=sk-...
```

**步骤 4：连接前端**

更新 GitHub 仓库变量：

```
VITE_API_BASE_URL=https://your-backend.onrender.com
```

---

## 验证

### 前端健康检查

```bash
# 应返回 Vite 开发服务器页面
curl http://localhost:5173
```

### 后端健康检查

```bash
# 应返回 JSON 状态
curl http://localhost:8000/health

# 预期响应：
# {
#   "status": "ok",
#   "services": {
#     "chat": "available",
#     "llm": "mock_mode",
#     "tts": "available",
#     "asr": "unavailable"
#   }
# }
```

### API 测试

```bash
# 测试对话端点
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"userText": "你好"}'
```

---

## 故障排除

### npm install 失败

**清除缓存重试：**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Python 包安装失败

**升级 pip：**
```bash
pip install --upgrade pip setuptools
pip install -r requirements.txt
```

### 端口冲突

**前端（5173 端口）：**
```bash
# 查找进程
lsof -ti:5173

# 终止进程
lsof -ti:5173 | xargs kill -9
```

**后端（8000 端口）：**
```bash
lsof -ti:8000 | xargs kill -9
```

### 跨域错误

1. 验证 `CORS_ALLOW_ORIGINS` 包含前端 URL
2. 确保没有尾部斜杠不匹配
3. 检查协议（http 与 https）

---

<p align="center">
  <a href="./configuration.zh-CN.md">下一步：配置说明 →</a>
</p>
