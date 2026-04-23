# Architecture

System design and data flow for MetaHuman Engine.

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

## Layer Responsibilities

### UI Layer

Responsibility: Render interface, handle user interactions

| Component | File | Purpose |
|-----------|------|---------|
| `DigitalHumanViewer` | `components/DigitalHumanViewer.tsx` | 3D viewport and avatar rendering |
| `ChatDock` | `components/ChatDock.tsx` | Chat interface with streaming |
| `TopHUD` | `components/TopHUD.tsx` | Status bar and metrics |
| `ControlPanel` | `components/ControlPanel.tsx` | Quick actions panel |
| `SettingsDrawer` | `components/SettingsDrawer.tsx` | Configuration panel |

### Core Engine Layer

Responsibility: Business logic and domain-specific operations

| Module | Entry Point | Purpose |
|--------|-------------|---------|
| Avatar | `core/avatar/DigitalHumanEngine.ts` | 3D rendering and animation |
| Dialogue | `core/dialogue/dialogueService.ts` | Chat transport and orchestration |
| Vision | `core/vision/visionService.ts` | Face and pose detection |
| Audio | `core/audio/audioService.ts` | Speech synthesis and recognition |
| Performance | `core/performance/deviceCapability.ts` | Hardware optimization |

### State Layer

Responsibility: Application state management

| Store | File | Responsibility |
|-------|------|----------------|
| `chatSessionStore` | `store/chatSessionStore.ts` | Message history, session lifecycle |
| `systemStore` | `store/systemStore.ts` | Connection, errors, performance |
| `digitalHumanStore` | `store/digitalHumanStore.ts` | Avatar runtime state |

### External Services

Responsibility: Backend APIs and third-party integrations

| Service | Protocol | Purpose |
|---------|----------|---------|
| Chat API | HTTP/SSE/WebSocket | AI dialogue |
| TTS | HTTP | Speech synthesis |
| ASR | HTTP | Speech recognition |
| Health | HTTP | Service status |

## Key Patterns

### Service → Store Flow

Services read/write store via `useXStore.getState()` to avoid props drilling:

```typescript
// In service
const { setSpeaking, setBehavior } = useDigitalHumanStore.getState();
setBehavior('thinking');
```

### Store Selector Pattern

Use selectors to minimize re-renders:

```typescript
// Good - only subscribes to specific value
const isPlaying = useDigitalHumanStore((s) => s.isPlaying);

// Avoid - subscribes to entire store
const { isPlaying, ...rest } = useDigitalHumanStore();
```

### Fallback Strategy

All external calls have fallbacks:

- Model load fails → procedural CyberAvatar
- API unavailable → local mock response
- TTS fails → text-only display
- Vision fails → disable panel gracefully

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

- Pause when tab not visible
- Frame skipping for low-end devices

### State Optimization

Always use specific selectors to minimize re-renders.

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
