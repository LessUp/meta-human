# Architecture Overview

System design and data flow for MetaHuman Engine.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI Layer                                 │
│   Pages → Components → Hooks → Services                         │
│   React · TypeScript · Tailwind CSS                             │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Service Container Layer                       │
│   ServicesProvider · useServices · useEngine · useDialogue      │
│   React Context for runtime services                            │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Core Engine Layer                           │
│   Avatar · Dialogue · Vision · Audio · Performance              │
│   Three.js · Web Speech API · MediaPipe                         │
│   (No React imports - pure runtime logic)                       │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        State Layer                               │
│   chatSessionStore · systemStore · digitalHumanStore            │
│   Zustand 5                                                      │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      External Services                           │
│   Browser TTS/ASR (primary) · Optional FastAPI backend          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layer Responsibilities

### UI Layer

**Responsibility:** Render interface, handle user interactions

**Key Components:**

| Component            | File                                | Purpose                          |
| -------------------- | ----------------------------------- | -------------------------------- |
| `DigitalHumanViewer` | `components/DigitalHumanViewer.tsx` | 3D viewport and avatar rendering |
| `ChatDock`           | `components/ChatDock.tsx`           | Chat interface with streaming    |
| `TopHUD`             | `components/TopHUD.tsx`             | Status bar and metrics           |
| `ControlPanel`       | `components/ControlPanel.tsx`       | Quick actions panel              |
| `SettingsDrawer`     | `components/SettingsDrawer.tsx`     | Configuration panel              |

### Core Engine Layer

**Responsibility:** Business logic and domain-specific operations (pure runtime, no React)

**Modules:**

| Module             | Entry Point                               | Purpose                             |
| ------------------ | ----------------------------------------- | ----------------------------------- |
| Avatar             | `core/avatar/DigitalHumanEngine.ts`       | 3D rendering and animation          |
| AvatarContract     | `core/avatar/avatarContract.ts`           | Canonical emotion/action vocabulary |
| Dialogue           | `core/dialogue/dialogueService.ts`        | Chat transport and orchestration    |
| DialogueRouter     | `core/dialogue/dialogueEndpointRouter.ts` | Endpoint failover management        |
| DialogueHttpClient | `core/dialogue/dialogueHttpClient.ts`     | HTTP/SSE request execution          |
| Vision             | `core/vision/visionService.ts`            | Face and pose detection             |
| Audio              | `core/audio/audioService.ts`              | Speech synthesis and recognition    |
| Performance        | `core/performance/deviceCapability.ts`    | Hardware optimization               |

### Service Container Layer

**Responsibility:** React service container seam for UI components

**Entry Point:** `src/services/index.ts`

| Export             | Purpose                                   |
| ------------------ | ----------------------------------------- |
| `ServicesProvider` | React provider that owns service lifetime |
| `useServices`      | Hook to access all services               |
| `useEngine`        | Hook to access DigitalHumanEngine         |
| `useTTS`           | Hook to access TTSService                 |
| `useASR`           | Hook to access ASRService                 |
| `useDialogue`      | Hook to access DialogueOrchestrator       |

### State Layer

**Responsibility:** Application state management

**Stores:**

| Store               | File                         | Responsibility                     |
| ------------------- | ---------------------------- | ---------------------------------- |
| `chatSessionStore`  | `store/chatSessionStore.ts`  | Message history, session lifecycle |
| `systemStore`       | `store/systemStore.ts`       | Connection, errors, performance    |
| `digitalHumanStore` | `store/digitalHumanStore.ts` | Avatar runtime state               |

### External Services

**Responsibility:** Backend APIs and third-party integrations

| Service  | Protocol           | Purpose            |
| -------- | ------------------ | ------------------ |
| Chat API | HTTP/SSE/WebSocket | AI dialogue        |
| TTS      | HTTP               | Speech synthesis   |
| ASR      | HTTP               | Speech recognition |
| Health   | HTTP               | Service status     |

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
  chatHistory: [], // Chat domain
  connectionStatus: '', // System domain
  isPlaying: false, // Avatar domain
}));

// ✅ After: Focused stores
const useChatSessionStore = create(() => ({
  chatHistory: [], // Only chat
}));

const useSystemStore = create(() => ({
  connectionStatus: '', // Only system
}));

const useDigitalHumanStore = create(() => ({
  isPlaying: false, // Only avatar
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
  stream(message: ChatMessage, callbacks: StreamCallbacks): Promise<void>;

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

| Operation | Primary                   | Fallback                | Last Resort   |
| --------- | ------------------------- | ----------------------- | ------------- |
| TTS       | Browser Web Speech        | Silent (text)           | —             |
| ASR       | Browser SpeechRecognition | Disabled                | —             |
| Dialogue  | Configured backend        | Local frontend response | Error message |
| Avatar    | Custom GLB/GLTF           | Procedural avatar       | Placeholder   |
| Vision    | MediaPipe models          | Panel disabled          | —             |

---

## Extension Points

### Adding New Emotion or Action

1. Update vocabulary in `core/avatar/avatarContract.ts`
2. Update animation mapping in `core/avatar/constants.ts` if needed
3. Update animation rendering in `components/viewer/CyberAvatar.tsx` if visual behavior changes
4. Update optional backend response contract in `examples/backend-python/app/services/dialogue.py` if backend should emit it
5. Add/adjust tests at the contract seam

### Adding New Transport

1. Implement `ChatTransport` interface in `core/dialogue/chatTransport.ts`
2. Add to transport registry
3. Update auto-selection logic

---
