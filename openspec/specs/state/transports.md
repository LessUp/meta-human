# Transport System

Specification for the chat transport abstraction layer.

## Overview

The transport system provides a unified interface for multiple communication protocols.

## Transport Interface

The system SHALL implement a common transport interface:

```typescript
interface ChatTransport {
  // Send message and receive complete response
  send(message: ChatMessage): Promise<ChatResponse>;

  // Send message and receive streaming response
  stream(
    message: ChatMessage,
    callbacks: StreamCallbacks
  ): Promise<void>;

  // Check availability
  probe(): Promise<boolean>;
}

interface ChatMessage {
  sessionId?: string;
  userText: string;
  meta?: Record<string, unknown>;
}

interface StreamCallbacks {
  onStreamToken: (token: string) => void;
  onDone: (response: ChatResponse) => void;
  onError: (error: Error) => void;
}
```

## Transport Hierarchy

```
ChatTransport (Interface)
    │
    ├── HTTPTransport
    │   └── POST /v1/chat
    │
    ├── SSETransport
    │   └── POST /v1/chat/stream
    │   └── EventSource
    │
    └── WebSocketTransport
        └── WebSocket /ws
```

## HTTP Transport

The system SHALL support basic HTTP transport:

- Endpoint: `POST /v1/chat`
- Request body: `ChatMessage`
- Response: `ChatResponse` (complete)
- Use case: Simple requests, universal fallback

## SSE Transport

The system SHALL support Server-Sent Events transport:

- Endpoint: `POST /v1/chat/stream`
- Accept header: `text/event-stream`
- Events:
  - `token` — Incremental text chunk
  - `done` — Final response with metadata
  - `error` — Error message

### SSE Event Types

```typescript
// Token event
{ type: 'token', content: 'Hello' }

// Done event
{ type: 'done', replyText: '...', emotion: 'happy', action: 'wave' }

// Error event
{ type: 'error', message: 'Request timeout' }
```

## WebSocket Transport

The system SHALL support WebSocket transport:

- Endpoint: `ws://localhost:8000/ws`
- Bidirectional message flow
- Lowest latency option

### WebSocket Message Types

**Client → Server:**

```typescript
// Chat message
{ type: 'chat', userText: 'Hello', sessionId: '...' }

// Keep-alive
{ type: 'ping' }
```

**Server → Client:**

```typescript
// Token stream
{ type: 'token', content: 'Hello' }

// Completion
{ type: 'done', replyText: '...', emotion: 'happy', action: 'wave' }

// Error
{ type: 'error', message: '...', code: 'TIMEOUT' }

// Pong
{ type: 'pong', timestamp: '...' }
```

## Auto-Selection Priority

The system SHALL auto-select transport:

```typescript
async function selectTransport(): Promise<ChatTransport> {
  // 1. Try WebSocket (lowest latency)
  if (await wsTransport.probe()) {
    return wsTransport;
  }

  // 2. Try SSE (streaming support)
  if (await sseTransport.probe()) {
    return sseTransport;
  }

  // 3. Fall back to HTTP (universal)
  return httpTransport;
}
```

## Reconnection Strategy

WebSocket transport SHALL implement reconnection:

- Maximum attempts: 5
- Initial delay: 1000ms
- Backoff: Linear (delay × attempt)
- Fallback: Switch to SSE/HTTP

## Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `TIMEOUT` | Request timeout | Retry with shorter message |
| `RATE_LIMIT` | Too many requests | Wait and retry |
| `INVALID_MESSAGE` | Malformed message | Check format |
| `SESSION_EXPIRED` | Session not found | Create new session |
| `SERVICE_UNAVAILABLE` | Backend error | Use HTTP fallback |

## Keep-Alive

WebSocket transport SHALL implement keep-alive:

- Send `ping` every 30 seconds
- Expect `pong` response
- Reconnect if no response

## Comparison Matrix

| Feature | HTTP | SSE | WebSocket |
|---------|------|-----|-----------|
| Latency | Higher | Medium | Lowest |
| Streaming | No | Yes (server→client) | Yes (bidirectional) |
| Connection | Per-request | Persistent | Persistent |
| Use Case | Simple requests | One-way streaming | Real-time chat |
| Fallback Priority | 3 | 2 | 1 (preferred) |
