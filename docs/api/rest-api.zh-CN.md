# REST API 参考

MetaHuman Engine HTTP 端点完整参考。

---

## 对话端点

### 单轮对话

```http
POST /v1/chat
```

发送消息并接收完整响应。

**请求：**

```json
{
  "sessionId": "可选会话ID",
  "userText": "你好，最近怎么样？",
  "meta": {}
}
```

| 字段 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `sessionId` | string | 否 | 用于上下文持久化的会话标识 |
| `userText` | string | 是 | 用户消息 |
| `meta` | object | 否 | 额外上下文 |

**响应：**

```json
{
  "replyText": "我很好！今天有什么可以帮您的？",
  "emotion": "happy",
  "action": "wave"
}
```

| 字段 | 类型 | 描述 |
|------|------|------|
| `replyText` | string | 助手文本回复 |
| `emotion` | enum | `neutral` \| `happy` \| `surprised` \| `sad` \| `angry` |
| `action` | enum | `idle` \| `wave` \| `greet` \| `think` \| `nod` \| `shakeHead` \| `dance` \| `speak` |

**行为：**

- 无 `OPENAI_API_KEY`：返回本地模拟响应
- OpenAI 错误时：自动降级到模拟，确保有效响应

---

### 流式对话

```http
POST /v1/chat/stream
Content-Type: application/json
Accept: text/event-stream
```

通过 Server-Sent Events 实时接收响应令牌。

**请求：** 与 `/v1/chat` 相同

**响应：** Server-Sent Events 流

```
data: {"type": "token", "content": "我"}

data: {"type": "token", "content": "很"}

data: {"type": "token", "content": "好！"}

data: {"type": "done", "replyText": "我很好！", "emotion": "happy", "action": "wave"}
```

**事件类型：**

| 类型 | 字段 | 描述 |
|------|------|------|
| `token` | `content` | 增量文本块 |
| `done` | `replyText`, `emotion`, `action` | 带元数据的最终响应 |
| `error` | `message` | 错误信息（如失败） |

**JavaScript 客户端示例：**

```typescript
const eventSource = new EventSource('/v1/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userText: '你好！' })
});

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'token') {
    console.log('令牌:', data.content);
  } else if (data.type === 'done') {
    console.log('完成:', data.replyText);
    eventSource.close();
  }
};
```

---

## 语音合成端点

### 合成语音

```http
POST /v1/tts
```

将文本转换为语音。

**请求：**

```json
{
  "text": "你好，很高兴见到你",
  "voice": "zh-CN-XiaoxiaoNeural",
  "rate": "+0%",
  "format": "mp3"
}
```

| 字段 | 类型 | 必需 | 默认值 | 描述 |
|------|------|------|--------|------|
| `text` | string | 是 | - | 要合成的文本 |
| `voice` | string | 否 | 提供商默认 | 语音标识 |
| `rate` | string | 否 | `+0%` | 语速调节 |
| `format` | string | 否 | `mp3` | 音频格式 |

**响应：**

- `Content-Type: audio/mpeg`
- 二进制音频数据

**可用语音：**

| 语音 ID | 名称 | 区域 | 性别 |
|----------|------|------|------|
| `zh-CN-XiaoxiaoNeural` | 晓晓 | 中文 | 女声 |
| `zh-CN-YunxiNeural` | 云希 | 中文 | 男声 |
| `en-US-JennyNeural` | Jenny | 英语 | 女声 |
| `en-US-GuyNeural` | Guy | 英语 | 男声 |

---

### 语音列表

```http
GET /v1/tts/voices
```

获取可用 TTS 语音。

**响应：**

```json
{
  "provider": "edge",
  "available": true,
  "voices": [
    {
      "id": "zh-CN-XiaoxiaoNeural",
      "name": "晓晓",
      "locale": "zh-CN",
      "gender": "Female"
    }
  ]
}
```

---

## 语音识别端点

### 转录音频

```http
POST /v1/asr
Content-Type: multipart/form-data
```

将音频转换为文本。

**表单字段：**

| 字段 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `file` | File | 是 | 音频文件（wav、mp3 等） |
| `language` | string | 否 | 语言代码（如 `zh`、`en`） |

**响应：**

```json
{
  "text": "你好世界",
  "language": "zh",
  "duration": 2.5
}
```

---

### ASR 状态

```http
GET /v1/asr/status
```

检查 ASR 服务可用性。

**响应：**

```json
{
  "provider": "whisper",
  "available": false,
  "message": "Whisper API 未配置"
}
```

---

## 会话管理端点

### 列出会话

```http
GET /v1/sessions
```

列出所有活动会话。

**响应：**

```json
{
  "sessions": [
    {
      "id": "session-123",
      "created_at": "2025-04-16T10:00:00Z",
      "message_count": 15
    }
  ]
}
```

---

### 获取会话历史

```http
GET /v1/session/{session_id}/history
```

获取会话的对话历史。

**响应：**

```json
{
  "sessionId": "session-123",
  "messages": [
    {
      "role": "user",
      "content": "你好！",
      "timestamp": "2025-04-16T10:00:00Z"
    },
    {
      "role": "assistant",
      "content": "你好！有什么可以帮您？",
      "timestamp": "2025-04-16T10:00:01Z",
      "emotion": "happy",
      "action": "wave"
    }
  ]
}
```

---

### 删除会话

```http
DELETE /v1/session/{session_id}
```

清空会话历史。

**响应：**

```json
{
  "message": "会话已删除"
}
```

---

## 请求/响应示例

### 完整对话流程

```bash
# 1. 开始会话
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userText": "讲个笑话",
    "sessionId": "demo-session"
  }'

# 2. 继续对话（上下文保持）
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userText": "再讲一个",
    "sessionId": "demo-session"
  }'

# 3. 获取历史
curl http://localhost:8000/v1/session/demo-session/history

# 4. 完成后删除会话
curl -X DELETE http://localhost:8000/v1/session/demo-session
```

---

## 错误响应

### 400 错误请求

```json
{
  "detail": "缺少必需字段：userText"
}
```

### 429 速率限制

```json
{
  "detail": "超出速率限制。30秒后再试。"
}
```

### 500 服务器错误

```json
{
  "detail": "内部服务器错误。已激活降级模式。"
}
```

---

<p align="center">
  <a href="./websocket.zh-CN.md">WebSocket API →</a>
</p>
