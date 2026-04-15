# MetaHuman Engine Documentation

Welcome to the MetaHuman Engine documentation.

## Overview

MetaHuman is a browser-native 3D digital human engine that provides a complete interaction loop: **3D avatar → voice → vision → dialogue**.

| Capability | Technology |
|------------|------------|
| 3D Avatar | Three.js + React Three Fiber |
| Voice | Web Speech API + Edge TTS |
| Vision | MediaPipe Face Mesh & Pose |
| Dialogue | OpenAI-compatible API |

## Documentation Index

| Document | Description |
|----------|-------------|
| [Architecture](architecture.md) | System design and data flow |
| [API Reference](api.md) | Backend API contract |
| [Development](development.md) | Setup and deployment guide |

## Quick Links

- [Getting Started](../README.md#quick-start)
- [Project Structure](../README.md#project-structure)
- [Contributing](../README.md#contributing)

## Design Principles

1. **Zero-config by default** — Works out of the box with local fallbacks
2. **Graceful degradation** — External failures don't break the experience
3. **Modular architecture** — Avatar, voice, vision, dialogue are independent
4. **Minimal re-renders** — Focused state stores prevent unnecessary updates
5. **Browser-first** — All processing happens client-side when possible

## Target Use Cases

- Virtual customer service demos
- Interactive kiosks
- Educational assistants
- VTuber/streaming avatars
- Therapy companions
