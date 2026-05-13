# Hook Guidelines

> How hooks are used in this project.

---

## Overview

Hooks are the bridge between React components and the core service layer. They handle:

- Store subscriptions and state selection
- Service coordination
- Lifecycle management (mount/unmount cleanup)

---

## Custom Hook Patterns

### State Coordination Hook

Combines multiple stores and services:

```typescript
// hooks/useAdvancedDigitalHumanController.ts
export function useAdvancedDigitalHumanController() {
  // Select specific state slices (not entire store)
  const isPlaying = useDigitalHumanStore((s) => s.isPlaying);
  const sessionId = useChatSessionStore((s) => s.sessionId);

  // Use services via factory functions for testability
  const engine = digitalHumanEngine;

  // Memoize returned object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      play: () => engine.play(),
      pause: () => engine.pause(),
      isPlaying,
    }),
    [isPlaying, engine],
  );
}
```

### Utility Hook

Simple, reusable logic:

```typescript
// hooks/useDebounce.ts
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer); // ALWAYS clean up
  }, [value, delay]);

  return debouncedValue;
}
```

### Store Subscription in Animation Loops

For `useFrame` or high-frequency updates, use refs to avoid re-renders:

```typescript
// ✅ Good: Subscribe pattern for animation loops
const storeRef = useRef(useDigitalHumanStore.getState());

useEffect(() => {
  const unsubscribe = useDigitalHumanStore.subscribe((state) => {
    storeRef.current = state;
  });
  return unsubscribe;
}, []);

useFrame(() => {
  // Read from ref, not hook — no re-renders
  const { currentExpression } = storeRef.current;
});
```

---

## Service Hooks

This project uses a **Context + Hooks** pattern for service access. Services (TTS, ASR, DigitalHumanEngine) are provided via `ServicesProvider` and accessed through hooks.

### Available Hooks

| Hook            | Returns                | Purpose            |
| --------------- | ---------------------- | ------------------ |
| `useServices()` | `{ engine, tts, asr }` | All services       |
| `useEngine()`   | `DigitalHumanEngine`   | Avatar engine      |
| `useTTS()`      | `TTSService`           | Text-to-speech     |
| `useASR()`      | `ASRService`           | Speech recognition |

### Usage Pattern

```typescript
// ✅ Good: Use service hooks in components/hooks
function MyComponent() {
  const { engine, tts } = useServices();
  // or specific hooks
  const engine = useEngine();
}

function useVoiceInteraction() {
  const tts = useTTS();
  const asr = useASR();

  const speak = (text: string) => {
    tts.speak(text);
  };

  return { speak };
}
```

### Non-Hook Module Integration

For pure function modules (not hooks/components), use **dependency injection via parameters**:

```typescript
// dialogueOrchestrator.ts - pure function module
export function prepareDialogueTurn(
  sessionId: string,
  engine: DigitalHumanEngine, // Injected
): void {
  engine.play();
}

// Calling from hook
function useDialogue() {
  const engine = useEngine();
  return {
    start: () => prepareDialogueTurn(sessionId, engine),
  };
}
```

> ⚠️ **Never import singleton directly** from `@/core/services`. Use hooks or parameter injection.

---

## Data Fetching

This project does NOT use React Query or SWR. Data fetching is handled by:

1. **`core/dialogue/dialogueService.ts`** — HTTP client with retry logic
2. **`core/dialogue/chatTransport.ts`** — SSE/WebSocket abstraction
3. **`hooks/useChatStream.ts`** — React hook wrapper

### Pattern

```typescript
// Service handles transport and retry
const response = await dialogueService.chat(message, sessionId);

// Hook manages React state
const { chatInput, handleChatSend, isChatLoading } = useChatStream({
  sessionId,
  onError: (msg) => setError(msg),
});
```

---

## Naming Conventions

| Pattern         | Convention               | Example                             |
| --------------- | ------------------------ | ----------------------------------- |
| State hook      | `use[Feature]`           | `useTheme`, `useLocalStorage`       |
| Controller hook | `use[Feature]Controller` | `useAdvancedDigitalHumanController` |
| Boolean state   | `is[X]`, `has[X]`        | `isLoading`, `hasError`             |
| Callback        | `handle[Action]`         | `handlePlayPause`, `handleChatSend` |
| Toggle          | `toggle[Feature]`        | `toggleMute`, `toggleSettings`      |

---

## Common Mistakes

### ❌ Stale closures in callbacks

```typescript
// ❌ Wrong: Stale closure
const handleClick = () => {
  console.log(isRecording); // Uses value from render time
};

// ✅ Correct: Use getState() for current value
const handleClick = () => {
  const { isRecording } = useDigitalHumanStore.getState();
  console.log(isRecording); // Always current
};
```

### ❌ Missing cleanup

```typescript
// ❌ Wrong: No cleanup for async operations
useEffect(() => {
  fetchData().then(setData);
}, []);

// ✅ Correct: Track cancellation
useEffect(() => {
  let cancelled = false;
  fetchData().then((data) => {
    if (!cancelled) setData(data);
  });
  return () => {
    cancelled = true;
  };
}, []);
```

### ❌ Excessive dependencies in useMemo

```typescript
// ❌ Wrong: Re-creates on every render
return useMemo(
  () => ({
    handleClick: () => engine.play(),
  }),
  [],
); // Missing engine dependency

// ✅ Correct: Include all dependencies
return useMemo(
  () => ({
    handleClick: () => engine.play(),
  }),
  [engine],
);
```
