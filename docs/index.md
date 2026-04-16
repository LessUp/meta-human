# MetaHuman Engine Documentation

<p align="center">
  <img src="../public/favicon.svg" width="80" alt="MetaHuman Engine" />
</p>

<p align="center">
  <strong>Complete Documentation for Browser-Native 3D Digital Human Engine</strong>
</p>

---

## 📚 Documentation Index

### 🚀 Getting Started

| Document | Description | Link |
|----------|-------------|------|
| **Quick Start** | Get up and running in 5 minutes | [Guide →](./guide/) |
| **Installation** | Detailed installation instructions | [Guide →](./guide/installation.md) |
| **Configuration** | Environment variables and settings | [Guide →](./guide/configuration.md) |

### 🏗️ Architecture

| Document | Description | Link |
|----------|-------------|------|
| **Overview** | System architecture and data flow | [Architecture →](./architecture/) |
| **Frontend** | React component architecture | [Frontend →](./architecture/frontend.md) |
| **Backend** | FastAPI backend design | [Backend →](./architecture/backend.md) |

### 🔌 API Reference

| Document | Description | Link |
|----------|-------------|------|
| **API Overview** | API introduction and authentication | [API →](./api/) |
| **REST API** | HTTP endpoints and request/response formats | [REST API →](./api/rest-api.md) |
| **WebSocket** | Real-time bidirectional communication | [WebSocket →](./api/websocket.md) |

### 🤝 Contributing

| Document | Description | Link |
|----------|-------------|------|
| **Contributing Guide** | How to contribute to the project | [Contributing →](./contributing/) |

---

## 🌐 Language Selection

- **[English](./index.md)** (Current)
- **[中文](./index.zh-CN.md)**

---

## 🎯 What is MetaHuman Engine?

MetaHuman Engine is a **browser-native 3D digital human engine** that provides a complete interaction loop:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   User Input ──► ASR/Text ──► Dialogue ──► TTS ──► Avatar  │
│                     │                            │          │
│                     └────── Vision Feedback ─────┘          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Core Capabilities

| Capability | Technology | Status |
|------------|------------|--------|
| 🎭 **3D Avatar** | Three.js + React Three Fiber | ✅ Available |
| 🗣️ **Voice** | Web Speech API + Edge TTS | ✅ Available |
| 👁️ **Vision** | MediaPipe Face Mesh & Pose | ✅ Available |
| 🧠 **Dialogue** | OpenAI-compatible API | ✅ Available |

---

## 🚀 Quick Links

- **[GitHub Repository](https://github.com/LessUp/meta-human)**
- **[Live Demo](https://lessup.github.io/meta-human/)**
- **[Issues](https://github.com/LessUp/meta-human/issues)**
- **[Discussions](https://github.com/LessUp/meta-human/discussions)**

---

## 📖 Design Principles

1. **Zero-config by default** — Works out of the box with local fallbacks
2. **Graceful degradation** — External failures don't break the experience
3. **Modular architecture** — Avatar, voice, vision, dialogue are independent
4. **Minimal re-renders** — Focused state stores prevent unnecessary updates
5. **Browser-first** — All processing happens client-side when possible
6. **Privacy-first** — Face data never leaves the browser

---

## 🎯 Target Use Cases

- 🤖 **Virtual Customer Service** — 24/7 automated support with emotional intelligence
- 🎓 **Educational Assistants** — Interactive learning companions
- 🏢 **Information Kiosks** — Smart reception and wayfinding
- 🎮 **VTuber/Streaming** — Real-time avatar performance
- 💬 **Digital Companions** — Therapy and wellness support

---

## 📋 Version Information

**Current Version:** `v1.0.0`

See [CHANGELOG](../CHANGELOG.md) for version history.

---

<p align="center">
  Built with ❤️ to make digital humans accessible to everyone
</p>

<p align="center">
  <a href="https://github.com/LessUp/meta-human/blob/master/LICENSE">MIT License</a>
</p>
