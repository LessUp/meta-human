# CLAUDE.md

Development guidance for Claude Code when working with this repository.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (port 5173)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint check
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Prettier formatting
npm run typecheck    # TypeScript check
npm run test         # Vitest watch mode
npm run test:run     # Run tests once
npm run test:coverage # Coverage report
```

**Build modes:** `build:mobile`, `build:desktop`, `build:ar`, `build:pages`

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build:** Vite 5
- **3D:** Three.js + React Three Fiber + Drei
- **State:** Zustand
- **Styling:** Tailwind CSS
- **Testing:** Vitest + Testing Library

**Path alias:** `@/*` → `src/*`

## Architecture

### App Shell

```
src/main.tsx → src/App.tsx
  └── Routes:
      /, /advanced → AdvancedDigitalHumanPage (main)
      /digital-human → DigitalHumanPage (simple demo)
```

### Layer Structure

```
pages/          → Route-level components
  └── hooks/    → Business logic hooks
       └── core/ → Engine services
            └── store/ → Zustand state
```

### Core Services

| Service      | File                                    | Purpose                                           |
| ------------ | --------------------------------------- | ------------------------------------------------- |
| Avatar       | `core/avatar/DigitalHumanEngine.ts`     | Imperative façade over store for avatar control   |
| Audio        | `core/audio/audioService.ts`            | TTS synthesis, ASR recognition via Web Speech API |
| Dialogue     | `core/dialogue/dialogueService.ts`      | HTTP client with retry, timeout, fallback         |
| Orchestrator | `core/dialogue/dialogueOrchestrator.ts` | Full dialogue turn orchestration                  |
| Vision       | `core/vision/visionService.ts`          | MediaPipe face/pose inference                     |
| Performance  | `core/performance/deviceCapability.ts`  | Device tier detection                             |

### State Stores

| Store               | Scope                                   |
| ------------------- | --------------------------------------- |
| `chatSessionStore`  | Messages, sessionId                     |
| `systemStore`       | Connection, errors, performance metrics |
| `digitalHumanStore` | Avatar state, audio, behavior           |

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

## Backend Contract

**Base URL:** `VITE_API_BASE_URL` or `http://localhost:8000`

| Endpoint          | Method | Purpose                |
| ----------------- | ------ | ---------------------- |
| `/health`         | GET    | Connectivity check     |
| `/v1/chat`        | POST   | Dialogue request       |
| `/v1/chat/stream` | POST   | SSE streaming dialogue |

**Chat Response Shape:**

```typescript
interface ChatResponse {
  replyText: string;
  emotion: 'neutral' | 'happy' | 'surprised' | 'sad' | 'angry';
  action: 'idle' | 'wave' | 'greet' | 'think' | 'nod' | 'shakeHead' | 'dance' | 'speak';
}
```

## Testing Notes

- Tests mock Three.js, R3F, and browser APIs
- Main test file: `src/__tests__/digitalHuman.test.tsx`
- Browser APIs (speech, media) require mocking

## Implementation Tips

- Prefer `AdvancedDigitalHumanPage` for changes (main experience)
- Avatar reactions: check `DigitalHumanEngine.ts` + `dialogueOrchestrator.ts`
- Chat issues: check `dialogueService.ts` retry/fallback + health check
- Speech: verify if logic belongs in `audioService.ts` or page orchestration
- Event listeners: always clean up in `useEffect` return
