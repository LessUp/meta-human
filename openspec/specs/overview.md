# System Overview

MetaHuman Engine is a browser-native 3D digital human interaction engine that provides a complete interaction loop.

## System Purpose

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   User Input ──► ASR/Text ──► Dialogue ──► TTS ──► Avatar  │
│                     │                            │          │
│                     └────── Vision Feedback ─────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Core Capabilities

| Capability | Technology | Status |
|------------|------------|--------|
| 3D Avatar | Three.js + React Three Fiber | Available |
| Voice | Web Speech API + Edge TTS | Available |
| Vision | MediaPipe Face Mesh & Pose | Available |
| Dialogue | OpenAI-compatible API | Available |

## Design Principles

1. **Zero-config by default** — Works out of the box with local fallbacks
2. **Graceful degradation** — External failures don't break the experience
3. **Modular architecture** — Avatar, voice, vision, dialogue are independent
4. **Minimal re-renders** — Focused state stores prevent unnecessary updates
5. **Browser-first** — All processing happens client-side when possible
6. **Privacy-first** — Face data never leaves the browser

## Target Use Cases

- Virtual Customer Service — 24/7 automated support with emotional intelligence
- Educational Assistants — Interactive learning companions
- Information Kiosks — Smart reception and wayfinding
- VTuber/Streaming — Real-time avatar performance
- Digital Companions — Therapy and wellness support

## App Shell

```
src/main.tsx → src/App.tsx
  └── Routes:
      /, /advanced → AdvancedDigitalHumanPage (main)
      /digital-human → DigitalHumanPage (simple demo)
```

## Layer Structure

```
pages/          → Route-level components
  └── hooks/    → Business logic hooks
       └── core/ → Engine services
            └── store/ → Zustand state
```
