# WebSocket API

Real-time bidirectional communication for MetaHuman Engine.

---

## Overview

The WebSocket endpoint provides:

- ⚡ **Low-latency** real-time communication
- 🔄 **Bidirectional** message flow
- 📊 **Live updates** for streaming responses
- 🔌 **Persistent connection** for session state

---

## Connection

### Endpoint

```
ws://localhost:8000/ws
```

For production with SSL:

```
wss://your-domain.com/ws
```

### Connection Flow

```
┌─────────────┐                      ┌─────────────┐
│   Client    │ ───── WebSocket ───► │   Server    │
│  (Browser)  │ ◄─────────────────── │  (FastAPI)  │
└─────────────┘                      └─────────────┘
       │                                    │
       │ 1. Connect                         │
       │ 2. Send: chat message             │
       │ 3. Receive: token stream          │
       │ 4. Receive: done + metadata       │
       │ 5. (Optional) Send next message   │
       │ 6. Close                          │
```

---

## Message Protocol

### Client → Server

#### Chat Message

```json
{
  "type": "chat",
  "userText": "Hello, how are you?",
  "sessionId": "session-123",
  "meta": {
    "source": "voice"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Message type: `chat` |
| `userText` | string | Yes | User's message |
| `sessionId` | string | No | Session identifier |
| `meta` | object | No | Additional metadata |

#### Ping

```json
{
  "type": "ping"
}
```

Keep connection alive (recommended every 30s).

---

### Server → Client

#### Token Stream

```json
{
  "type": "token",
  "content": "Hello"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | `token` |
| `content` | string | Incremental text chunk |

#### Completion

```json
{
  "type": "done",
  "replyText": "Hello! How can I help you today?",
  "emotion": "happy",
  "action": "wave"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | `done` |
| `replyText` | string | Complete response text |
| `emotion` | enum | Emotional state |
| `action` | enum | Avatar action |

#### Error

```json
{
  "type": "error",
  "message": "Request timeout",
  "code": "TIMEOUT"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | `error` |
| `message` | string | Error description |
| `code` | string | Error code |

#### Pong

```json
{
  "type": "pong",
  "timestamp": "2025-04-16T10:00:00Z"
}
```

Response to client ping.

---

## Complete Flow Example

### 1. Connect

```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onopen = () => {
  console.log('Connected to MetaHuman Engine');
};
```

### 2. Send Chat Message

```javascript
ws.send(JSON.stringify({
  type: 'chat',
  userText: 'Tell me about yourself',
  sessionId: 'my-session'
}));
```

### 3. Handle Streaming Response

```javascript
let fullText = '';

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'token':
      // Stream text to UI
      fullText += data.content;
      updateChatDisplay(fullText);
      break;
      
    case 'done':
      // Final response received
      console.log('Complete:', data.replyText);
      console.log('Emotion:', data.emotion);
      console.log('Action:', data.action);
      
      // Trigger avatar
      digitalHumanEngine.perform({
        emotion: data.emotion,
        action: data.action
      });
      
      // Trigger TTS
      ttsService.speak(data.replyText);
      break;
      
    case 'error':
      console.error('Error:', data.message);
      break;
  }
};
```

### 4. Keep Alive

```javascript
// Send ping every 30 seconds
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 30000);
```

### 5. Handle Disconnection

```javascript
ws.onclose = (event) => {
  console.log('Disconnected:', event.code, event.reason);
  
  // Auto-reconnect logic
  if (!event.wasClean) {
    setTimeout(connect, 3000);
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};
```

---

## Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `TIMEOUT` | Request took too long | Retry with shorter message |
| `RATE_LIMIT` | Too many requests | Wait and retry |
| `INVALID_MESSAGE` | Malformed message | Check message format |
| `SESSION_EXPIRED` | Session not found | Create new session |
| `SERVICE_UNAVAILABLE` | Backend error | Retry or use HTTP fallback |

---

## Reconnection Strategy

```javascript
class MetaHumanWebSocket {
  constructor(url) {
    this.url = url;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = () => {
      console.log('Connected');
      this.reconnectAttempts = 0;
    };
    
    this.ws.onclose = () => {
      this.handleReconnect();
    };
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;
      
      console.log(`Reconnecting in ${delay}ms...`);
      setTimeout(() => this.connect(), delay);
    } else {
      console.error('Max reconnection attempts reached');
      // Fall back to HTTP/SSE
    }
  }

  send(message) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected');
    }
  }
}
```

---

## Comparison with HTTP/SSE

| Feature | HTTP | SSE | WebSocket |
|---------|------|-----|-----------|
| **Latency** | Higher | Medium | Lowest |
| **Streaming** | No | Yes (server→client) | Yes (bidirectional) |
| **Connection** | Per-request | Persistent | Persistent |
| **Use Case** | Simple requests | One-way streaming | Real-time chat |
| **Fallback Priority** | 3 | 2 | 1 (preferred) |

---

## Browser Support

| Browser | WebSocket Support |
|---------|-------------------|
| Chrome 16+ | ✅ Full |
| Firefox 11+ | ✅ Full |
| Safari 7+ | ✅ Full |
| Edge 12+ | ✅ Full |

---

<p align="center">
  <a href="../guide/">Next: User Guide →</a>
</p>
