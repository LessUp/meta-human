# Quick Start Guide

Get MetaHuman Engine running in 5 minutes.

---

## Prerequisites

| Requirement | Version | Check Command      |
| ----------- | ------- | ------------------ |
| Node.js     | ≥ 20    | `node --version`   |
| npm         | ≥ 9     | `npm --version`    |
| Python      | ≥ 3.10  | `python --version` |
| Git         | Any     | `git --version`    |

---

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/LessUp/meta-human.git
cd meta-human
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

Open **http://localhost:5173** — your 3D avatar is ready!

> ✅ No API key required. The engine automatically falls back to local mock mode.

---

## Project Structure

```
meta-human/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── core/              # Engine modules
│   │   ├── avatar/        # 3D rendering
│   │   ├── audio/         # TTS & ASR
│   │   ├── dialogue/      # Chat service
│   │   └── vision/        # Face tracking
│   ├── store/             # Zustand stores
│   └── hooks/             # Custom hooks
├── server/                 # FastAPI backend
├── docs/                   # Documentation
├── public/                 # Static assets
└── dist/                   # Build output
```

---

## Your First Interaction

### Text Chat

1. Type a message in the chat input
2. Press Enter or click Send
3. Watch the avatar respond with:
   - **Text reply** in the chat panel
   - **Voice synthesis** (TTS)
   - **Facial expression** matching emotion
   - **Gesture animation** (wave, nod, etc.)

### Voice Interaction

1. Click the **microphone button**
2. Speak your message
3. Release to send
4. The avatar responds automatically

### Vision Mode

1. Click **Enable Camera**
2. Allow camera access
3. Show expressions to the camera:
   - 😊 Smile → Avatar smiles
   - 😮 Surprise → Avatar surprised
   - 😢 Sad → Avatar concerned
   - 😠 Angry → Avatar sympathetic

---

## Configuration

### Frontend Environment Variables

Create `.env.local` in the project root:

```bash
# Backend API URL
VITE_API_BASE_URL=http://localhost:8000

# Chat transport: http | sse | websocket | auto
VITE_CHAT_TRANSPORT=auto
```

### Backend Environment Variables

Create `server/.env`:

```bash
# Optional: OpenAI API for AI responses
OPENAI_API_KEY=sk-...

# Optional: Custom OpenAI endpoint
OPENAI_BASE_URL=https://api.openai.com/v1

# LLM provider: openai | azure
LLM_PROVIDER=openai

# Rate limiting
RATE_LIMIT_RPM=60

# CORS origins
CORS_ALLOW_ORIGINS=http://localhost:5173
```

---

## Common Operations

### Development Commands

```bash
# Start dev server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Run tests
npm run test
```

### Backend Development

```bash
cd server

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Start backend
uvicorn app.main:app --reload --port 8000
```

Backend runs at **http://localhost:8000**

Interactive docs at **http://localhost:8000/docs**

---

## Next Steps

- **[Installation Guide](./installation.md)** — Detailed setup instructions
- **[Configuration](./configuration.md)** — All environment variables
- **[API Reference](../api/)** — Backend API documentation
- **[Architecture](../architecture/)** — System design

---

## Troubleshooting

### Port Already in Use

```bash
# Find and kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Node Modules Issues

```bash
rm -rf node_modules package-lock.json
npm install
```

### Backend Connection Failed

1. Check if backend is running: `curl http://localhost:8000/health`
2. Verify `VITE_API_BASE_URL` in `.env.local`
3. Check CORS settings in backend

### Camera Not Working

- Ensure HTTPS or localhost (browsers block camera on HTTP)
- Check browser permissions
- Try a different browser (Chrome/Edge recommended)

---

<p align="center">
  🎉 You're ready to build with MetaHuman Engine!
</p>
