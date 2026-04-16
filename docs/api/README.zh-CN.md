# API 参考

MetaHuman Engine 后端服务的完整 API 文档。

---

## 概览

MetaHuman Engine 后端提供 RESTful API 和 WebSocket 端点，支持：

- 🤖 **对话系统** — 支持流式输出的 AI 对话
- 🔊 **语音合成** — 多音色语音合成
- 🎤 **语音识别** — 音频转录
- 📊 **会话管理** — 持久化对话上下文

---

## 基础 URL

```
VITE_API_BASE_URL || http://localhost:8000
```

---

## 认证

目前大部分端点不需要认证。速率限制基于 IP 地址。

生产环境中，设置 `CORS_ALLOW_ORIGINS` 限制访问：

```bash
CORS_ALLOW_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

---

## API 端点

### 健康检查

```http
GET /health
```

检查服务状态和子系统可用性。

**响应：**

```json
{
  "status": "ok",
  "uptime_seconds": 123.45,
  "version": "1.0.0",
  "services": {
    "chat": "available",
    "llm": "available",
    "tts": "available",
    "asr": "unavailable"
  }
}
```

| 状态 | 含义 |
|------|------|
| `available` | 服务正常 |
| `mock_mode` | 无 API Key，使用本地模拟 |
| `unavailable` | 服务未配置 |

---

## 详细文档

| 文档 | 描述 |
|------|------|
| [REST API](./rest-api.zh-CN.md) | 完整 HTTP API 参考 |
| [WebSocket](./websocket.zh-CN.md) | 实时通信协议 |

---

## 速率限制

默认：每个 IP 每分钟 60 次请求

响应头中包含：

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1700000000
```

通过环境变量配置：

```bash
RATE_LIMIT_RPM=60
```

---

## 跨域配置

配置允许的源：

```bash
CORS_ALLOW_ORIGINS=https://example.com,https://app.example.com
```

本地开发允许所有源。

---

## 错误处理

所有端点按以下格式返回错误：

```json
{
  "detail": "描述错误的详细信息"
}
```

### HTTP 状态码

| 状态码 | 含义 |
|--------|------|
| 400 | 错误请求 — 输入无效 |
| 401 | 未授权 — API Key 缺失或无效 |
| 429 | 请求过多 — 触发速率限制 |
| 500 | 服务器错误 — 可能触发兜底 |
| 503 | 服务不可用 — 检查健康端点 |

---

## OpenAPI / Swagger

本地运行后端时可访问交互式 API 文档：

```
http://localhost:8000/docs         # Swagger UI
http://localhost:8000/redoc        # ReDoc
```

---

## SDK 和客户端

目前未提供官方 SDK。使用标准 HTTP 客户端：

### cURL 示例

```bash
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userText": "你好，最近怎么样？"
  }'
```

### JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:8000/v1/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userText: '你好！' })
});

const data = await response.json();
```

---

## 更新日志

查看 [CHANGELOG](../../CHANGELOG.zh-CN.md) 了解 API 变更和版本历史。

---

<p align="center">
  <a href="./rest-api.zh-CN.md">REST API 参考 →</a>
</p>
