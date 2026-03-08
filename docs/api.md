# 后端 API 契约

本文档描述 MetaHuman 前端依赖的后端接口契约。后端基于 **FastAPI**，入口为 `server/app/main.py`。

---

## 1. GET /

根路径，返回服务基本信息。

```json
{
  "service": "MetaHuman Digital Human Service",
  "version": "1.0.0",
  "docs": "/docs",
  "health": "/health"
}
```

> FastAPI 自带交互式文档：访问 `/docs`（Swagger UI）或 `/redoc`。

## 2. GET /health

健康检查与运行模式确认。

```json
{
  "status": "ok",
  "uptime_seconds": 12.34,
  "version": "1.0.0",
  "services": {
    "chat": "available",
    "llm": "available"
  }
}
```

- `services.llm`：
  - `available` — 检测到 `OPENAI_API_KEY`
  - `mock_mode` — 未配置 Key，走本地智能 Mock 回复

---

## 3. POST /v1/chat

对话主接口。输入用户文本，返回结构化的数字人驱动信息。

### 3.1 Request

```json
{
  "sessionId": "optional-session-id",
  "userText": "你好",
  "meta": { "optional": "context" }
}
```

| 字段 | 必填 | 说明 |
|------|:----:|------|
| `userText` | ✅ | 用户输入文本（最大 2000 字符） |
| `sessionId` | — | 会话 ID，用于多轮对话上下文 |
| `meta` | — | 附加上下文信息（场景、视觉状态等） |

### 3.2 Response

```json
{
  "replyText": "您好！很高兴见到您，有什么可以帮助您的吗？",
  "emotion": "happy",
  "action": "wave"
}
```

| 字段 | 说明 |
|------|------|
| `replyText` | 数字人的自然语言回复 |
| `emotion` | 情感状态枚举（见下方） |
| `action` | 动作枚举（见下方） |

**emotion 枚举值**（5 种）：

`neutral` · `happy` · `surprised` · `sad` · `angry`

**action 枚举值**（LLM 输出限定 8 种）：

`idle` · `wave` · `greet` · `think` · `nod` · `shakeHead` · `dance` · `speak`

> 前端 `BehaviorType` 包含 25 种行为（含 `bow`、`clap`、`thumbsUp`、`headTilt`、`shrug`、`lookAround`、`cheer`、`sleep`、`crossArms`、`point` 等），由 UI 面板直接触发，不经过后端 API。

### 3.3 错误响应

```json
{ "detail": "userText 不能为空", "code": "VALIDATION_ERROR" }
```

| 状态码 | 说明 |
|:------:|------|
| 400 | 请求参数错误（`userText` 为空或超长） |
| 500 | 服务器内部错误（返回友好提示） |

### 3.4 回退策略

- **未配置 `OPENAI_API_KEY`**：使用智能 Mock 回复（关键词匹配 + 随机回复），Response 结构不变。
- **LLM 调用失败**（超时 20s / 网络错误 / HTTP 错误）：记录日志并回退 Mock，保证前端链路不断。
- **LLM 返回非 JSON**：将原始内容作为 `replyText`，emotion 和 action 回退为 `neutral` / `idle`。

---

## 4. DELETE /v1/chat/session/{session_id}

清除指定会话的历史记录。

```json
{ "success": true, "message": "会话已清除" }
```

## 5. GET /v1/chat/session/{session_id}/history

获取指定会话的历史记录。

```json
{
  "sessionId": "abc123",
  "history": [
    { "role": "user", "content": "你好", "timestamp": "2025-01-01T12:00:00" },
    { "role": "assistant", "content": "你好！", "timestamp": "2025-01-01T12:00:01" }
  ],
  "count": 2
}
```

> 会话历史存储在内存中（`defaultdict`），最多保留 20 轮。生产环境建议替换为 Redis 等持久化存储。
