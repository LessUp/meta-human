# Project Overview

## What is MetaHuman Engine?

MetaHuman Engine is a **browser-native 3D digital human engine** that enables real-time interaction between AI and users through an embodied avatar.

## The Problem It Solves

Building digital human applications typically requires:

- Integrating multiple disconnected systems (3D, voice, vision, LLM)
- Handling failures gracefully across all layers
- Maintaining performance across different devices
- Creating fallbacks when external services are unavailable

MetaHuman Engine provides a **complete, working reference implementation** that handles all of this out of the box.

## Target Users

| User | Use Case |
|------|----------|
| **Demo Teams** | Quick proof-of-concept for digital human capabilities |
| **Product Teams** | Validate use cases before full platform investment |
| **Developers** | Starting point for custom digital human applications |
| **Researchers** | Testbed for interaction and avatar research |

## Core Capabilities

### 1. 3D Avatar Rendering

- Real-time Three.js rendering
- GLB/GLTF model support
- Procedural fallback avatar
- Emotion-driven expressions
- Skeletal animations

### 2. Voice Interaction

- Text-to-speech synthesis
- Speech-to-text recognition
- Smart muting and interruption
- Voice activity visualization

### 3. Visual Perception

- Facial emotion detection
- Head motion tracking
- Gesture recognition
- Privacy-preserving (all local)

### 4. Dialogue System

- OpenAI-compatible API
- Streaming responses
- Graceful degradation to mock
- Session persistence

## What It's NOT

To maintain focus and quality, this project explicitly excludes:

- User authentication system
- Model management backend
- Behavior timeline editor
- Multi-tenant platform features
- Production-grade monitoring

These capabilities may be added in separate projects or integrations.

## Success Criteria

The project succeeds when:

1. ✅ Developers can run it locally with zero configuration
2. ✅ Demos work even without API keys
3. ✅ External service failures don't crash the experience
4. ✅ Code is readable and well-documented
5. ✅ Architecture supports extension

## Technology Choices

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | React + TypeScript | Type safety, ecosystem |
| Build | Vite | Speed, ESM native |
| 3D | Three.js + R3F | Industry standard |
| State | Zustand | Simple, performant |
| Styling | Tailwind | Rapid development |
| Vision | MediaPipe | Browser-native ML |
| Backend | FastAPI | Async Python, auto-docs |

## Roadmap

### Phase 1: Stability (Current)

- [x] Complete interaction loop
- [x] Graceful fallbacks
- [x] Device-adaptive performance
- [x] Comprehensive documentation

### Phase 2: SDK-ification

- [ ] Plugin architecture for avatars
- [ ] Configurable dialogue providers
- [ ] Theme system
- [ ] Event hooks API

### Phase 3: Platform

- [ ] Model hosting
- [ ] Behavior editor
- [ ] Analytics dashboard
- [ ] Multi-tenant support

## Getting Started

1. [Quick Start](../README.md#quick-start)
2. [Architecture Guide](architecture.md)
3. [API Reference](api.md)
4. [Development Guide](development.md)
