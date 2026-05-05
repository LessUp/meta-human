# Type Safety

> Type safety patterns in this project.

---

## Overview

This project uses **TypeScript 5.8** with strict mode. All code must be fully typed—`any` is forbidden except in test files.

---

## Type Organization

### Colocated Types

Types are defined in the same file as their usage when local:

```typescript
// store/digitalHumanStore.ts
export type EmotionType = 'neutral' | 'happy' | 'surprised' | 'sad' | 'angry';
export type ExpressionType = 'neutral' | 'smile' | 'laugh' | 'surprise' | ...;

interface DigitalHumanState {
  currentEmotion: EmotionType;
  currentExpression: ExpressionType;
  // ...
}
```

### Shared Types

Types used across modules go in `lib/` or the relevant core module:

```typescript
// core/vision/visionMapper.ts
export type UserEmotion = 'neutral' | 'happy' | 'surprised' | 'sad' | 'angry';

// Exported for use in hooks and components
export function mapFaceToEmotion(results: unknown): UserEmotion;
```

---

## Type Patterns

### Union Types for State

Use union types for finite state sets:

```typescript
export type BehaviorType =
  | 'idle'
  | 'greeting'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'excited'
  | 'wave'
  | 'dance';
```

### Adapter Interfaces

Define interfaces for service dependencies:

```typescript
// core/avatar/DigitalHumanEngine.ts
export interface StateAdapter {
  play(): void;
  pause(): void;
  reset(): void;
  setExpression(expr: string): void;
  setEmotion(emotion: string): void;
  setBehavior(behavior: string): void;
  setAnimation(animation: string): void;
  setPlaying(playing: boolean): void;
}
```

### Callback Types

```typescript
export interface TTSCallbacks {
  onSpeakStart: () => void;
  onSpeakEnd: () => void;
  onError: (message: string) => void;
}
```

---

## Validation

This project does not use runtime validation libraries (Zod, Yup). Validation is handled by:

1. **TypeScript** for compile-time checks
2. **Service layer** for API response validation
3. **Guards** for runtime checks where necessary

```typescript
// Runtime type guard
function isFaceMeshResult(data: unknown): data is FaceMeshResult {
  return typeof data === 'object' && data !== null && 'multiFaceLandmarks' in data;
}
```

---

## Common Patterns

### Generic Utility Types

```typescript
// Extract parameter types
type HandlerArgs = Parameters<typeof handleChatSend>;

// Extract return types
type ChatResponse = Awaited<ReturnType<typeof dialogueService.chat>>;
```

### Props with Children

```typescript
interface PanelProps {
  title: string;
  children: React.ReactNode;
}

function Panel({ title, children }: PanelProps) {
  return (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  );
}
```

### Event Handler Types

```typescript
interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}
```

---

## Forbidden Patterns

### ❌ `any` type (except in tests)

```typescript
// ❌ Wrong: any in production code
function process(data: any) {
  return data.value;
}

// ✅ Correct: Explicit type or generic
function process<T extends { value: unknown }>(data: T) {
  return data.value;
}
```

### ❌ Type assertions without validation

```typescript
// ❌ Wrong: Unsafe assertion
const result = data as MyType;

// ✅ Correct: Validate first
if (isMyType(data)) {
  const result = data; // Type narrowed
}
```

### ❌ Non-null assertions

```typescript
// ❌ Wrong: Assume non-null
const element = document.querySelector('.container')!;

// ✅ Correct: Handle null case
const element = document.querySelector('.container');
if (!element) return;
```

---

## Test Files

Test files may use `any` for mock simplification:

```typescript
// ✅ Acceptable in test files only
const mockStore = {
  getState: vi.fn(() => ({ isPlaying: false })),
} as any;
```
