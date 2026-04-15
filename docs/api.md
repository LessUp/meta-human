# API Reference

Backend API contract for MetaHuman Engine.

**Base URL:** `VITE_API_BASE_URL` or `http://localhost:8000`

## Endpoints

### Health Check

```
GET /health
```

**Response:**

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

**Service Status Values:**
- `available` — Service is working
- `mock_mode` — No API key, using mock
- `unavailable` — Service not configured

---

### Chat

```
POST /v1/chat
```

**Request:**

```json
{
  "sessionId": "optional-session-id",
  "userText": "Hello, how are you?",
  "meta": {}
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sessionId` | string | No | Session identifier for context |
| `userText` | string | Yes | User's message |
| `meta` | object | No | Additional context |

**Response:**

```json
{
  "replyText": "I'm doing great! How can I help you today?",
  "emotion": "happy",
  "action": "wave"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `replyText` | string | Assistant's text response |
| `emotion` | enum | `neutral`, `happy`, `surprised`, `sad`, `angry` |
| `action` | enum | `idle`, `wave`, `greet`, `think`, `nod`, `shakeHead`, `dance`, `speak` |

**Behavior:**
- Without `OPENAI_API_KEY`: Returns local mock response
- On OpenAI error: Falls back to mock, guarantees valid response

---

### Streaming Chat

```
POST /v1/chat/stream
Content-Type: application/json
Accept: text/event-stream
```

**Request:** Same as `/v1/chat`

**Response:** Server-Sent Events

```
data: {"type": "token", "content": "I'm"}

data: {"type": "token", "content": " doing"}

data: {"type": "token", "content": " great!"}

data: {"type": "done", "replyText": "I'm doing great!", "emotion": "happy", "action": "wave"}
```

**Event Types:**

| Type | Fields | Description |
|------|--------|-------------|
| `token` | `content` | Incremental text chunk |
| `done` | `replyText`, `emotion`, `action` | Final response |

---

### Text-to-Speech

```
POST /v1/tts
```

**Request:**

```json
{
  "text": "Hello, nice to meet you",
  "voice": "zh-CN-XiaoxiaoNeural",
  "rate": "+0%",
  "format": "mp3"
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `text` | string | Yes | - | Text to synthesize |
| `voice` | string | No | Provider default | Voice identifier |
| `rate` | string | No | `+0%` | Speaking rate adjustment |
| `format` | string | No | `mp3` | Audio format |

**Response:**
- `Content-Type: audio/mpeg`
- Binary audio data

---

### List Voices

```
GET /v1/tts/voices
```

**Response:**

```json
{
  "provider": "edge",
  "available": true,
  "voices": [
    {
      "id": "zh-CN-XiaoxiaoNeural",
      "name": "Xiaoxiao",
      "locale": "zh-CN",
      "gender": "Female"
    }
  ]
}
```

---

### Speech Recognition

```
POST /v1/asr
Content-Type: multipart/form-data
```

**Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Audio file (wav, mp3, etc.) |
| `language` | string | No | Language code (e.g., `zh`, `en`) |

**Response:**

```json
{
  "text": "Hello world",
  "language": "en",
  "duration": 2.5
}
```

---

### ASR Status

```
GET /v1/asr/status
```

**Response:**

```json
{
  "provider": "whisper",
  "available": false
}
```

---

### Session Management

```
GET /v1/sessions
```

List all active sessions.

```
GET /v1/session/{session_id}/history
```

Get conversation history for a session.

```
DELETE /v1/session/{session_id}
```

Clear session history.

---

## WebSocket

```
WebSocket /ws
```

Real-time bidirectional communication.

**Client → Server:**

```json
{
  "type": "chat",
  "userText": "Hello",
  "sessionId": "session-123",
  "meta": {}
}
```

**Server → Client:**

```json
{"type": "token", "content": "Hi"}

{"type": "token", "content": " there!"}

{"type": "done", "replyText": "Hi there!", "emotion": "happy", "action": "wave"}
```

**Error Event:**

```json
{
  "type": "error",
  "message": "Request timeout"
}
```

---

## Error Responses

All endpoints may return errors in this format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**

| Code | Meaning |
|------|---------|
| 400 | Bad request — invalid input |
| 401 | Unauthorized — missing/invalid API key |
| 429 | Too many requests — rate limited |
| 500 | Server error — fallback may activate |
| 503 | Service unavailable — check health endpoint |

---

## Rate Limiting

Default: 60 requests per minute (configurable via `RATE_LIMIT_RPM`)

Rate limit headers included in responses:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1700000000
```

---

## CORS

Configure allowed origins via `CORS_ALLOW_ORIGINS` environment variable:

```
CORS_ALLOW_ORIGINS=https://example.com,https://app.example.com
```

For local development, all origins are allowed.
