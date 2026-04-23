# State Management

Specification for the Zustand state management system.

## Overview

MetaHuman Engine uses Zustand for state management with a separated store architecture.

## Store Separation Strategy

The system SHALL use three focused stores:

| Store | Scope | File |
|-------|-------|------|
| `chatSessionStore` | Messages, session lifecycle | `store/chatSessionStore.ts` |
| `systemStore` | Connection, errors, performance | `store/systemStore.ts` |
| `digitalHumanStore` | Avatar runtime state | `store/digitalHumanStore.ts` |

## Chat Session Store

The system SHALL maintain chat session state:

```typescript
interface ChatSessionState {
  sessionId: string | null;
  messages: Message[];

  // Actions
  initSession: () => void;
  addMessage: (role: string, content: string) => string;
  updateMessage: (id: string, content: string) => void;
  clearSession: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  emotion?: string;
  action?: string;
}
```

## System Store

The system SHALL maintain system state:

```typescript
interface SystemState {
  connectionStatus: 'connected' | 'disconnected' | 'checking';
  lastError: string | null;
  performanceMetrics: {
    fps: number;
    memoryUsage: number;
    renderTime: number;
  };

  // Actions
  setConnectionStatus: (status: ConnectionStatus) => void;
  setError: (error: string | null) => void;
  updateMetrics: (metrics: Partial<PerformanceMetrics>) => void;
  resetSystemState: () => void;
}
```

## Digital Human Store

The system SHALL maintain avatar state:

```typescript
interface DigitalHumanState {
  // Model state
  isPlaying: boolean;
  autoRotate: boolean;
  currentAnimation: string;

  // Voice state
  isRecording: boolean;
  isMuted: boolean;
  isSpeaking: boolean;

  // Behavior state
  currentEmotion: EmotionType;
  currentExpression: ExpressionType;
  expressionIntensity: number;
  currentBehavior: BehaviorType;

  // Actions
  setPlaying: (playing: boolean) => void;
  setAutoRotate: (rotate: boolean) => void;
  setAnimation: (animation: string) => void;
  setRecording: (recording: boolean) => void;
  setMuted: (muted: boolean) => void;
  setSpeaking: (speaking: boolean) => void;
  setEmotion: (emotion: EmotionType) => void;
  setExpression: (expression: ExpressionType) => void;
  setExpressionIntensity: (intensity: number) => void;
  setBehavior: (behavior: BehaviorType) => void;

  // Session management
  initSession: () => void;

  // Control methods
  play: () => void;
  pause: () => void;
  reset: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  toggleMute: () => void;
  toggleAutoRotate: () => void;
}
```

## Selector Pattern

The system SHALL provide typed selectors:

```typescript
export const selectIsPlaying = (s: DigitalHumanState) => s.isPlaying;
export const selectCurrentExpression = (s: DigitalHumanState) => s.currentExpression;
export const selectCurrentBehavior = (s: DigitalHumanState) => s.currentBehavior;
export const selectCurrentEmotion = (s: DigitalHumanState) => s.currentEmotion;
export const selectIsRecording = (s: DigitalHumanState) => s.isRecording;
export const selectIsSpeaking = (s: DigitalHumanState) => s.isSpeaking;
```

## Usage Guidelines

### Good: Specific Selector

```typescript
const isPlaying = useDigitalHumanStore((s) => s.isPlaying);
```

Benefits:
- Minimal re-renders
- Clear subscription scope

### Avoid: Full Store Subscription

```typescript
const { isPlaying, ...rest } = useDigitalHumanStore();
```

Issues:
- Re-renders on any store change
- Unnecessary subscriptions

## Cross-Store Communication

Services MAY access other stores via `getState()`:

```typescript
// In service
const { setSpeaking, setBehavior } = useDigitalHumanStore.getState();
const { addMessage } = useChatSessionStore.getState();
const { setConnectionStatus } = useSystemStore.getState();
```

## DevTools Integration

The system SHALL support Zustand DevTools in development:

```typescript
const ENABLE_DEVTOOLS =
  typeof import.meta !== 'undefined' &&
  import.meta.env?.DEV === true &&
  import.meta.env?.MODE !== 'test';

export const useDigitalHumanStore = create<DigitalHumanState>()(
  devtools(
    (set, get) => ({ /* ... */ }),
    { name: 'digital-human-store', enabled: ENABLE_DEVTOOLS },
  ),
);
```

## Recording Timeout

The system SHALL implement recording timeout:

- Default timeout: 30 seconds
- Auto-stop recording after timeout
- Clear timeout on manual stop
