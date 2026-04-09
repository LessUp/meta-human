<p align="center">
  <img src="public/favicon.svg" width="80" alt="MetaHuman Engine" />
</p>

<h1 align="center">MetaHuman Engine</h1>

<p align="center">
  A modular, real-time 3D digital human interaction engine for the browser.
</p>

<p align="center">
  <strong>English</strong> | <a href="README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61dafb?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Three.js-r158-black?logo=threedotjs" alt="Three.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5-646cff?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
</p>

---

## Overview

**MetaHuman Engine** is a browser-native digital human interaction engine that provides **3D avatar rendering**, **voice conversation**, **visual perception**, and **behavior control** as composable modules. Built for virtual customer service, live streaming avatars, educational assistants, and more.

## Key Features

| Module | Capabilities | Technology |
|--------|-------------|------------|
| **Avatar** | Real-time 3D rendering, facial expressions, skeletal animation | Three.js + React Three Fiber |
| **Audio** | TTS speech synthesis, ASR speech recognition | Web Speech API |
| **Dialogue** | Multi-turn conversation, local fallback, streaming (planned) | REST API with retry & degradation |
| **Vision** | Facial emotion analysis, head motion detection, gesture recognition | MediaPipe Face Mesh & Pose |

## Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/LessUp/meta-human.git
cd meta-human

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env.local` and configure as needed:

```bash
cp .env.example .env.local
```

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend dialogue service URL | `http://localhost:8000` |

## Project Structure

```
src/
├── core/                   # Core engine layer
│   ├── avatar/             #   3D avatar engine
│   ├── audio/              #   Audio services (TTS / ASR)
│   ├── dialogue/           #   Dialogue orchestration & transport
│   └── vision/             #   Visual perception & emotion mapping
├── components/             # UI components
│   ├── ui/                 #   Shared UI primitives
│   ├── DigitalHumanViewer  #   3D viewer
│   ├── ControlPanel        #   Control panel
│   └── ...                 #   Expression / Behavior / Voice / Vision panels
├── hooks/                  # Custom React hooks
├── store/                  # Zustand global state
├── pages/                  # Page components
├── lib/                    # Utility functions
├── App.tsx                 # Router entry
└── main.tsx                # Application entry
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run build:pages` | GitHub Pages build (`/meta-human/`) |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint checks |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Generate coverage report |
| `npm run typecheck` | TypeScript type checking |

## Tech Stack

- **Framework** — React 18 + TypeScript
- **3D Rendering** — Three.js + React Three Fiber + Drei
- **State Management** — Zustand
- **Styling** — Tailwind CSS
- **Build Tool** — Vite 5
- **Testing** — Vitest + Testing Library
- **CI/CD** — GitHub Actions
- **Deployment** — GitHub Pages

## Deployment

### GitHub Pages

This repository now uses **GitHub Pages** as the primary deployment target.

1. Add a repository variable named `VITE_API_BASE_URL`
2. Push to `master` or run the `Deploy Pages` workflow manually
3. After the first successful deployment, the site will be available at:

```text
https://lessup.github.io/meta-human/
```

Client-side routes use hash URLs on Pages, for example:

```text
https://lessup.github.io/meta-human/#/advanced
```

### Build commands

```bash
# Standard production build
npm run build

# GitHub Pages build (/meta-human/ base path)
npm run build:pages
```

> The Pages workflow reads `VITE_API_BASE_URL` from GitHub Actions repository variables. If it is missing, the deployed app will fall back to `http://localhost:8000`, which is not suitable for production.

## Architecture


```
┌──────────────────────────────────────────┐
│                  UI Layer                 │
│   Pages ← Components ← Hooks ← Store    │
├──────────────────────────────────────────┤
│               Core Engine                │
│  ┌────────┐ ┌───────┐ ┌────────┐ ┌─────┐│
│  │ Avatar │ │ Audio │ │Dialogue│ │Vision││
│  └────────┘ └───────┘ └────────┘ └─────┘│
├──────────────────────────────────────────┤
│            External Services             │
│  Three.js  Web Speech  REST API MediaPipe│
└──────────────────────────────────────────┘
```

## API Quick Reference

### Avatar Engine

```typescript
import { digitalHumanEngine } from '@/core/avatar';

digitalHumanEngine.setExpression('smile');
digitalHumanEngine.setEmotion('happy');
digitalHumanEngine.playAnimation('wave');
digitalHumanEngine.performGreeting();
```

### Audio Services

```typescript
import { ttsService, asrService } from '@/core/audio';

// Text-to-Speech
await ttsService.speak('Hello, how can I help you?');

// Speech Recognition
asrService.start({ mode: 'command' });
```

### State Management

```typescript
import { useDigitalHumanStore } from '@/store/digitalHumanStore';

const { isPlaying, currentExpression, play, pause } = useDigitalHumanStore();
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `R` | Reset |
| `M` | Toggle mute |
| `V` | Toggle recording |
| `S` | Toggle settings panel |
| `1` – `4` | Quick actions |
| `Esc` | Close settings |

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | >= 90 |
| Edge | >= 90 |
| Firefox | >= 90 |
| Safari | >= 15 |

> Speech Recognition (ASR) requires **Chrome** or **Edge** due to Web Speech API limitations.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes (`git commit -m 'feat: add my feature'`)
4. Push to the branch (`git push origin feat/my-feature`)
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

## License

[MIT](LICENSE)
