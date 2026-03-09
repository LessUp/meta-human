# MetaHuman - 3D Digital Human Interaction Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-r150+-000000?logo=threedotjs&logoColor=white)

[简体中文](README.md) | English

A web-based 3D digital human interaction platform with real-time rendering, voice interaction, expression control, and intelligent behavior system.

## Core Features

### 3D Modeling & Animation
- Three.js high-precision rendering, FBX/GLTF model support
- Real-time lighting/shadow, skeletal binding, facial expression control

### Voice Interaction
- TTS voice synthesis (Web Speech API), ASR recognition
- Multi-language support (Chinese priority), customizable voice parameters

### Behavior Control
- Emotion state machine, AI-driven intelligent decisions
- Visual behavior editor, complex action sequences

### Rendering Engine
- WebGL real-time rendering, responsive design
- Multi-platform adaptation, performance optimization

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **3D Rendering**: Three.js + React Three Fiber
- **State**: Zustand
- **UI**: Tailwind CSS + Lucide React
- **Build**: Vite
- **Deploy**: Vercel

## Quick Start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # Production build
npm run deploy   # Deploy to Vercel
```

## Keyboard Shortcuts

| Key | Function |
|-----|----------|
| `Space` | Play / Pause |
| `R` | Reset |
| `M` | Mute toggle |
| `V` | Record toggle |
| `S` | Settings panel |
| `1`-`4` | Quick trigger preset behaviors |

## License

MIT License
