# Changelog

All notable changes to MetaHuman Engine are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.2.0] - 2026-04-30

### 🏗️ Architecture

- **Python Backend** — Moved `server/` to `examples/backend-python/` as optional reference implementation
- **Project Structure** — Clarified backend is optional, frontend is zero-config by default

### 📚 Documentation

- **README** — Added backend optional note, unified Node.js ≥22 requirement
- **docs/guide/** — Removed Python prerequisite, updated project structure
- **docs/index.md** — Fixed version number (v1.0.0 → v2.1.0)
- **changelog/** — Removed duplicate CHANGELOG.zh-CN.md

### 🛠️ Engineering

- **build-pages.sh** — Added sitemap generation, build timestamp, size output
- **.gitignore** — Added `*.tsbuildinfo`, updated Python comments
- **.vscode/** — Added settings.json and mcp.json

---

## [2.1.0] - 2026-04-29

### 🏗️ Architecture Overhaul

#### Observability & Turn Ownership (from p0-foundation-observability)

- **Dialogue Orchestrator** — Introduced `turnId`-based ownership isolation; `finalizeDialogueTurn` only executes cleanup when the current turnId matches, preventing cross-turn state corruption
- **Chat Session Store** — Added local persistence (sessionId + chat history), message limit enforcement (100 max), transient streaming placeholder filtering, and robust deserialization with type guards
- **System Store** — Added `ConnectionDiagnostics` (health check latency, degraded state tracking), `recordConnectionHealth()` action, and factory functions for initial metric state
- **Audio Service** — Fixed optional property assignments for ASR config (non-null assertions for constructor-initialized defaults)
- **Chat Transport** — Fixed TypeScript union type narrowing for `WSServerEvent` after while-loop guard; added `as const` assertions for literal types
- **WS Client** — Removed unused `resolveConnect` field

#### Project Cleanup

- **Removed 20+ dead files**: `.omc/`, `Dockerfile`, `docker/`, `docker-compose.yml`, `render.yaml`, `lighthouserc.json`, `docs/superpowers/`, `docs/portal.html`, `RELEASE_NOTES.md`, `CHANGELOG.zh-CN.md`, `CLAUDE.local.md`, and more
- **Removed 3 worktrees**: `final-terminal-state`, `p0-foundation-observability`, `fix/ci-tests`
- **Removed 4 stale branches**: Only `master` remains
- **Rewrote `.gitignore`**: Clean categorized structure, removed duplicates

#### Documentation

- **AGENTS.md** — Deep rewrite with file change impact matrix, debug decision tree, and prohibited actions checklist
- **CLAUDE.md** — Streamlined for Claude Code-specific workflow; added Zustand 5 and TW4 gotchas
- **copilot-instructions.md** — Reduced to essential quick-reference index
- **README.md / README.zh-CN.md** — Fixed CI badges (main→master), updated version badges (React 19, Vite 6, Three.js 0.177), removed Render deployment section, corrected path alias table (`@/*` → `src/*`)
- **CHANGELOG.md** — Fixed broken migration guide link

#### CI/CD

- **ci.yml** — Replaced hardcoded release body with `generate_release_notes: true`
- **build-pages.sh** — Removed portal.html copy; React LandingPage is now the Pages entry point
- **OpenSpec** — Updated config.yaml tech stack versions; archived p0 change proposal

### 🐛 Fixed

- Fixed 2 test failures caused by `speakWith` becoming fire-and-forget (microtask flush needed before assertion)
- Fixed ESLint errors from unused catch variables in audioService.ts

---

## [1.1.0] - 2026-04-27

### 🔧 Changed

#### Code Quality

- **TypeScript Strict Mode** — Enabled `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`
- Fixed 31 type errors across the codebase
- Removed unused React imports from component files
- Fixed type safety issues in `chatTransport.ts` and `wsClient.ts`

#### Code Deduplication

- Unified `buildEmptyResponse` function between `dialogueService.ts` and `chatTransport.ts`
- Exported `buildEmptyResponse` from `dialogueService.ts` for reuse

### 📚 Documentation

- Unified Node.js version requirement to ≥ 20 across all documentation
- Updated Bundle Size badge to reflect actual gzipped size (~240KB)
- Added `.nvmrc` file for Node.js version management
- Created `server/requirements.lock` for Python dependency pinning
- Enhanced `AGENTS.md` with testing guidelines and refactoring standards

---

## [1.0.0] - 2025-04-22

### 🎉 First Stable Release

MetaHuman Engine reaches its first stable release with a complete feature set and comprehensive documentation.

### ✨ Added

#### Core Features

- **3D Avatar Engine** — Real-time Three.js rendering with emotion-driven expressions and skeletal animations
- **Voice Interaction** — TTS synthesis and ASR recognition via Web Speech API
- **Visual Perception** — MediaPipe face mesh and pose estimation for emotion/gesture detection
- **Dialogue System** — OpenAI-compatible chat with streaming (SSE) and WebSocket support

#### Architecture

- **State Management** — Three focused Zustand stores:
  - `chatSessionStore` for message history
  - `systemStore` for connection/performance metrics
  - `digitalHumanStore` for avatar runtime state
- **Transport Abstraction** — Unified interface for HTTP/SSE/WebSocket with auto-selection
- **Device Capability Detection** — Adaptive rendering based on hardware tier

#### Performance

- Frame skipping for low-end devices
- Visibility-based animation pausing
- Adaptive DPR, shadows, and particle counts
- Render performance tracking (FPS metrics)

### 🔧 Changed

#### Code Quality

- Consolidated duplicate visibility handlers into `useIsTabVisibleRef` hook
- Extracted `rotateCameraHorizontal` helper for camera controls
- Created typed constants `TRANSPORT_LABELS` and `CONNECTION_STATUS_TEXT`
- Replaced `console.*` calls with structured logger
- Added `useCallback` optimization for keyboard handlers

#### Dialogue System

- Added abort controller support for request cancellation
- Improved streaming with proper cleanup on abort
- Enhanced error handling with graceful degradation
- Unified dialogue turn preparation logic

#### Audio Service

- Enhanced `dispose()` cleanup to prevent memory leaks
- Added preset timer clearing in ASR service
- Improved generation tracking for callbacks

### 🐛 Fixed

- Memory leaks from event listeners without cleanup
- Unnecessary re-renders from broad store subscriptions
- Race conditions in dialogue orchestration
- TTS false error reporting
- Voice command misfiring
- WebSocket exception handling
- Animation state residue after unmount
- useEffect infinite reload issues

---

## [0.9.0] - 2025-03-18

### Added

- Architecture refactor with state domain separation
- Abstracted `ChatTransport` interface
- HTTP, SSE, and WebSocket transport implementations
- `useAdvancedDigitalHumanController` hook

---

## [0.8.0] - 2025-02-25

### Added

- SSE streaming dialogue integration
- Progressive message display
- `firstTokenMs` and `responseCompleteMs` performance tracking

---

## [0.7.0] - 2025-01-24

### Added

- Web Speech API integration for TTS
- Queue management and interruption support
- Browser-native speech recognition (ASR)
- Command mode vs dictation mode

---

## [0.6.0] - 2025-01-23

### Added

- Component structure: `DigitalHumanViewer`, `ChatDock`, `TopHUD`, `ControlPanel`
- Tailwind CSS integration
- Dark mode support
- Responsive layout

---

## Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** — Incompatible API changes
- **MINOR** — New features, backward compatible
- **PATCH** — Bug fixes, backward compatible

---

## Migration Guide

See release notes in each version's GitHub Release page.

---

[2.1.0]: https://github.com/LessUp/meta-human/releases/tag/v2.1.0
[1.1.0]: https://github.com/LessUp/meta-human/releases/tag/v1.1.0
[1.0.0]: https://github.com/LessUp/meta-human/releases/tag/v1.0.0
[0.9.0]: https://github.com/LessUp/meta-human/releases/tag/v0.9.0
[0.8.0]: https://github.com/LessUp/meta-human/releases/tag/v0.8.0
[0.7.0]: https://github.com/LessUp/meta-human/releases/tag/v0.7.0
[0.6.0]: https://github.com/LessUp/meta-human/releases/tag/v0.6.0
