# Architecture

## System Overview

MetaHuman Engine follows a layered architecture with clear separation of concerns.

```
┌─────────────────────────────────────────────────────────────────┐
│                          UI Layer                                │
│   Pages → Components → Hooks → Store                            │
└─────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                       Core Engine Layer                          │
│   Avatar · Dialogue · Vision · Audio · Performance              │
└─────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                      External Services                           │
│   Three.js · Web Speech API · MediaPipe · OpenAI                │
└─────────────────────────────────────────────────────────────────┘
```

## Layer Details

### 1. UI Layer

**Pages**

| Page | Route | Purpose |
|------|-------|---------|
| `AdvancedDigitalHumanPage` | `/`, `/advanced` | Full-featured main experience |
| `DigitalHumanPage` | `/digital-human` | Simple demo page |

**Components**

| Component | Responsibility |
|-----------|----------------|
| `DigitalHumanViewer` | 3D viewport, model loading, procedural avatar fallback |
| `ChatDock` | Chat input, message list, streaming display |
| `TopHUD` | Status bar: connection, behavior, performance metrics |
| `ControlPanel` | Quick actions: play/pause, reset, voice commands |
| `SettingsDrawer` | Tabbed settings: expressions, behaviors, voice, vision |

**Hooks**

| Hook | Purpose |
|------|---------|
| `useAdvancedDigitalHumanController` | Business logic for main page |
| `useChatStream` | Chat message lifecycle, streaming |
| `useConnectionHealth` | Health checks, reconnect logic |

### 2. Core Engine Layer

#### Avatar Engine

**File:** `core/avatar/DigitalHumanEngine.ts`

Imperative façade for avatar control:

```typescript
class DigitalHumanEngine {
  // Single unified call
  perform({ emotion, expression, animation }): void
  
  // Individual controls
  setEmotion(emotion: EmotionType): void
  setExpression(expression: ExpressionType): void
  playAnimation(animation: string): void
  
  // Lifecycle
  reset(): void
  dispose(): void
}
```

**Emotion → Expression Mapping:**

| Emotion | Default Expression |
|---------|-------------------|
| happy | smile |
| surprised | surprise |
| sad | sad |
| angry | angry |
| neutral | neutral |

#### Dialogue System

**Transport Abstraction:**

```
ChatTransport Interface
├── HTTP Transport    → POST /v1/chat
├── SSE Transport     → POST /v1/chat/stream
└── WebSocket Transport → WebSocket /ws
```

**Auto-selection Priority:**
1. Probe WebSocket capability
2. Fall back to SSE
3. Final fall back to HTTP

**Orchestrator Flow:**

```
User Input
    │
    ▼
dialogueOrchestrator.runDialogueTurnStream()
    │
    ├─► Add user message to store
    ├─► Set loading state
    ├─► Set behavior: 'thinking'
    │
    ▼
Transport.stream()
    │
    ├─► onStreamToken: Update message progressively
    ├─► onDone: Apply emotion/action to avatar
    │
    ▼
TTS.speak(replyText) [if not muted]
```

#### Vision Pipeline

**File:** `core/vision/visionService.ts`

```
Camera → MediaPipe Face Mesh
                    │
                    ▼
         visionMapper.mapFaceToEmotion()
                    │
                    ▼
              Emotion Result
                    │
                    ▼
         digitalHumanEngine.setEmotion()
```

**Detected Signals:**
- Emotions: happy, sad, surprised, angry, neutral
- Motions: nod, shake head, raise hand, wave

#### Audio Services

**TTS (Text-to-Speech):**
- Primary: Web Speech API
- Fallback: Silent mode with text display
- Features: Queue management, interruption support

**ASR (Speech-to-Text):**
- Browser-native Speech Recognition
- Modes: command mode, dictation mode
- Voice commands: greeting, dance, speak, emote

### 3. State Layer

**Store Separation:**

```
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│  chatSessionStore   │  │    systemStore      │  │ digitalHumanStore   │
├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤
│ • sessionId         │  │ • connectionStatus  │  │ • isPlaying         │
│ • chatHistory       │  │ • error             │  │ • isRecording       │
│ • addMessage()      │  │ • isLoading         │  │ • isSpeaking        │
│ • updateMessage()   │  │ • chatPerformance   │  │ • currentEmotion    │
│                     │  │ • renderPerformance │  │ • currentAnimation  │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
```

**Why Three Stores?**
- Minimizes re-renders (chat updates don't trigger avatar re-renders)
- Clear ownership boundaries
- Easier testing and debugging

## Data Flows

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
       ├──► chatSessionStore.addMessage('assistant', '', isStreaming: true)
       │
       ▼
chatTransport.stream()
       │
       ├──► onStreamToken → updateMessage(id, text)
       └──► onDone → apply response.emotion, response.action
              │
              ▼
       ttsService.speak(replyText) [if not muted]
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

## Performance Optimizations

### Adaptive Rendering

Device capability detection in `core/performance/deviceCapability.ts`:

| Tier | Shadows | Particles | DPR | Post-processing |
|------|---------|-----------|-----|-----------------|
| High | ✅ 2048 | 100 | 1-2 | ✅ |
| Medium | ✅ 1024 | 50 | 1-1.5 | ❌ |
| Low | ❌ | 20 | 1-1.2 | ❌ |

### Animation Throttling

- Tab visibility detection pauses animations
- Low-end devices skip frames (render every 2nd frame)
- Reduced motion preference respected

### State Subscription Optimization

```typescript
// ❌ Bad: subscribes to entire store
const store = useDigitalHumanStore();

// ✅ Good: subscribes to specific value
const isPlaying = useDigitalHumanStore(s => s.isPlaying);
```

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

**Examples:**

| Operation | Primary | Fallback |
|-----------|---------|----------|
| Chat API | OpenAI | Local mock |
| 3D Model | GLB file | Procedural avatar |
| TTS | Web Speech | Silent (text only) |
| Vision | MediaPipe | Panel disabled |

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

1. Implement `ChatTransport` interface in `core/dialogue/chatTransport.ts`
2. Add to transport registry
3. Update auto-selection logic
