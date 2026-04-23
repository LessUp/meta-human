# REST API

Specification for the HTTP API endpoints.

## Base URL

- Default: `http://localhost:8000`
- Configurable via: `VITE_API_BASE_URL` environment variable

## Endpoints

### Health Check

```http
GET /health
```

Check backend connectivity.

**Response:**
```json
{ "status": "ok" }
```

---

### Single Turn Chat

```http
POST /v1/chat
Content-Type: application/json
```

Send a message and receive a complete response.

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
| `sessionId` | string | No | Session identifier for context persistence |
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
| `emotion` | enum | `neutral` \| `happy` \| `surprised` \| `sad` \| `angry` |
| `action` | enum | `idle` \| `wave` \| `greet` \| `think` \| `nod` \| `shakeHead` \| `dance` \| `speak` |

**Behavior:**
- Without `OPENAI_API_KEY`: Returns local mock response
- On OpenAI error: Falls back to mock, guarantees valid response

---

### Streaming Chat

```http
POST /v1/chat/stream
Content-Type: application/json
Accept: text/event-stream
```

Receive response tokens in real-time via Server-Sent Events.

**Request:** Same as `/v1/chat`

**Response:** Server-Sent Events stream

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
| `done` | `replyText`, `emotion`, `action` | Final response with metadata |
| `error` | `message` | Error message (if failed) |

---

### Text-to-Speech

```http
POST /v1/tts
Content-Type: application/json
```

Convert text to spoken audio.

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

**Available Voices:**

| Voice ID | Name | Locale | Gender |
|----------|------|--------|--------|
| `zh-CN-XiaoxiaoNeural` | Xiaoxiao | zh-CN | Female |
| `zh-CN-YunxiNeural` | Yunxi | zh-CN | Male |
| `en-US-JennyNeural` | Jenny | en-US | Female |
| `en-US-GuyNeural` | Guy | en-US | Male |

---

### List TTS Voices

```http
GET /v1/tts/voices
```

Get available TTS voices.

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

### Speech-to-Text

```http
POST /v1/asr
Content-Type: multipart/form-data
```

Convert audio to text.

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

```http
GET /v1/asr/status
```

Check ASR service availability.

**Response:**

```json
{
  "provider": "whisper",
  "available": false,
  "message": "Whisper API not configured"
}
```

---

### List Sessions

```http
GET /v1/sessions
```

List all active sessions.

**Response:**

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

### Get Session History

```http
GET /v1/session/{session_id}/history
```

Get conversation history for a session.

**Response:**

```json
{
  "sessionId": "session-123",
  "messages": [
    {
      "role": "user",
      "content": "Hello!",
      "timestamp": "2025-04-16T10:00:00Z"
    },
    {
      "role": "assistant",
      "content": "Hi there! How can I help?",
      "timestamp": "2025-04-16T10:00:01Z",
      "emotion": "happy",
      "action": "wave"
    }
  ]
}
```

---

### Delete Session

```http
DELETE /v1/session/{session_id}
```

Clear session history.

**Response:**

```json
{
  "message": "Session deleted"
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "detail": "Missing required field: userText"
}
```

### 429 Rate Limited

```json
{
  "detail": "Rate limit exceeded. Try again in 30 seconds."
}
```

### 500 Server Error

```json
{
  "detail": "Internal server error. Fallback mode activated."
}
```
