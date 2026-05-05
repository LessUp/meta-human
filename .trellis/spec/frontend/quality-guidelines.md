# Quality Guidelines

> Code quality standards for frontend development.

---

## Overview

This project enforces quality through:

- **ESLint 9** with zero warnings policy
- **Prettier 3** for formatting
- **Husky + lint-staged** for pre-commit checks
- **Vitest** for testing with coverage thresholds

---

## Forbidden Patterns

### ❌ Creating Git branches

All work happens on `master`. No feature branches.

```bash
# ❌ Wrong
git checkout -b feature/new-thing

# ✅ Correct: Work on master
git add .
git commit -m "feat: add new thing"
```

### ❌ Adding runtime dependencies

New dependencies require explicit discussion.

### ❌ React imports in core/

```typescript
// ❌ Wrong: React in core/
// core/avatar/engine.ts
import { useEffect } from 'react';

// ✅ Correct: Core is framework-agnostic
// core/avatar/engine.ts
// No React imports
```

### ❌ Direct fetch in components

```typescript
// ❌ Wrong: Fetch in component
useEffect(() => {
  fetch('/api/data').then(setData);
}, []);

// ✅ Correct: Use service
import { dialogueService } from '@/core/dialogue/dialogueService';
useEffect(() => {
  dialogueService.getData().then(setData);
}, []);
```

### ❌ Skipped useEffect cleanup

```typescript
// ❌ Wrong: No cleanup
useEffect(() => {
  window.addEventListener('resize', handler);
}, []);

// ✅ Correct: Always cleanup
useEffect(() => {
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}, [handler]);
```

---

## Required Patterns

### ✅ Path alias usage

Always use `@/` prefix for imports:

```typescript
// ✅ Correct
import { useDigitalHumanStore } from '@/store/digitalHumanStore';
import { dialogueService } from '@/core/dialogue/dialogueService';

// ❌ Wrong: Relative paths
import { useDigitalHumanStore } from '../../store/digitalHumanStore';
```

### ✅ Store selectors

Use selectors to prevent unnecessary re-renders:

```typescript
// ✅ Correct
const isPlaying = useDigitalHumanStore((s) => s.isPlaying);

// ❌ Wrong: Destructures entire store
const { isPlaying } = useDigitalHumanStore();
```

### ✅ Error boundaries

Wrap risky components:

```typescript
<ErrorBoundary fallback={<ErrorFallback />}>
  <RiskyComponent />
</ErrorBoundary>
```

---

## Testing Requirements

### Coverage Thresholds

| Metric    | Threshold |
| --------- | --------- |
| Lines     | ≥ 40%     |
| Functions | ≥ 34%     |
| Branches  | ≥ 30%     |

### Test File Location

Test files go in `src/__tests__/`:

```
src/
├── hooks/
│   └── useChatStream.ts
└── __tests__/
    └── useChatStream.test.ts
```

### Test Patterns

```typescript
// Mock external dependencies
vi.mock('@/core/services', () => ({
  asrService: { start: vi.fn(), stop: vi.fn() },
}));

// Use Zustand's setState for initial state
beforeEach(() => {
  useDigitalHumanStore.setState({ isPlaying: false });
});

// Flush microtasks for fire-and-forget functions
await act(async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
});
```

### Mocking Browser APIs

```typescript
// Mock SpeechSynthesis
const mockSpeak = vi.fn();
global.SpeechSynthesisUtterance = vi.fn();
global.speechSynthesis = { speak: mockSpeak } as any;
```

---

## Code Review Checklist

- [ ] No `any` types (except in tests)
- [ ] All imports use `@/` alias
- [ ] Store access uses selectors
- [ ] useEffect has cleanup function
- [ ] No direct fetch in components
- [ ] No React imports in `core/`
- [ ] Tests cover new functionality
- [ ] `npm run lint` passes with 0 warnings
- [ ] `npm run typecheck` passes

---

## Commands

```bash
npm run lint         # Check for issues
npm run lint:fix     # Auto-fix issues
npm run typecheck    # TypeScript check
npm run test:run     # Run tests
npm run test:coverage # Coverage report
npm run format       # Prettier format
```
