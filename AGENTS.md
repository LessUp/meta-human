# AGENTS.md

MetaHuman Engine contributor guide.

## Goal

Keep the repository small, truthful, and maintainable. Prefer deleting stale code, tooling, and docs over adding new abstraction.

## Stack

| Layer | Technology                          |
| ----- | ----------------------------------- |
| UI    | React 19 + TypeScript 5             |
| Build | Vite 6                              |
| 3D    | Three.js + React Three Fiber + Drei |
| State | Zustand 5                           |
| Style | Tailwind CSS 4                      |
| Test  | Vitest + Testing Library            |

## Architecture

```text
src/
├── pages/       Route-level pages
├── components/  UI and landing page components
├── hooks/       UI-side orchestration hooks
├── core/        Runtime services, no React imports
├── store/       Zustand stores
└── lib/         Shared helpers
```

## Core rules

1. Use `@/*` path aliases.
2. `core/` must not import React.
3. Services read and write Zustand through `useXStore.getState()`.
4. Every external integration needs an explicit fallback path.
5. When simplifying, prefer removal and consolidation over new wrappers.
6. Record project history only in the root `CHANGELOG.md`.

## Key runtime files

| File                                           | Responsibility                             |
| ---------------------------------------------- | ------------------------------------------ |
| `src/core/avatar/DigitalHumanEngine.ts`        | Avatar control facade                      |
| `src/core/dialogue/dialogueService.ts`         | HTTP dialogue client with fallback         |
| `src/core/dialogue/chatTransport.ts`           | HTTP / SSE / WebSocket transport selection |
| `src/core/dialogue/dialogueOrchestrator.ts`    | Turn ownership and request lifecycle       |
| `src/core/audio/audioService.ts`               | TTS / ASR services                         |
| `src/store/digitalHumanStore.ts`               | Avatar runtime state                       |
| `src/components/viewer/DigitalHumanViewer.tsx` | Main 3D viewport                           |

## Commands

```bash
npm run dev
npm run typecheck
npm run lint
npm run test:run
npm run build
npm run build:pages
```

## Guardrails

- Do not create new branches for routine work; stay on `master`.
- Do not add runtime dependencies without discussion.
- Do not reintroduce workflow-driving AI framework files or generated skill systems.
- Do not document Docker, Render, CLI scaffolds, or templates unless the repository actually ships them.
- Keep GitHub Pages focused on product and docs, not changelog browsing.
