# Release Notes

## v1.0.0 (2025-04-16)

### 🎉 First Stable Release

MetaHuman Engine reaches its first stable release with a complete feature set and comprehensive documentation.

---

### ✨ Highlights

**Complete Interaction Loop**

The engine now provides a seamless end-to-end experience:

```
User Input → ASR/Text → Dialogue → TTS → Avatar Animation
                ↑                              ↓
                └────── Vision Feedback ───────┘
```

**Zero-Config Demo**

- Works out of the box without any API keys
- Automatic fallback to local mock mode
- Graceful degradation on all external services

**Production-Ready Architecture**

- Clean separation of concerns
- Proper error handling throughout
- Memory leak prevention
- Performance optimization for all device tiers

---

### 🚀 New Features

| Feature | Description |
|---------|-------------|
| Device Capability Detection | Automatic hardware tier detection for optimal rendering |
| Abort Controller Support | Cancel in-progress dialogue requests |
| Performance Metrics | Real-time FPS tracking and display |
| Unified Transport Layer | Seamless switching between HTTP/SSE/WebSocket |

---

### 📚 Documentation

Complete rewrite of all documentation:

- **README** - Professional, concise project introduction
- **docs/architecture.md** - Detailed system design
- **docs/api.md** - Full API reference
- **docs/development.md** - Setup and deployment guide
- **CHANGELOG.md** - Version history

---

### 🔧 Breaking Changes

None. This is the first stable release.

---

### 📦 Upgrade Notes

If upgrading from pre-release versions:

1. Update state store imports:
   ```typescript
   // Chat history moved to chatSessionStore
   import { useChatSessionStore } from '@/store/chatSessionStore';
   ```

2. Use new logger:
   ```typescript
   import { loggers } from '@/lib/logger';
   const logger = loggers.app;
   ```

3. Configure transport (optional):
   ```bash
   VITE_CHAT_TRANSPORT=auto
   ```

---

### 🙏 Acknowledgments

Thanks to all contributors and early adopters who helped shape this release.

---

## Previous Releases

| Version | Date | Description |
|---------|------|-------------|
| v1.0.0 | 2025-04-16 | First stable release |
| v0.9.0 | 2025-03-18 | Architecture refactor, state domain split |
| v0.8.0 | 2025-02-25 | SSE streaming, performance metrics |
| v0.7.0 | 2025-01-24 | Voice & audio integration |
| v0.6.0 | 2025-01-23 | UI refactor, component structure |
