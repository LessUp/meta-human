# Dialogue System

Specification for the dialogue interaction system.

## Overview

The dialogue system manages conversation flow between user and avatar.

## Data Flow

```
User types message
       │
       ▼
ChatDock.handleSend()
       │
       ▼
useChatStream.handleChatSend()
       │
       ▼
runDialogueTurnStream()
       │
       ├──► chatSessionStore.addMessage('user', text)
       ├──► chatSessionStore.addMessage('assistant', '', streaming)
       │
       ▼
chatTransport.stream()
       │
       ├──► onStreamToken → updateMessage(id, text)
       └──► onDone → apply response.emotion, response.action
              │
              ▼
       ttsService.speak(replyText) [if enabled]
              │
              ▼
       digitalHumanEngine.perform({ emotion, action })
```

## Chat Response Shape

The system SHALL expect the following response format:

```typescript
interface ChatResponse {
  replyText: string;
  emotion: 'neutral' | 'happy' | 'surprised' | 'sad' | 'angry';
  action: 'idle' | 'wave' | 'greet' | 'think' | 'nod' | 'shakeHead' | 'dance' | 'speak';
}
```

## Session Management

The system SHALL support session-based conversations:

```typescript
interface ChatSession {
  sessionId: string;
  messages: Message[];
  createdAt: Date;
}
```

### Session Actions

- `initSession()` — Create new session
- `addMessage(role, content)` — Add message to history
- `updateMessage(id, content)` — Update streaming message
- `clearSession()` — Reset session

## Transport Abstraction

The system SHALL support multiple transport mechanisms:

```typescript
interface ChatTransport {
  // Send message and receive complete response
  send(message: ChatMessage): Promise<ChatResponse>;

  // Send message and receive streaming response
  stream(message: ChatMessage, callbacks: StreamCallbacks): Promise<void>;

  // Check availability
  probe(): Promise<boolean>;
}
```

### Transport Types

| Transport | Protocol | Priority |
|-----------|----------|----------|
| WebSocket | ws:// | 1 (preferred) |
| SSE | HTTP/SSE | 2 |
| HTTP | HTTP POST | 3 (fallback) |

### Auto-Selection

The system SHALL auto-select transport:

1. Try WebSocket (lowest latency)
2. Fall back to SSE (streaming support)
3. Fall back to HTTP (universal)

## Dialogue Orchestration

The `dialogueOrchestrator` SHALL coordinate:

1. Send user message via transport
2. Stream response tokens to UI
3. Apply emotion and action to avatar
4. Trigger TTS if enabled
5. Update session history

## Error Handling

The system SHALL handle errors gracefully:

| Error | Handling |
|-------|----------|
| Network failure | Retry with backoff |
| Timeout | Show timeout message |
| API unavailable | Use local mock response |
| Invalid response | Show error, maintain functionality |

## Retry Strategy

The system SHALL implement retry logic:

- Maximum retries: 3
- Initial delay: 1000ms
- Backoff multiplier: 2
- Max delay: 10000ms

## Voice Input Flow

```
User clicks record
       │
       ▼
asrService.start()
       │
       ▼
User speaks
       │
       ▼
onResult(text)
       │
       ▼
handleChatSend(text) → [same as text flow]
```

## Streaming Behavior

The system SHALL support streaming responses:

1. Show message placeholder immediately
2. Update message content as tokens arrive
3. Mark message complete when `done` event received
4. Apply final emotion/action

## Health Check

The system SHALL provide health check:

- Endpoint: `GET /health`
- Purpose: Verify backend connectivity
- Frequency: On app load, on connection error
- Fallback: Show disconnected state
