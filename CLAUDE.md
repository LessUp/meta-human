# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development commands

- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Production build: `npm run build`
- Alternate builds:
  - `npm run build:mobile`
  - `npm run build:desktop`
  - `npm run build:ar`
- Preview production build locally: `npm run preview`
- Serve preview on `0.0.0.0:3000`: `npm run serve`
- Lint: `npm run lint`
- Run tests in watch mode: `npm test`
- Run tests once: `npm run test:run`
- Run coverage: `npm run test:coverage`
- Run a single test file: `npx vitest run src/__tests__/digitalHuman.test.tsx`
- Run tests matching a name: `npx vitest run -t "test name"`

## Stack and build setup

- React 18 + TypeScript app built with Vite.
- Path alias `@/*` points to `src/*` in both Vite and Vitest configs.
- Tailwind CSS is used for UI styling; dark-mode class support is enabled in `tailwind.config.js`.
- Vitest uses the `jsdom` environment with setup from `src/__tests__/setup.ts`.
- Vite build modes `mobile`, `desktop`, and `ar` only change compile-time flags (`__MOBILE__`, `__DESKTOP__`, `__AR__`) and output directories (`dist-mobile`, `dist-desktop`, `dist-ar`).

## High-level architecture

### App shell and routing

- Entry point is `src/main.tsx`, which renders `src/App.tsx`.
- `src/App.tsx` sets up React Router with lazy-loaded pages:
  - `/` and `/advanced` -> `AdvancedDigitalHumanPage`
  - `/digital-human` -> `DigitalHumanPage`
- The app is wrapped in a global `ErrorBoundary` and Suspense fallback UI.

### Two page modes

- `src/pages/AdvancedDigitalHumanPage.tsx` is the main experience and the default route. It combines:
  - full-screen 3D viewer background
  - settings drawer with tabs for basic controls, expressions, behavior, vision, and voice
  - chat/session UI
  - server health checks and reconnect flow
  - keyboard shortcuts and toast-driven status feedback
- `src/pages/DigitalHumanPage.tsx` is a simpler demo page with the viewer plus a basic control panel.

### Central state model

- `src/store/digitalHumanStore.ts` is the central Zustand store for nearly all runtime state.
- It holds playback, recording, mute, speaking, expression/emotion, behavior, connection status, loading/error state, and chat/session history.
- Session IDs are persisted in `localStorage` under `metahuman_session_id`, with SSR-safe storage access.
- Core services and pages commonly read/write state directly via `useDigitalHumanStore.getState()` rather than passing state deeply through props.

### Core runtime layers

The app is organized around `src/core/*` services:

- `src/core/avatar/DigitalHumanEngine.ts`
  - imperative façade over the Zustand store
  - translates high-level actions like `play`, `reset`, `setEmotion`, `setBehavior`, `playAnimation` into store updates
  - contains emotion -> expression mapping and timed auto-reset for animations
- `src/core/audio/audioService.ts`
  - browser-only audio integration using Web Speech APIs
  - `TTSService` drives speech synthesis and updates speaking/behavior store state
  - `ASRService` wraps speech recognition, handles command mode vs dictation mode, and can forward transcripts into dialogue handling
- `src/core/dialogue/dialogueService.ts`
  - HTTP client for backend chat requests
  - sends requests to `${VITE_API_BASE_URL || 'http://localhost:8000'}/v1/chat`
  - checks `${baseUrl}/health` for connectivity
  - includes timeout handling, retry logic for retryable failures, friendly error messages, and a local fallback reply when backend calls fail
- `src/core/dialogue/dialogueOrchestrator.ts`
  - orchestrates a full dialogue turn
  - appends user/assistant messages to store history
  - toggles loading/thinking state
  - applies backend response emotion/action to the avatar engine
  - optionally invokes TTS for spoken replies
- `src/core/vision/visionService.ts`
  - camera + MediaPipe integration for face/pose analysis
  - dynamically imports `@mediapipe/face_mesh` and `@mediapipe/pose`
  - maps face landmarks to emotion and derives motions like nod/shake/raiseHand/waveHand
  - model files are loaded from jsDelivr CDN at runtime, so vision features depend on camera permission and network access
- `src/core/vision/visionMapper.ts`
  - converts raw face landmarks into the app’s higher-level emotion model

### UI/component structure

- `src/components/DigitalHumanViewer.tsx` is the 3D rendering boundary.
  - Uses React Three Fiber + Drei.
  - If `modelUrl` loads successfully, it renders the GLTF scene.
  - If loading fails or no model is supplied, it falls back to an internal procedural “CyberAvatar”.
  - Viewer behavior is driven from store state (`currentExpression`, `isSpeaking`, `currentAnimation`, `expressionIntensity`).
- Control panels (`ControlPanel`, `ExpressionControlPanel`, `BehaviorControlPanel`, `VoiceInteractionPanel`, `VisionMirrorPanel`) are mostly thin UI layers that call into the engine/services.
- Shared UI primitives live under `src/components/ui`.

## Backend/API assumptions

- The frontend expects a separate backend service at `VITE_API_BASE_URL` or `http://localhost:8000`.
- Chat response shape expected by the frontend:
  - `replyText: string`
  - `emotion: string`
  - `action: string`
- Health endpoint expected: `GET /health`
- Chat endpoint expected: `POST /v1/chat`

## Testing notes

- Current test coverage is centered in `src/__tests__/digitalHuman.test.tsx`.
- Tests heavily mock Three.js, React Three Fiber, and browser speech APIs; follow that pattern when adding UI/runtime tests for viewer or audio behavior.
- Because the app relies on browser APIs (speech synthesis, speech recognition, camera/media devices), new tests usually need mocks rather than real integrations.

## Practical implementation notes

- Prefer modifying the advanced page flow unless the task is explicitly about the simpler `/digital-human` demo.
- For behavior changes affecting avatar reactions, inspect the interaction between:
  - `src/store/digitalHumanStore.ts`
  - `src/core/avatar/DigitalHumanEngine.ts`
  - `src/core/dialogue/dialogueOrchestrator.ts`
  - `src/components/DigitalHumanViewer.tsx`
- For backend chat issues, check both `dialogueService.ts` retry/fallback behavior and `AdvancedDigitalHumanPage.tsx` health-check/reconnect UI.
- For speech features, verify whether logic belongs in browser service wrappers (`audioService.ts`) or page-level orchestration.
