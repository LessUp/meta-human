# 后端 API 契约（Demo/SDK）

本文档描述前端 Demo/SDK 依赖的后端接口契约。交互式文档在后端启动后可访问 `/docs`。

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
    "llm": "available",
    "tts": "available",
    "asr": "unavailable"
  }
}
```

说明：

- `services.llm`：`available`（有 key）或 `mock_mode`（无 key）
- `services.tts`：`available` 或 `unavailable`
- `services.asr`：`available` 或 `unavailable`

## 2. POST /v1/chat

对话接口，输入文本，返回结构化的数字人驱动信息。

### 2.1 Request

```json
{
  "sessionId": "optional-session-id",
  "userText": "你好",
  "meta": { "optional": "context" }
}
```

### 2.2 Response

```json
{
  "replyText": "您好！很高兴见到您，有什么可以帮助您的吗？",
  "emotion": "happy",
  "action": "wave"
}
```

- `emotion`：`neutral` | `happy` | `surprised` | `sad` | `angry`
- `action`：`idle` | `wave` | `greet` | `think` | `nod` | `shakeHead` | `dance` | `speak`

### 2.3 行为与回退策略

- 未配置 `OPENAI_API_KEY`：后端返回本地 Mock（遵守同一 Response 结构）。
- OpenAI 调用失败（超时/网络/HTTP 错误）：回退 Mock，保证前端链路不断。

## 3. POST /v1/chat/stream

流式对话接口（Server-Sent Events）。请求体与 `/v1/chat` 相同。

每个 SSE 事件为 JSON：

```
data: {"type": "token", "content": "你"}
data: {"type": "token", "content": "好"}
data: {"type": "done", "replyText": "你好！", "emotion": "happy", "action": "wave"}
```

## 4. POST /v1/tts

文字转语音，返回音频字节流。

### 4.1 Request

```json
{
  "text": "你好，很高兴见到你",
  "voice": "zh-CN-XiaoxiaoNeural",
  "rate": "+0%",
  "format": "mp3"
}
```

### 4.2 Response

`Content-Type: audio/mpeg`，返回音频二进制数据。

## 5. GET /v1/tts/voices

获取可用语音列表。

```json
{
  "provider": "edge",
  "available": true,
  "voices": [
    { "id": "zh-CN-XiaoxiaoNeural", "name": "...", "locale": "zh-CN", "gender": "Female" }
  ]
}
```

## 6. POST /v1/asr

语音识别，上传音频文件。

- **Content-Type**: `multipart/form-data`
- **字段**: `file`（音频文件）、`language`（可选，如 `zh`）

```json
{ "text": "你好世界", "language": "zh", "duration": 2.5 }
```

## 7. GET /v1/asr/status

ASR 服务状态。

```json
{ "provider": "whisper", "available": false }
```

## 8. 会话管理

### GET /v1/sessions

列出所有活跃会话。

### GET /v1/session/{session_id}/history

获取指定会话历史。

### DELETE /v1/session/{session_id}

清除指定会话历史。
