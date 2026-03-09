# MetaHuman - 3D Digital Human Interaction Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-r158-000000?logo=threedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)

English | [简体中文](README.zh-CN.md)

A web-based 3D digital human interaction platform with real-time 3D rendering, voice interaction, facial expression control, and intelligent behavior system. Features dark/light dual themes.

---

## UI Preview

> Run `npm run dev` and visit `http://localhost:5173` for the full experience

| Main UI | Control Panel | 404 Page |
|:---:|:---:|:---:|
| ![Main UI](docs/screenshots/main-ui.png) | ![Control Panel](docs/screenshots/control-panel.png) | ![404 Page](docs/screenshots/404-page.png) |

> Screenshots: Run the project and manually capture screenshots to `docs/screenshots/`.

---

## Core Features

### 3D Digital Human Rendering

- Dual-mode Avatar system: **CyberAvatar** (pure-geometry cyberpunk style) + **VRM Avatar** (`.vrm` model loading)
- Real-time rendering with Three.js + React Three Fiber
- 25 behavior animations (wave, bow, clap, think, dance, etc.)
- 11 facial expressions (smile, laugh, surprise, sad, angry, etc.)
- Mouse-based head tracking + emotion lighting system
- Smooth animation transitions via lerp interpolation

### Voice Interaction

- TTS synthesis + ASR recognition (Web Speech API)
- Chinese voice priority with customizable voice parameters
- Voice commands trigger actions directly ("say hello", "dance", etc.)

### LLM Dialogue

- Frontend → Backend `/v1/chat` → OpenAI Chat Completions
- Backend returns structured data to drive the digital human (emotion + action + reply)
- Graceful degradation to intelligent mock replies when no API key is configured
- Multi-turn conversation context and session management

### Vision Mirror

- Real-time camera preview + MediaPipe FaceMesh/Pose inference
- Facial keypoint mapping to emotions and head movements
- Real-time FPS display

### Keyboard Shortcuts

| Key | Function |
|:---:|:---|
| `Space` | Play/Pause |
| `R` | Reset digital human |
| `M` | Toggle mute |
| `V` | Toggle recording |
| `S` | Toggle settings panel |
| `Esc` | Close panel |
| `1`~`4` | Quick-trigger preset behaviors |

> Shortcuts are disabled when an input field is focused.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript 5 + Vite 5 |
| 3D Rendering | Three.js r158 + @react-three/fiber + @react-three/drei |
| VRM | @pixiv/three-vrm 3.5 |
| State Management | Zustand 4 |
| Styling | Tailwind CSS 3 (dual theme `darkMode: "class"`) |
| Icons | Lucide React |
| Notifications | Sonner |
| Routing | React Router DOM 6 |
| Testing | Vitest + @testing-library/react + fast-check |
| Backend | FastAPI + httpx (Python) |
| Deployment | Vercel |

---

## Quick Start

### Frontend

```bash
npm ci            # Install dependencies
npm run dev       # Dev server → http://localhost:5173
npm run build     # Build
```

### Backend (Optional)

```bash
cd server
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

> The frontend runs independently without the backend. Dialogue features degrade gracefully when the backend is not running.

### Testing

```bash
npm run test          # Watch mode
npm run test:run      # Single run
npm run lint          # ESLint check
```

---

## Project Structure

```
src/
├── pages/                              # Page components
│   ├── AdvancedDigitalHumanPage.tsx     # Main page (full features)
│   ├── DigitalHumanPage.tsx            # Simplified page
│   └── NotFoundPage.tsx                # 404 page
├── components/                         # UI + 3D components
│   ├── DigitalHumanViewer.enhanced.tsx  # Core: CyberAvatar 3D rendering
│   ├── VRMAvatar.tsx                   # VRM model rendering
│   ├── BehaviorControlPanel.new.tsx    # Behavior control (25 actions)
│   ├── ExpressionControlPanel.new.tsx  # Expression control (11 expressions)
│   ├── VoiceInteractionPanel.dark.tsx  # Voice interaction panel
│   ├── VisionMirrorPanel.tsx           # Camera emotion detection
│   ├── ControlPanel.tsx                # Basic control panel
│   ├── KeyboardShortcutsHelp.tsx       # Keyboard shortcuts help
│   └── ui/                            # Base UI components
├── core/                               # Core engines
│   ├── avatar/DigitalHumanEngine.ts    # Behavior engine (animation queue + combo actions)
│   ├── audio/audioService.ts           # TTS/ASR voice service
│   ├── dialogue/                       # Dialogue service + orchestrator
│   ├── vision/                         # Vision recognition (MediaPipe)
│   └── performance/                    # Performance monitoring
├── store/digitalHumanStore.ts          # Zustand global state
├── hooks/                              # Custom hooks (incl. vrm/ subdirectory)
├── __tests__/                          # Test files
└── lib/utils.ts                        # Utility functions

server/                                 # Python FastAPI backend
├── app/
│   ├── main.py                         # Entry point
│   ├── api/chat.py                     # Chat API
│   └── services/dialogue.py            # Dialogue service (LLM + Mock)
└── requirements.txt
```

---

## Documentation

- **[Architecture](docs/architecture.md)** — Frontend/backend architecture, core modules, data flow
- **[Development Guide](docs/development.md)** — Setup, environment variables, browser compatibility
- **[API Contract](docs/api.md)** — Backend API specification and fallback strategies
- **[Changelog](changelog/)** — Version history

---

## Browser Compatibility

- Voice features depend on Web Speech API — **Chrome / Edge** recommended
- Camera/microphone requires HTTPS or localhost
- 3D rendering requires WebGL 2.0 support

---

## Contributing

1. Fork this repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "feat: add your feature"`
4. Push and create a Pull Request

Commit convention: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:` / `fix:` / `docs:` / `style:` / `refactor:`)

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## License

[MIT](LICENSE)
