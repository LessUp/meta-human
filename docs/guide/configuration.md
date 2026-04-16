# Configuration Guide

Complete environment variable reference for MetaHuman Engine.

---

## Frontend Configuration

Create `.env.local` in the project root.

### API Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | *(empty)* | Backend API URL. Leave empty for mock mode. |
| `VITE_CHAT_TRANSPORT` | `auto` | Transport mode: `http`, `sse`, `websocket`, `auto` |

### Transport Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `auto` | Auto-detect capability (WebSocket → SSE → HTTP) | **Recommended** |
| `http` | Standard HTTP requests | Simple setups |
| `sse` | Server-Sent Events for streaming | One-way streaming |
| `websocket` | Full-duplex WebSocket | Real-time bidirectional |

### Example `.env.local`

```bash
# Backend API (leave empty for mock mode)
VITE_API_BASE_URL=http://localhost:8000

# Transport selection
VITE_CHAT_TRANSPORT=auto
```

---

## Backend Configuration

Create `server/.env` in the server directory.

### AI/LLM Configuration

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `OPENAI_API_KEY` | *(empty)* | No | OpenAI API key for AI responses |
| `OPENAI_BASE_URL` | *(empty)* | No | Custom OpenAI-compatible endpoint |
| `OPENAI_MODEL` | `gpt-3.5-turbo` | No | Model to use |
| `LLM_PROVIDER` | `openai` | No | LLM provider: `openai`, `azure` |

### Service Providers

| Variable | Default | Description |
|----------|---------|-------------|
| `TTS_PROVIDER` | `edge` | TTS provider: `edge`, `openai` |
| `ASR_PROVIDER` | `whisper` | ASR provider: `whisper` |

### Rate Limiting

| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_RPM` | `60` | Requests per minute per IP |

### CORS Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ALLOW_ORIGINS` | *(empty)* | Comma-separated allowed origins |

**Example:**
```bash
CORS_ALLOW_ORIGINS=http://localhost:5173,https://myapp.com
```

### Server Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` | Server bind address |
| `PORT` | `8000` | Server port |
| `LOG_LEVEL` | `info` | Logging level: `debug`, `info`, `warning`, `error` |

### Example `server/.env`

```bash
# AI Configuration
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4

# Rate Limiting
RATE_LIMIT_RPM=100

# CORS
CORS_ALLOW_ORIGINS=http://localhost:5173,https://mydomain.com

# Logging
LOG_LEVEL=info
```

---

## Advanced Configuration

### Custom OpenAI-Compatible Endpoint

For services like Azure OpenAI, LocalAI, or Ollama:

```bash
OPENAI_API_KEY=your-key
OPENAI_BASE_URL=https://your-endpoint.com/v1
OPENAI_MODEL=your-model-name
```

### Multi-Environment Setup

**Development:**
```bash
# .env.local
VITE_API_BASE_URL=http://localhost:8000
VITE_CHAT_TRANSPORT=auto
```

**Staging:**
```bash
# .env.staging
VITE_API_BASE_URL=https://staging-api.example.com
VITE_CHAT_TRANSPORT=websocket
```

**Production:**
```bash
# .env.production
VITE_API_BASE_URL=https://api.example.com
VITE_CHAT_TRANSPORT=websocket
```

Use with Vite modes:
```bash
npm run dev -- --mode staging
npm run build -- --mode production
```

---

## Feature-Specific Configuration

### Vision (MediaPipe)

Vision processing runs entirely in the browser — no backend configuration needed.

**Browser requirements:**
- WebGL 2.0 enabled
- Camera permission granted
- HTTPS or localhost

### Speech Recognition

Uses Web Speech API (browser-native):

**Supported browsers:**
- Chrome 25+
- Edge 79+
- Safari 14.1+ (limited)

No backend configuration required.

### Text-to-Speech

**Edge TTS (Default):**
- No configuration needed
- Works offline
- Multiple voices available

**OpenAI TTS:**
```bash
TTS_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

---

## Security Best Practices

### 🔒 API Keys

1. **Never commit** `.env` files to version control
2. Use **environment-specific** keys
3. Rotate keys **regularly**
4. Use **minimal permissions**

### 🔒 CORS

1. **Restrict origins** in production:
   ```bash
   # Good
   CORS_ALLOW_ORIGINS=https://myapp.com
   
   # Bad
   CORS_ALLOW_ORIGINS=*
   ```

2. **No trailing slashes** in origins
3. **Include protocol** (http/https)

### 🔒 Rate Limiting

Adjust based on your infrastructure:

```bash
# Cloud deployment (higher)
RATE_LIMIT_RPM=1000

# Self-hosted (lower)
RATE_LIMIT_RPM=60
```

---

## Environment Variable Precedence

### Frontend

1. `.env.[mode].local` (highest)
2. `.env.[mode]`
3. `.env.local`
4. `.env` (lowest)

### Backend

1. Environment variables (system)
2. `.env` file
3. Default values (lowest)

---

## Troubleshooting Configuration

### Changes Not Applied

**Frontend:**
```bash
# Restart dev server
npm run dev
```

**Backend:**
```bash
# Restart uvicorn
# (Auto-reloads on code changes, not env changes)
```

### CORS Errors

1. Check `CORS_ALLOW_ORIGINS` exact match
2. Verify protocol consistency
3. Check for trailing slashes

### API Key Not Working

1. Verify key format: `sk-...`
2. Check for extra whitespace
3. Test with curl:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer $OPENAI_API_KEY"
   ```

---

## Complete Configuration Template

### Minimal (Mock Mode)

```bash
# .env.local (Frontend)
# Empty = mock mode, no backend needed

# server/.env (Backend)
# Not needed without AI features
```

### Standard (With OpenAI)

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:8000
VITE_CHAT_TRANSPORT=auto

# server/.env
OPENAI_API_KEY=sk-...
CORS_ALLOW_ORIGINS=http://localhost:5173
RATE_LIMIT_RPM=60
```

### Production

```bash
# .env.production
VITE_API_BASE_URL=https://api.mydomain.com
VITE_CHAT_TRANSPORT=websocket

# server/.env (on server)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
CORS_ALLOW_ORIGINS=https://mydomain.com
RATE_LIMIT_RPM=1000
LOG_LEVEL=warning
```

---

<p align="center">
  <a href="../architecture/">Next: Architecture →</a>
</p>
