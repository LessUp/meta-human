# 快速开始指南

5 分钟让 MetaHuman Engine 运行起来。

---

## 前提条件

| 需求 | 版本 | 检查命令 |
|------|------|----------|
| Node.js | ≥ 18 | `node --version` |
| npm | ≥ 9 | `npm --version` |
| Python | ≥ 3.10 | `python --version` |
| Git | 任意 | `git --version` |

---

## 安装

### 1. 克隆仓库

```bash
git clone https://github.com/LessUp/meta-human.git
cd meta-human
```

### 2. 安装前端依赖

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

打开 **http://localhost:5173** —— 你的 3D 数字人已就绪！

> ✅ 无需 API Key。引擎自动降级到本地模拟模式。

---

## 项目结构

```
meta-human/
├── src/                    # 前端源代码
│   ├── components/         # React 组件
│   ├── core/              # 引擎模块
│   │   ├── avatar/        # 3D 渲染
│   │   ├── audio/         # 语音合成/识别
│   │   ├── dialogue/      # 对话服务
│   │   └── vision/        # 面部追踪
│   ├── store/             # Zustand 状态
│   └── hooks/             # 自定义 Hooks
├── server/                 # FastAPI 后端
├── docs/                   # 文档
├── public/                 # 静态资源
└── dist/                   # 构建输出
```

---

## 初次交互

### 文字对话

1. 在聊天输入框输入消息
2. 按回车或点击发送
3. 观察数字人响应：
   - **文字回复** 显示在聊天面板
   - **语音合成** (TTS)
   - **面部表情** 匹配情绪
   - **手势动画** (挥手、点头等)

### 语音交互

1. 点击 **麦克风按钮**
2. 说出你的消息
3. 松开自动发送
4. 数字人自动响应

### 视觉模式

1. 点击 **启用摄像头**
2. 允许摄像头访问
3. 对摄像头展示表情：
   - 😊 微笑 → 数字人微笑
   - 😮 惊讶 → 数字人惊讶
   - 😢 悲伤 → 数字人关切
   - 😠 愤怒 → 数字人共情

---

## 配置

### 前端环境变量

在项目根目录创建 `.env.local`：

```bash
# 后端 API 地址
VITE_API_BASE_URL=http://localhost:8000

# 对话传输方式：http | sse | websocket | auto
VITE_CHAT_TRANSPORT=auto
```

### 后端环境变量

创建 `server/.env`：

```bash
# 可选：OpenAI API 用于 AI 响应
OPENAI_API_KEY=sk-...

# 可选：自定义 OpenAI 端点
OPENAI_BASE_URL=https://api.openai.com/v1

# LLM 提供商：openai | azure
LLM_PROVIDER=openai

# 速率限制
RATE_LIMIT_RPM=60

# 跨域来源
CORS_ALLOW_ORIGINS=http://localhost:5173
```

---

## 常用操作

### 开发命令

```bash
# 启动开发服务器
npm run dev

# 类型检查
npm run typecheck

# 代码检查
npm run lint

# 代码格式化
npm run format

# 生产构建
npm run build

# 运行测试
npm run test
```

### 后端开发

```bash
cd server

# 创建虚拟环境（推荐）
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或: venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 启动后端
uvicorn app.main:app --reload --port 8000
```

后端运行在 **http://localhost:8000**

交互式文档在 **http://localhost:8000/docs**

---

## 下一步

- **[安装指南](./installation.zh-CN.md)** — 详细设置说明
- **[配置说明](./configuration.zh-CN.md)** — 所有环境变量
- **[API 参考](../api/README.zh-CN.md)** — 后端 API 文档
- **[架构设计](../architecture/README.zh-CN.md)** — 系统设计

---

## 故障排除

### 端口已被占用

```bash
# 查找并终止 5173 端口的进程
lsof -ti:5173 | xargs kill -9
```

### Node 模块问题

```bash
rm -rf node_modules package-lock.json
npm install
```

### 后端连接失败

1. 检查后端是否运行：`curl http://localhost:8000/health`
2. 验证 `.env.local` 中的 `VITE_API_BASE_URL`
3. 检查后端的 CORS 设置

### 摄像头不工作

- 确保使用 HTTPS 或 localhost（浏览器在 HTTP 上会阻止摄像头）
- 检查浏览器权限
- 尝试其他浏览器（推荐 Chrome/Edge）

---

<p align="center">
  🎉 你已准备好使用 MetaHuman Engine 进行开发！
</p>
