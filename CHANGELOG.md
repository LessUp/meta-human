# Changelog

All notable changes to MetaHuman Engine are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

See [releases/v1.0.0.md](./changelog/releases/v1.0.0.md) for detailed migration instructions.

---

[1.0.0]: https://github.com/LessUp/meta-human/releases/tag/v1.0.0
[0.9.0]: https://github.com/LessUp/meta-human/releases/tag/v0.9.0
[0.8.0]: https://github.com/LessUp/meta-human/releases/tag/v0.8.0
[0.7.0]: https://github.com/LessUp/meta-human/releases/tag/v0.7.0
[0.6.0]: https://github.com/LessUp/meta-human/releases/tag/v0.6.0
