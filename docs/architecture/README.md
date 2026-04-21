# Architecture Overview

System design and data flow for MetaHuman Engine.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI Layer                                 │
│   Pages → Components → Hooks → Store                            │
│   React · TypeScript · Tailwind CSS                             │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Core Engine Layer                           │
│   Avatar · Dialogue · Vision · Audio · Performance              │
│   Three.js · Web Speech API · MediaPipe                         │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        State Layer                               │
│   chatSessionStore · systemStore · digitalHumanStore            │
│   Zustand · Immer · Persist                                     │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      External Services                           │
│   OpenAI API · Edge TTS · Whisper ASR · FastAPI                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layer Responsibilities

### UI Layer

**Responsibility:** Render interface, handle user interactions

**Key Components:**

| Component | File | Purpose |
|-----------|------|---------|
| `DigitalHumanViewer` | `components/DigitalHumanViewer.tsx` | 3D viewport and avatar rendering |
| `ChatDock` | `components/ChatDock.tsx` | Chat interface with streaming |
| `TopHUD` | `components/TopHUD.tsx` | Status bar and metrics |
| `ControlPanel` | `components/ControlPanel.tsx` | Quick actions panel |
| `SettingsDrawer` | `components/SettingsDrawer.tsx` | Configuration panel |

### Core Engine Layer

**Responsibility:** Business logic and domain-specific operations

**Modules:**

| Module | Entry Point | Purpose |
|--------|-------------|---------|
| Avatar | `core/avatar/DigitalHumanEngine.ts` | 3D rendering and animation |
| Dialogue | `core/dialogue/dialogueService.ts` | Chat transport and orchestration |
| Vision | `core/vision/visionService.ts` | Face and pose detection |
| Audio | `core/audio/ttsService.ts` | Speech synthesis and recognition |
| Performance | `core/performance/deviceCapability.ts` | Hardware optimization |

### State Layer

**Responsibility:** Application state management

**Stores:**

| Store | File | Responsibility |
|-------|------|----------------|
| `chatSessionStore` | `store/chatSessionStore.ts` | Message history, session lifecycle |
| `systemStore` | `store/systemStore.ts` | Connection, errors, performance |
| `digitalHumanStore` | `store/digitalHumanStore.ts` | Avatar runtime state |

### External Services

**Responsibility:** Backend APIs and third-party integrations

| Service | Protocol | Purpose |
|---------|----------|---------|
| Chat API | HTTP/SSE/WebSocket | AI dialogue |
| TTS | HTTP | Speech synthesis |
| ASR | HTTP | Speech recognition |
| Health | HTTP | Service status |

---

## Data Flow

### Text Dialogue Flow

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

### Voice Input Flow

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

### Vision Flow

```
User enables camera
       │
       ▼
visionService.start()
       │
       ▼
MediaPipe inference (each frame)
       │
       ▼
visionMapper.mapFaceToEmotion(landmarks)
       │
       ▼
{ emotion, motion }
       │
       ├──► digitalHumanEngine.setEmotion(emotion)
       └──► digitalHumanEngine.playAnimation(motion)
```

---

## State Management

### Store Separation Strategy

```typescript
// ❌ Before: Monolithic store
const useDigitalHumanStore = create(() => ({
  chatHistory: [],      // Chat domain
  connectionStatus: '', // System domain
  isPlaying: false,     // Avatar domain
}));

// ✅ After: Focused stores
const useChatSessionStore = create(() => ({
  chatHistory: [],      // Only chat
}));

const useSystemStore = create(() => ({
  connectionStatus: '', // Only system
}));

const useDigitalHumanStore = create(() => ({
  isPlaying: false,     // Only avatar
}));
```

**Benefits:**
- Minimizes re-renders
- Clear ownership boundaries
- Easier testing and debugging
- Independent persistence

### Store Interactions

```
┌──────────────────┐     ┌──────────────────┐
│ chatSessionStore │◄────│  Chat Components │
│  - chatHistory   │     │  - ChatDock      │
│  - sessionId     │     │  - MessageList   │
└──────────────────┘     └──────────────────┘
         │                        │
         │ addMessage()           │ handleSend()
         ▼                        ▼
┌──────────────────────────────────────────┐
│          dialogueOrchestrator            │
└──────────────────────────────────────────┘
         │                        ▲
         ▼                        │
┌──────────────────┐     ┌──────────────────┐
│ digitalHumanStore│────►│ Avatar Components│
│  - emotion       │     │  - Viewer        │
│  - animation     │     │  - Controls      │
└──────────────────┘     └──────────────────┘
         │
         ▼
┌──────────────────┐
│  systemStore     │
│  - status        │
│  - errors        │
└──────────────────┘
```

---

## Transport Abstraction

### Transport Interface

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
```

### Transport Hierarchy

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

### Auto-Selection Priority

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

---

## Performance Optimizations

### Adaptive Rendering

Device tier detection and quality adjustment:

```typescript
// core/performance/deviceCapability.ts
export const deviceTiers = {
  high: {
    shadows: 2048,
    particles: 100,
    dpr: [1, 2],
    postProcessing: true,
  },
  medium: {
    shadows: 1024,
    particles: 50,
    dpr: [1, 1.5],
    postProcessing: false,
  },
  low: {
    shadows: false,
    particles: 20,
    dpr: [1, 1.2],
    postProcessing: false,
  },
};
```

### Animation Throttling

```typescript
// Pause when tab not visible
useIsTabVisibleRef((isVisible) => {
  if (!isVisible) {
    digitalHumanEngine.pause();
  } else {
    digitalHumanEngine.resume();
  }
});

// Frame skipping for low-end devices
if (deviceTier === 'low' && frameCount % 2 !== 0) {
  return; // Skip every other frame
}
```

### State Optimization

```typescript
// ✅ Good: Subscribes only to needed value
const isPlaying = useDigitalHumanStore((s) => s.isPlaying);

// ❌ Bad: Subscribes to entire store
const store = useDigitalHumanStore();
```

---

## Error Handling

### Fallback Chain

```
1. Try primary operation
       │
       ▼ (failure)
2. Try fallback operation
       │
       ▼ (failure)
3. Show user-friendly message
4. Maintain app functionality
```

### Fallback Matrix

| Operation | Primary | Fallback | Last Resort |
|-----------|---------|----------|-------------|
| Chat API | OpenAI | Local mock | Error message |
| 3D Model | GLB file | Procedural avatar | Placeholder |
| TTS | Web Speech | Silent (text) | — |
| Vision | MediaPipe | Panel disabled | — |

---

## Extension Points

### Adding New Emotion

1. Add type to `store/digitalHumanStore.ts`
2. Add mapping in `core/avatar/constants.ts`
3. Add UI option in `ExpressionControlPanel.tsx`

### Adding New Animation

1. Add type to `store/digitalHumanStore.ts`
2. Implement in `DigitalHumanViewer.tsx` CyberAvatar component
3. Add trigger in `DigitalHumanEngine.ts`

### Adding New Transport

1. Implement `ChatTransport` interface
2. Add to transport registry
3. Update auto-selection logic

---
