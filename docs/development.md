# Development Guide

## Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| Python | ≥ 3.10 (for backend) |

## Quick Start

### Frontend

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open **http://localhost:5173**

### Backend

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r server/requirements.txt

# Start server
uvicorn --app-dir server app.main:app --reload --port 8000
```

Backend runs at **http://localhost:8000**

---

## Environment Variables

### Frontend (`.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Backend API URL |
| `VITE_CHAT_TRANSPORT` | `auto` | Transport: `http`, `sse`, `websocket`, `auto` |

### Backend (`server/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | — | OpenAI API key (optional) |
| `OPENAI_MODEL` | `gpt-3.5-turbo` | Model to use |
| `OPENAI_BASE_URL` | — | Custom API endpoint |
| `LLM_PROVIDER` | `openai` | LLM provider |
| `TTS_PROVIDER` | `edge` | TTS provider |
| `ASR_PROVIDER` | `whisper` | ASR provider |
| `RATE_LIMIT_RPM` | `60` | Rate limit per minute |
| `CORS_ALLOW_ORIGINS` | — | Comma-separated allowed origins |

---

## Scripts Reference

### Development

```bash
npm run dev          # Start dev server (port 5173)
npm run preview      # Preview production build
npm run serve        # Preview on 0.0.0.0:3000
```

### Build

```bash
npm run build        # Production build → dist/
npm run build:pages  # GitHub Pages build → dist/ (base: /meta-human/)
npm run build:mobile # Mobile build → dist-mobile/
npm run build:desktop # Desktop build → dist-desktop/
npm run build:ar     # AR build → dist-ar/
```

### Quality

```bash
npm run lint         # ESLint check
npm run lint:fix     # Auto-fix ESLint issues
npm run format       # Prettier formatting
npm run typecheck    # TypeScript validation
```

### Testing

```bash
npm run test         # Vitest watch mode
npm run test:run     # Run tests once
npm run test:coverage # Generate coverage report

# Run specific test file
npx vitest run src/__tests__/digitalHuman.test.tsx

# Run tests matching name
npx vitest run -t "renders without crashing"
```

---

## Deployment

### GitHub Pages (Frontend)

1. **Build configuration**

   Ensure `VITE_API_BASE_URL` is set in GitHub Repository Variables.

2. **Deploy**

   ```bash
   git push origin master
   # Or manually trigger "Deploy Pages" workflow
   ```

3. **Verify**

   Visit `https://lessup.github.io/meta-human/`

### Render (Backend)

1. **Create Blueprint service**

   Import from repository using `render.yaml` in project root.

2. **Configure service**

   | Setting | Value |
   |---------|-------|
   | Root Directory | `server` |
   | Build Command | `pip install -r requirements.txt` |
   | Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
   | Health Check | `/health` |

3. **Set environment variables**

   ```
   CORS_ALLOW_ORIGINS=https://lessup.github.io
   OPENAI_API_KEY=sk-...  # optional
   ```

4. **Connect frontend**

   Set `VITE_API_BASE_URL` in GitHub Repository Variables to your Render URL.

---

## Project Conventions

### File Naming

- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Tests: `*.test.ts` or `*.test.tsx`

### Import Paths

Use `@/` alias for `src/`:

```typescript
import { Button } from '@/components/ui/Button';
import { useDigitalHumanStore } from '@/store/digitalHumanStore';
```

### State Management

Use Zustand selectors to prevent unnecessary re-renders:

```typescript
// ✅ Good
const isPlaying = useDigitalHumanStore(s => s.isPlaying);

// ❌ Avoid
const { isPlaying, isRecording, ... } = useDigitalHumanStore();
```

### Component Structure

```typescript
// 1. Imports
import { useState } from 'react';

// 2. Types
interface Props {
  title: string;
}

// 3. Constants (outside component)
const DEFAULT_TITLE = 'Hello';

// 4. Component
export function MyComponent({ title }: Props) {
  // Hooks at top
  const [count, setCount] = useState(0);

  // Handlers
  const handleClick = () => setCount(c => c + 1);

  // Render
  return <button onClick={handleClick}>{title}</button>;
}
```

---

## Browser Requirements

### Required for Full Functionality

| Feature | Requirement |
|---------|-------------|
| WebGL | Any modern browser |
| Speech Synthesis | Any modern browser |
| Speech Recognition | Chrome or Edge |
| Camera Access | HTTPS or localhost |
| MediaPipe | WebGL 2.0 support |

### Supported Browsers

| Browser | Version | Notes |
|---------|---------|-------|
| Chrome | 90+ | Full support |
| Edge | 90+ | Full support |
| Firefox | 90+ | No ASR |
| Safari | 15+ | Limited speech API |

---

## Troubleshooting

### Model Not Loading

1. Check browser console for errors
2. Verify URL is accessible
3. Fallback avatar will display automatically

### Speech Not Working

1. Check browser permissions
2. Ensure HTTPS or localhost
3. Chrome/Edge required for ASR

### Backend Connection Issues

1. Verify `VITE_API_BASE_URL` is correct
2. Check CORS settings on backend
3. Ensure backend is running

### Performance Issues

1. Check device tier in console logs
2. Reduce quality in browser devtools
3. Disable vision panel if not needed

---

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feat/amazing-feature`
3. Make changes with tests
4. Run quality checks: `npm run lint && npm run typecheck && npm run test:run`
5. Commit: `git commit -m 'feat: add amazing feature'`
6. Push: `git push origin feat/amazing-feature`
7. Open Pull Request

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `refactor` | Code refactoring |
| `test` | Adding tests |
| `chore` | Maintenance |
