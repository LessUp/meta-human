# 配置说明

MetaHuman Engine 完整环境变量参考。

---

## 前端配置

在项目根目录创建 `.env.local`。

### API 配置

| 变量 | 默认值 | 描述 |
|------|--------|------|
| `VITE_API_BASE_URL` | *(空)* | 后端 API 地址。留空使用模拟模式。 |
| `VITE_CHAT_TRANSPORT` | `auto` | 传输模式：`http`、`sse`、`websocket`、`auto` |

### 传输模式

| 模式 | 描述 | 适用场景 |
|------|------|----------|
| `auto` | 自动探测能力（WebSocket → SSE → HTTP） | **推荐** |
| `http` | 标准 HTTP 请求 | 简单设置 |
| `sse` | Server-Sent Events 流式 | 单向流式 |
| `websocket` | 全双工 WebSocket | 实时双向 |

### `.env.local` 示例

```bash
# 后端 API（留空使用模拟模式）
VITE_API_BASE_URL=http://localhost:8000

# 传输选择
VITE_CHAT_TRANSPORT=auto
```

---

## 后端配置

在 server 目录创建 `server/.env`。

### AI/LLM 配置

| 变量 | 默认值 | 必需 | 描述 |
|------|--------|------|------|
| `OPENAI_API_KEY` | *(空)* | 否 | OpenAI API 密钥 |
| `OPENAI_BASE_URL` | *(空)* | 否 | 自定义 OpenAI 兼容端点 |
| `OPENAI_MODEL` | `gpt-3.5-turbo` | 否 | 使用的模型 |
| `LLM_PROVIDER` | `openai` | 否 | LLM 提供商：`openai`、`azure` |

### 服务提供商

| 变量 | 默认值 | 描述 |
|------|--------|------|
| `TTS_PROVIDER` | `edge` | TTS 提供商：`edge`、`openai` |
| `ASR_PROVIDER` | `whisper` | ASR 提供商：`whisper` |

### 速率限制

| 变量 | 默认值 | 描述 |
|------|--------|------|
| `RATE_LIMIT_RPM` | `60` | 每个 IP 每分钟请求数 |

### 跨域配置

| 变量 | 默认值 | 描述 |
|------|--------|------|
| `CORS_ALLOW_ORIGINS` | *(空)* | 逗号分隔的允许来源 |

**示例：**
```bash
CORS_ALLOW_ORIGINS=http://localhost:5173,https://myapp.com
```

### 服务器配置

| 变量 | 默认值 | 描述 |
|------|--------|------|
| `HOST` | `0.0.0.0` | 服务器绑定地址 |
| `PORT` | `8000` | 服务器端口 |
| `LOG_LEVEL` | `info` | 日志级别：`debug`、`info`、`warning`、`error` |

### `server/.env` 示例

```bash
# AI 配置
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4

# 速率限制
RATE_LIMIT_RPM=100

# 跨域
CORS_ALLOW_ORIGINS=http://localhost:5173,https://mydomain.com

# 日志
LOG_LEVEL=info
```

---

## 高级配置

### 自定义 OpenAI 兼容端点

适用于 Azure OpenAI、LocalAI 或 Ollama 等服务：

```bash
OPENAI_API_KEY=your-key
OPENAI_BASE_URL=https://your-endpoint.com/v1
OPENAI_MODEL=your-model-name
```

### 多环境设置

**开发：**
```bash
# .env.local
VITE_API_BASE_URL=http://localhost:8000
VITE_CHAT_TRANSPORT=auto
```

**预发布：**
```bash
# .env.staging
VITE_API_BASE_URL=https://staging-api.example.com
VITE_CHAT_TRANSPORT=websocket
```

**生产：**
```bash
# .env.production
VITE_API_BASE_URL=https://api.example.com
VITE_CHAT_TRANSPORT=websocket
```

使用 Vite 模式：
```bash
npm run dev -- --mode staging
npm run build -- --mode production
```

---

## 功能特定配置

### 视觉 (MediaPipe)

视觉处理完全在浏览器中运行 —— 无需后端配置。

**浏览器要求：**
- 启用 WebGL 2.0
- 授予摄像头权限
- HTTPS 或 localhost

### 语音识别

使用 Web Speech API（浏览器原生）：

**支持的浏览器：**
- Chrome 25+
- Edge 79+
- Safari 14.1+（有限支持）

无需后端配置。

### 语音合成

**Edge TTS（默认）：**
- 无需配置
- 离线工作
- 多种可用语音

**OpenAI TTS：**
```bash
TTS_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

---

## 安全最佳实践

### 🔒 API 密钥

1. **永远不要提交** `.env` 文件到版本控制
2. 使用**环境特定**的密钥
3. **定期轮换**密钥
4. 使用**最小权限**

### 🔒 跨域

1. **限制来源**（生产环境）：
   ```bash
   # 好
   CORS_ALLOW_ORIGINS=https://myapp.com
   
   # 坏
   CORS_ALLOW_ORIGINS=*
   ```

2. **不要**在来源后加尾部斜杠
3. **包含协议**（http/https）

### 🔒 速率限制

根据基础设施调整：

```bash
# 云部署（更高）
RATE_LIMIT_RPM=1000

# 自托管（更低）
RATE_LIMIT_RPM=60
```

---

## 环境变量优先级

### 前端

1. `.env.[mode].local`（最高）
2. `.env.[mode]`
3. `.env.local`
4. `.env`（最低）

### 后端

1. 环境变量（系统）
2. `.env` 文件
3. 默认值（最低）

---

## 配置故障排除

### 更改未生效

**前端：**
```bash
# 重启开发服务器
npm run dev
```

**后端：**
```bash
# 重启 uvicorn
#（代码更改自动重载，环境变量更改不重载）
```

### 跨域错误

1. 检查 `CORS_ALLOW_ORIGINS` 完全匹配
2. 验证协议一致性
3. 检查尾部斜杠

### API 密钥不工作

1. 验证密钥格式：`sk-...`
2. 检查多余空白
3. 用 curl 测试：
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

---

## 完整配置模板

### 最小化（模拟模式）

```bash
# .env.local（前端）
# 空 = 模拟模式，无需后端

# server/.env（后端）
# 无 AI 功能时不需要
```

### 标准（含 OpenAI）

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:8000
VITE_CHAT_TRANSPORT=auto

# server/.env
OPENAI_API_KEY=sk-...
CORS_ALLOW_ORIGINS=http://localhost:5173
RATE_LIMIT_RPM=60
```

### 生产环境

```bash
# .env.production
VITE_API_BASE_URL=https://api.mydomain.com
VITE_CHAT_TRANSPORT=websocket

# server/.env（服务器上）
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
CORS_ALLOW_ORIGINS=https://mydomain.com
RATE_LIMIT_RPM=1000
LOG_LEVEL=warning
```

---

<p align="center">
  <a href="../architecture/README.zh-CN.md">下一步：架构设计 →</a>
</p>
