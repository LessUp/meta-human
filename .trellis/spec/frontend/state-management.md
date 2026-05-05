# State Management

> How state is managed in this project.

---

## Overview

This project uses **Zustand 5** with devtools middleware. State is divided into three domain-specific stores:

| Store               | Purpose                                        |
| ------------------- | ---------------------------------------------- |
| `digitalHumanStore` | Avatar state (expression, animation, behavior) |
| `chatSessionStore`  | Chat history, session ID, persistence          |
| `systemStore`       | Connection status, errors, performance metrics |

---

## State Categories

### Local State

Component-level state for UI concerns:

```typescript
// ✅ Good: Local state for transient UI
const [showSettings, setShowSettings] = useState(false);
const [activeTab, setActiveTab] = useState('basic');
```

### Global State

Cross-cutting state that multiple components need:

```typescript
// ✅ Good: Global state for shared avatar state
const isPlaying = useDigitalHumanStore((s) => s.isPlaying);
const currentEmotion = useDigitalHumanStore((s) => s.currentEmotion);
```

### Server State

Handled via services, not stores. Store only holds the results:

```typescript
// Service handles fetching
const messages = await dialogueService.chat(message, sessionId);

// Store holds the result
useChatSessionStore.getState().addChatMessage('assistant', response);
```

---

## When to Use Global State

Promote state to global when:

1. **Multiple components** need read/write access
2. **Persistence** is required (session storage, localStorage)
3. **Cross-cutting concerns** (auth, errors, connection status)

```typescript
// ✅ Good: Global state for cross-cutting concerns
interface SystemState {
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  error: string | null;
}
```

---

## Store Structure

### State + Actions Pattern

```typescript
interface DigitalHumanState {
  // State
  isPlaying: boolean;
  currentEmotion: EmotionType;

  // Simple setters
  setPlaying: (playing: boolean) => void;
  setEmotion: (emotion: EmotionType) => void;

  // Compound actions
  play: () => void;
  pause: () => void;
  reset: () => void;
}

export const useDigitalHumanStore = create<DigitalHumanState>()(
  devtools(
    (set, get) => ({
      // Initial state
      isPlaying: false,
      currentEmotion: 'neutral',

      // Setters
      setPlaying: (playing) => set({ isPlaying: playing }),
      setEmotion: (emotion) => set({ currentEmotion: emotion }),

      // Compound actions
      play: () => set({ isPlaying: true }),
      pause: () => set({ isPlaying: false }),
      reset: () => set({ isPlaying: false, currentEmotion: 'neutral' }),
    }),
    { name: 'digital-human-store', enabled: ENABLE_DEVTOOLS },
  ),
);
```

### Typed Selectors

Export selectors for performance-sensitive components:

```typescript
// Selectors prevent unnecessary re-renders
export const selectIsPlaying = (s: DigitalHumanState) => s.isPlaying;
export const selectCurrentExpression = (s: DigitalHumanState) => s.currentExpression;

// Usage in component
const isPlaying = useDigitalHumanStore(selectIsPlaying);
```

---

## Service → Store Communication

Services access stores via `getState()`, not hooks:

```typescript
// ✅ Good: Service uses getState()
export function createASRStateAdapter(): ASRStateAdapter {
  return {
    setRecording: (r) => useDigitalHumanStore.getState().setRecording(r),
    get isMuted() {
      return useDigitalHumanStore.getState().isMuted;
    },
  };
}
```

---

## Common Mistakes

### ❌ Destructuring entire store

```typescript
// ❌ Wrong: Subscribes to ALL changes
const { isPlaying, isRecording } = useDigitalHumanStore();

// ✅ Correct: Select only what you need
const isPlaying = useDigitalHumanStore((s) => s.isPlaying);
const isRecording = useDigitalHumanStore((s) => s.isRecording);

// ✅ Also correct: Use exported selectors
const isPlaying = useDigitalHumanStore(selectIsPlaying);
```

### ❌ React hooks in services

```typescript
// ❌ Wrong: Hooks outside React
class MyService {
  init() {
    const state = useDigitalHumanStore(); // Error!
  }
}

// ✅ Correct: Use getState()
class MyService {
  init() {
    const state = useDigitalHumanStore.getState();
  }
}
```

### ❌ Zustand 5 set parameter

```typescript
// ❌ Wrong: Boolean second parameter (Zustand 4 style)
set({ isPlaying: true }, false);

// ✅ Correct: Object with replace option (Zustand 5)
set({ isPlaying: true }, undefined, { replace: false });
// Or simply:
set({ isPlaying: true });
```
