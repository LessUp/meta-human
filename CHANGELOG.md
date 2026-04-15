# Changelog

All notable changes to MetaHuman Engine are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-04-16

### Added

#### Core Features
- **3D Avatar Engine** - Real-time Three.js rendering with emotion-driven expressions and skeletal animations
- **Voice Interaction** - TTS synthesis and ASR recognition via Web Speech API
- **Visual Perception** - MediaPipe face mesh and pose estimation for emotion/gesture detection
- **Dialogue System** - OpenAI-compatible chat with streaming (SSE) and WebSocket support

#### Architecture
- **State Management** - Three focused Zustand stores:
  - `chatSessionStore` for message history
  - `systemStore` for connection/performance metrics
  - `digitalHumanStore` for avatar runtime state
- **Transport Abstraction** - Unified interface for HTTP/SSE/WebSocket with auto-selection
- **Device Capability Detection** - Adaptive rendering based on hardware tier

#### Performance
- Frame skipping for low-end devices
- Visibility-based animation pausing
- Adaptive DPR, shadows, and particle counts
- Render performance tracking (FPS metrics)

### Changed

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

### Fixed

- Memory leaks from event listeners without cleanup
- Unnecessary re-renders from broad store subscriptions
- Race conditions in dialogue orchestration
- TTS false error reporting
- Voice command misfiring
- WebSocket exception handling
- Animation state residue after unmount
- useEffect infinite reload issues

---

## Release History

### 2025-04-16 - v1.0.0 Release

**Documentation Overhaul**
- Completely rewrote README.md and README.zh-CN.md
- Created comprehensive docs/ directory:
  - `architecture.md` - System design and data flow
  - `api.md` - Backend API reference
  - `development.md` - Setup and deployment guide
  - `project-overview.md` - Project positioning and roadmap

**Code Improvements**
- Device capability detection system
- Render performance tracking
- Model load metrics
- Dialogue cancellation support

### 2025-03-18 - Architecture Refactor

**State Domain Split**
- Separated `chatSessionStore` from main store
- Separated `systemStore` for connection/error state
- Reduced cross-domain coupling

**Transport Layer**
- Abstracted `ChatTransport` interface
- Implemented HTTP, SSE, WebSocket transports
- Auto-probe for capability detection

**Controller Extraction**
- Created `useAdvancedDigitalHumanController` hook
- Reduced page component complexity

### 2025-02-25 - Feature Enhancement

**SSE Streaming**
- Integrated SSE streaming dialogue to frontend UI
- Progressive message display
- Token-by-token rendering

**Performance Metrics**
- Added `firstTokenMs` tracking
- Added `responseCompleteMs` tracking
- HUD visualization of metrics

### 2025-01-24 - Voice & Audio Integration

**TTS Service**
- Web Speech API integration
- Queue management
- Interruption support

**ASR Service**
- Browser-native speech recognition
- Command mode vs dictation mode
- Voice activity detection

### 2025-01-23 - UI Refactor

**Component Structure**
- `DigitalHumanViewer` - 3D viewport with procedural fallback
- `ChatDock` - Chat interface with streaming support
- `TopHUD` - Status bar with metrics
- `ControlPanel` - Quick actions
- `SettingsDrawer` - Tabbed settings

**Styling**
- Tailwind CSS integration
- Dark mode support
- Responsive layout

---

## Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** - Incompatible API changes
- **MINOR** - New features, backward compatible
- **PATCH** - Bug fixes, backward compatible

---

## Migration Guide

### Upgrading to v1.0.0

**State Store Changes**

If you were using `digitalHumanStore` directly for chat history:

```typescript
// Before
const chatHistory = useDigitalHumanStore(s => s.chatHistory);

// After
const chatHistory = useChatSessionStore(s => s.chatHistory);
```

**Transport Configuration**

New environment variable for transport selection:

```bash
# .env.local
VITE_CHAT_TRANSPORT=auto  # Options: http, sse, websocket, auto
```

**Logger Usage**

Replace console calls with structured logger:

```typescript
// Before
console.log('message');

// After
import { loggers } from '@/lib/logger';
const logger = loggers.app;
logger.info('message');
```

---

[1.0.0]: https://github.com/LessUp/meta-human/releases/tag/v1.0.0
