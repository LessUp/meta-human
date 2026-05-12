---
layout: home
hero:
  name: MetaHuman Engine
  text: Browser-Native 3D Digital Human Engine
  tagline: 'Complete interaction loop: Voice Input → AI Dialogue → Voice Output → 3D Expression Animation'
  actions:
    - theme: brand
      text: Get Started
      link: /en/guide/getting-started
    - theme: alt
      text: API Reference
      link: /en/api/overview
features:
  - icon: 🎭
    title: 3D Avatar
    details: High-quality 3D rendering with Three.js + React Three Fiber, supporting facial expressions and gestures
  - icon: 🗣️
    title: Voice Interaction
    details: Web Speech API for recognition + Edge TTS for synthesis, multi-language voice support
  - icon: 👁️
    title: Vision Sensing
    details: MediaPipe face mesh and pose detection, real-time expression capture to drive the avatar
  - icon: 🧠
    title: AI Dialogue
    details: OpenAI-compatible API interface, streaming responses and context management
---

# MetaHuman Engine Documentation

## Core Capabilities

| Capability       | Technology                   | Status       |
| ---------------- | ---------------------------- | ------------ |
| 🎭 **3D Avatar** | Three.js + React Three Fiber | ✅ Available |
| 🗣️ **Voice**     | Web Speech API + Edge TTS    | ✅ Available |
| 👁️ **Vision**    | MediaPipe Face Mesh & Pose   | ✅ Available |
| 🧠 **Dialogue**  | OpenAI-compatible API        | ✅ Available |

## Quick Links

- [Getting Started](/en/guide/getting-started) - Up and running in 5 minutes
- [Installation Guide](/en/guide/installation) - Detailed setup instructions
- [Configuration](/en/guide/configuration) - Environment variables reference
- [API Documentation](/en/api/overview) - Backend API reference
- [Architecture](/en/architecture/overview) - System design

## Design Principles

1. **Zero-config by default** — Works out of the box with automatic fallback to local mode
2. **Graceful degradation** — External service failures don't break the core experience
3. **Modular architecture** — Avatar, voice, vision, dialogue are independent and replaceable
4. **Minimal re-renders** — Focused state stores prevent unnecessary updates
5. **Browser-first** — Process client-side whenever possible, minimize server dependency
6. **Privacy-first** — Face data never leaves the browser
