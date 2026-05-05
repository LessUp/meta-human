# Directory Structure

> How frontend code is organized in this project.

---

## Overview

This project follows a layered architecture with clear separation between React-specific code and framework-agnostic core logic.

---

## Directory Layout

```
src/
├── pages/           → Route-level page components (LandingPage, AdvancedDigitalHumanPage)
├── components/      → UI components (DigitalHumanViewer, ChatDock, TopHUD...)
│   ├── landing/     → Landing page-specific components
│   └── ui/          → Generic UI primitives (ErrorBoundary, LoadingSpinner)
├── hooks/           → Business logic hooks
├── core/            → Engine service layer (NO React dependencies)
│   ├── avatar/      → 3D digital human engine (DigitalHumanEngine + constants)
│   ├── audio/       → TTS/ASR services (audioService.ts)
│   ├── dialogue/    → Dialogue service chain (dialogueService → chatTransport → wsClient)
│   ├── vision/      → MediaPipe face/pose inference (visionService + visionMapper)
│   └── performance/ → Device capability detection
├── store/           → Zustand state stores
│   ├── chatSessionStore.ts  → Message history, session ID, local persistence
│   ├── systemStore.ts       → Connection status, performance metrics, error throttling
│   └── digitalHumanStore.ts → Digital human state (expression, animation, behavior)
└── lib/             → Utility functions (logger, utils, voiceCommands)
```

---

## Module Organization

### Core Layer (Framework-Agnostic)

The `core/` directory contains business logic with **no React dependencies**. This enables:

- Independent testing without jsdom
- Potential reuse in other frameworks
- Clear separation of concerns

**Example**: `src/core/avatar/DigitalHumanEngine.ts` manages avatar state without React imports.

### Service Layer Pattern

Services are instantiated in `core/services.ts` with store adapters injected:

```typescript
// Services receive adapters, not stores directly
export function createDigitalHumanEngine(): DigitalHumanEngine {
  return new DigitalHumanEngine(createDigitalHumanStoreAdapter());
}
```

---

## Naming Conventions

| Type         | Convention                    | Example                       |
| ------------ | ----------------------------- | ----------------------------- |
| Components   | PascalCase                    | `DigitalHumanViewer.tsx`      |
| Hooks        | camelCase with `use` prefix   | `useChatStream.ts`            |
| Stores       | camelCase with `Store` suffix | `digitalHumanStore.ts`        |
| Services     | PascalCase class              | `DigitalHumanEngine`          |
| Utilities    | camelCase                     | `voiceCommands.ts`            |
| Constants    | SCREAMING_SNAKE_CASE          | `RECORDING_TIMEOUT_MS`        |
| Type aliases | PascalCase with `Type` suffix | `EmotionType`, `BehaviorType` |

---

## Examples

### Well-Organized Modules

- **`core/dialogue/`** — Clean service chain: `dialogueService.ts` → `chatTransport.ts` → `wsClient.ts`
- **`store/digitalHumanStore.ts`** — Colocated types, state, and selectors
- **`hooks/useDebounce.ts`** — Single responsibility, exported utilities
