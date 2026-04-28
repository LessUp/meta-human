# MetaHuman Engine

<p align="center">
  <img src="public/favicon.svg" width="120" alt="MetaHuman Engine" />
</p>

<p align="center">
  <strong>Give AI a real-time interactive digital body</strong>
</p>

<p align="center">
  Browser-native 3D digital human engine with voice, vision, and dialogue capabilities.
  <br />
  <strong>Zero-config</strong> · <strong>Offline-ready</strong> · <strong>Production-grade</strong>
</p>

<p align="center">
  <a href="https://github.com/LessUp/meta-human/actions"><img src="https://img.shields.io/github/actions/workflow/status/LessUp/meta-human/ci.yml?branch=main&label=CI&style=flat-square" alt="CI Status" /></a>
  <a href="https://lessup.github.io/meta-human/"><img src="https://img.shields.io/badge/Demo-Live-green?style=flat-square&logo=githubpages" alt="Live Demo" /></a>
  <a href="https://github.com/LessUp/meta-human/releases"><img src="https://img.shields.io/github/v/release/LessUp/meta-human?style=flat-square&label=Version" alt="Version" /></a>
  <img src="https://img.shields.io/badge/Bundle-~240KB(gzip)-blue?style=flat-square&label=size" alt="Bundle Size" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Three.js-0.177-000000?style=flat-square&logo=threedotjs&logoColor=white" alt="Three.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" /></a>
</p>

<p align="center">
  <a href="#quick-start"><strong>Quick Start</strong></a> ·
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#performance"><strong>Performance</strong></a> ·
  <a href="#architecture"><strong>Architecture</strong></a> ·
  <a href="docs/"><strong>Documentation</strong></a> ·
  <a href="CHANGELOG.md"><strong>Changelog</strong></a> ·
  <a href="README.zh-CN.md"><strong>中文</strong></a>
</p>

---

## ✨ Demo

🚀 **[Try it live →](https://lessup.github.io/meta-human/)**

> Experience a fully interactive 3D digital human right in your browser.
> No installation or API keys required!

---

## 📸 Preview

<p align="center">
  <img src="docs/assets/preview.svg" width="800" alt="MetaHuman Engine Preview - 3D Avatar with emotion-driven expressions and real-time dialogue" />
</p>

<p align="center">
  <em>3D Avatar with emotion-driven expressions and real-time dialogue</em>
</p>

---

## 🚀 Quick Start

### Prerequisites

- Node.js ≥ 22
- npm ≥ 10

### Installation

```bash
# Clone and install
git clone https://github.com/LessUp/meta-human.git
cd meta-human
npm install

# Start development server
npm run dev
```

Open **http://localhost:5173** — your 3D avatar is ready!

> 💡 **No API key required.** The engine automatically falls back to local mock mode for out-of-the-box demos.

---

## 🎯 Features

### 🎭 3D Avatar Engine

<table>
<tr>
<td width="50%">

| Feature              | Description                                           |
| -------------------- | ----------------------------------------------------- |
| GLB/GLTF Support     | Load custom models or use built-in procedural avatar  |
| Emotion-Driven       | Happy, surprised, sad, angry moods map to expressions |
| Skeletal Animation   | Wave, greet, nod, dance triggered by dialogue         |
| Adaptive Performance | 60fps rendering with device-based quality scaling     |

</td>
<td>

```typescript
import { digitalHumanEngine } from './core/avatar';

digitalHumanEngine.perform({
  emotion: 'happy',
  expression: 'smile',
  animation: 'wave',
});
```

**Note:** The project uses Vite path aliases. See [Path Aliases](#path-aliases) for configuration.

</td>
</tr>
</table>

### 🗣️ Voice Interaction

| Feature         | Description                          |
| --------------- | ------------------------------------ |
| TTS             | Edge TTS for natural voice synthesis |
| ASR             | Browser-native speech recognition    |
| Smart Muting    | Auto-pause TTS when user speaks      |
| Voice Detection | Visual feedback during recording     |

```typescript
import { ttsService, asrService } from './core/audio';

await ttsService.speak('Hello! How can I help?');

asrService.start({
  onResult: (text) => dialogueService.send(text),
});
```

### 🧠 Intelligent Dialogue

| Feature              | Description                                   |
| -------------------- | --------------------------------------------- |
| Multi-Modal Response | Returns `{ replyText, emotion, action }`      |
| Streaming            | Real-time token-by-token via SSE              |
| Graceful Degradation | Falls back to local mock when API unavailable |
| Session Management   | Persistent conversation context               |

```typescript
import { dialogueService } from './core/dialogue';

const response = await dialogueService.send({
  text: 'Tell me a joke',
  sessionId: 'user-123',
});
// → { replyText: '...', emotion: 'happy', action: 'laugh' }
```

### 👁️ Visual Perception

| Feature         | Description                                      |
| --------------- | ------------------------------------------------ |
| Face Mesh       | 468 landmarks for micro-expression detection     |
| Pose Estimation | Upper body gesture recognition                   |
| Emotion Mapping | Real-time emotion inference                      |
| Privacy First   | All processing in browser, no data leaves client |

---

## ⚡ Performance

Benchmarks measured on typical devices:

| Metric           | Desktop          | Mobile (Mid-range) | Mobile (Low-end) |
| ---------------- | ---------------- | ------------------ | ---------------- |
| **Rendering**    | 60 FPS           | 60 FPS             | 30 FPS           |
| **TTS Latency**  | < 200ms          | < 300ms            | < 500ms          |
| **Bundle Size**  | 180 KB (gzipped) | 180 KB             | 180 KB           |
| **Memory Usage** | ~120 MB          | ~80 MB             | ~60 MB           |

> Performance automatically scales based on device capabilities. See [Performance Module](docs/architecture/) for details.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          UI Layer                                │
│   ChatDock · TopHUD · ControlPanel · SettingsDrawer             │
└─────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                       Core Engine Layer                          │
│   Avatar · Dialogue · Vision · Audio · Performance              │
└─────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                       State Layer                                │
│   chatSessionStore · systemStore · digitalHumanStore            │
└─────────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────────┐
│                      External Services                           │
│   Three.js · Web Speech API · MediaPipe · OpenAI API            │
└─────────────────────────────────────────────────────────────────┘
```

### State Management

Three focused domains minimize re-renders:

| Store               | Responsibility                                      |
| ------------------- | --------------------------------------------------- |
| `chatSessionStore`  | Message history, session lifecycle                  |
| `systemStore`       | Connection status, errors, performance metrics      |
| `digitalHumanStore` | Avatar runtime state (expression, animation, audio) |

**[📖 Architecture Docs →](docs/architecture/)**

---

## 📁 Project Structure

```
src/
├── core/                          # Engine modules
│   ├── avatar/                    # 3D rendering & animation
│   │   ├── DigitalHumanEngine.ts  # Unified driver
│   │   └── constants.ts           # Expressions, animations
│   ├── audio/                     # TTS & ASR services
│   ├── dialogue/                  # Chat transport & orchestration
│   │   ├── dialogueService.ts     # API client
│   │   ├── dialogueOrchestrator.ts
│   │   └── chatTransport.ts       # HTTP/SSE/WebSocket
│   ├── vision/                    # MediaPipe pipeline
│   │   ├── visionService.ts
│   │   └── visionMapper.ts
│   └── performance/               # Device capability detection
├── components/                    # React components
│   ├── DigitalHumanViewer.tsx     # 3D viewport
│   ├── ChatDock.tsx               # Chat interface
│   ├── TopHUD.tsx                 # Status bar
│   ├── ControlPanel.tsx           # Quick controls
│   ├── VoiceInteractionPanel.tsx
│   ├── VisionMirrorPanel.tsx
│   └── ui/                        # Shared primitives
├── store/                         # Zustand stores
│   ├── chatSessionStore.ts
│   ├── systemStore.ts
│   └── digitalHumanStore.ts
├── hooks/                         # Custom hooks
├── pages/                         # Route pages
└── lib/                           # Utilities
```

### Path Aliases

This project uses Vite path aliases configured in `vite.config.ts`:

| Alias           | Maps to            |
| --------------- | ------------------ |
| `@core/*`       | `src/core/*`       |
| `@components/*` | `src/components/*` |
| `@store/*`      | `src/store/*`      |
| `@hooks/*`      | `src/hooks/*`      |
| `@lib/*`        | `src/lib/*`        |
| `@pages/*`      | `src/pages/*`      |

---

## 🌐 Deployment

### GitHub Pages (Frontend)

```bash
npm run build:pages
```

1. Set `VITE_API_BASE_URL` in GitHub Repository Variables
2. Push to `main` or run "Deploy Pages" workflow
3. Live at: `https://lessup.github.io/meta-human/`

### Render (Backend)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/LessUp/meta-human)

Use `render.yaml` blueprint:

```yaml
# Deploys FastAPI backend with:
POST /v1/chat          # OpenAI-compatible chat
POST /v1/chat/stream   # SSE streaming
POST /v1/tts           # Text-to-speech
POST /v1/asr           # Speech-to-text
WebSocket /ws          # Real-time streaming
```

**Required Environment Variables:**

| Variable             | Description              | Required                      |
| -------------------- | ------------------------ | ----------------------------- |
| `OPENAI_API_KEY`     | AI responses             | Optional (falls back to mock) |
| `CORS_ALLOW_ORIGINS` | Frontend domain for CORS | Yes                           |

**[📖 Deployment Guide →](docs/guide/installation.md)**

---

## 🛠️ Scripts

### Development

```bash
npm run dev              # Start dev server (port 5173)
npm run preview          # Preview production build
npm run preview:https    # Preview with HTTPS
```

### Build

```bash
npm run build            # Production build
npm run build:pages      # GitHub Pages build
npm run build:mobile     # Mobile-optimized build
npm run build:desktop    # Desktop-optimized build
npm run build:ar         # AR-enabled build
npm run build:analyze    # Build with bundle analyzer
```

### Quality

```bash
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix ESLint issues
npm run format           # Prettier formatting
npm run format:check     # Check formatting without writing
npm run typecheck        # TypeScript check
```

### Testing

```bash
npm run test             # Vitest watch mode
npm run test:run         # Run tests once
npm run test:coverage    # Coverage report
npm run test:ui          # Vitest UI mode
```

---

## 🧰 Browser Support

| Feature                  | Chrome | Edge   | Firefox          | Safari           |
| ------------------------ | ------ | ------ | ---------------- | ---------------- |
| Core Engine              | 90+ ✅ | 90+ ✅ | 90+ ✅           | 15+ ✅           |
| TTS (Speech Synthesis)   | 90+ ✅ | 90+ ✅ | 90+ ✅           | 15+ ✅           |
| ASR (Speech Recognition) | 90+ ✅ | 90+ ✅ | ❌ Not supported | ❌ Not supported |
| MediaPipe Vision         | 90+ ✅ | 90+ ✅ | 90+ ✅           | 15+ ⚠️           |

> **ASR Limitations:** Speech recognition requires Chrome or Edge due to Web Speech API limitations. Firefox and Safari users can use text input instead.

> **Safari Note:** MediaPipe vision features may require enabling experimental features.

---

## 📚 Documentation

- **[Quick Start](docs/guide/)** — Get running in 5 minutes
- **[API Reference](docs/api/)** — Backend API documentation
- **[Architecture](docs/architecture/)** — System design
- **[Configuration](docs/guide/configuration.md)** — Environment variables and settings
- **[Contributing](docs/contributing/)** — Contribution guidelines
- **[Changelog](CHANGELOG.md)** — Version history

---

## 🛣️ Roadmap

See [CHANGELOG.md](CHANGELOG.md) for released features and [GitHub Projects](https://github.com/LessUp/meta-human/projects) for upcoming work.

- [x] Core 3D avatar rendering
- [x] Voice interaction (TTS/ASR)
- [x] Visual perception (MediaPipe)
- [x] Streaming dialogue
- [ ] Mobile AR support
- [ ] Custom avatar upload
- [ ] Multi-language TTS

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/contributing/) for details.

1. Fork the repository
2. Create feature branch: `git checkout -b feat/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feat/amazing-feature`
5. Open a Pull Request

Follow [Conventional Commits](https://www.conventionalcommits.org/).

---

## 📄 License

[MIT](LICENSE) © LessUp

---

<p align="center">
  <strong>Built with ❤️ to make digital humans accessible to everyone</strong>
</p>

<p align="center">
  <a href="https://github.com/LessUp/meta-human/stargazers">⭐ Star us on GitHub</a> ·
  <a href="https://x.com/LessUpHQ">🐦 Follow on X</a>
</p>
