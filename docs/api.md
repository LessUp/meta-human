# 后端 API 契约（Demo/SDK）

本文档描述前端 Demo/SDK 依赖的最小后端接口契约。

## 1. GET /health

用于健康检查与运行模式确认。

响应示例：

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

说明：

- `services.llm`：
  - `available` 表示检测到 `OPENAI_API_KEY`
  - `mock_mode` 表示未配置 key，将走 Mock 回复

## 2. POST /v1/chat

对话接口，输入文本，返回结构化的数字人驱动信息。

### 2.1 Request

```json
{
  "sessionId": "optional-session-id",
  "userText": "你好",
  "meta": {
    "optional": "context"
  }
}
```

字段说明：

- `sessionId`：可选；用于多轮对话上下文
- `userText`：必填；用户输入
- `meta`：可选；附加上下文信息（场景、视觉状态等）

### 2.2 Response

```json
{
  "replyText": "您好！很高兴见到您，有什么可以帮助您的吗？",
  "emotion": "happy",
  "action": "wave"
}
```

字段说明：

- `replyText`：给用户的自然语言回复
- `emotion`：枚举值：`neutral`、`happy`、`surprised`、`sad`、`angry`
- `action`：枚举值：`idle`、`wave`、`greet`、`think`、`nod`、`shakeHead`、`dance`、`speak`

### 2.3 行为与回退策略

- 未配置 `OPENAI_API_KEY`：后端直接返回本地 Mock（但仍遵守同一 Response 结构）。
- OpenAI 调用失败（超时/网络/HTTP 错误）：后端记录日志并回退 Mock，保证前端链路不断。
