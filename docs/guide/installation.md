# Installation Guide

Complete installation instructions for MetaHuman Engine.

---

## System Requirements

### Minimum Requirements

| Component | Specification |
|-----------|--------------|
| OS | Windows 10+, macOS 11+, or Linux (Ubuntu 20.04+) |
| RAM | 4 GB |
| Disk | 2 GB free space |
| Browser | Chrome 90+, Edge 90+, Firefox 90+, Safari 15+ |

### Recommended Requirements

| Component | Specification |
|-----------|--------------|
| RAM | 8 GB |
| GPU | WebGL 2.0 compatible *(for optimal 3D performance)* |
| Network | Broadband *(for streaming responses)* |

---

## Frontend Installation

### Step 1: Install Node.js

**macOS (Homebrew):**
```bash
brew install node@18
```

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Windows:**
Download from [nodejs.org](https://nodejs.org/) (LTS version)

**Verify installation:**
```bash
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

### Step 2: Clone and Setup

```bash
# Clone the repository
git clone https://github.com/LessUp/meta-human.git
cd meta-human

# Install dependencies
npm install

# Verify installation
npm run typecheck
```

### Step 3: Configure Environment

Create `.env.local`:

```bash
# Backend API URL (optional - uses mock if not set)
VITE_API_BASE_URL=http://localhost:8000

# Transport mode: http, sse, websocket, auto
VITE_CHAT_TRANSPORT=auto
```

### Step 4: Start Development

```bash
npm run dev
```

Access at **http://localhost:5173**

---

## Backend Installation

### Option 1: Local Python Environment

**Step 1: Install Python 3.10+**

**macOS:**
```bash
brew install python@3.10
```

**Ubuntu:**
```bash
sudo apt-get update
sudo apt-get install python3.10 python3.10-venv
```

**Windows:**
Download from [python.org](https://python.org/)

**Verify:**
```bash
python --version  # Should show 3.10.x or higher
```

**Step 2: Setup Virtual Environment**

```bash
cd server

# Create virtual environment
python -m venv venv

# Activate
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt
```

**Step 3: Configure Environment**

Create `server/.env`:

```bash
# Required for AI responses (optional - mock mode works without)
OPENAI_API_KEY=sk-your-api-key-here

# Optional: Custom endpoint
OPENAI_BASE_URL=https://api.openai.com/v1

# Optional: Model selection
OPENAI_MODEL=gpt-3.5-turbo

# Rate limiting (requests per minute)
RATE_LIMIT_RPM=60

# CORS origins (comma-separated)
CORS_ALLOW_ORIGINS=http://localhost:5173,https://yourdomain.com
```

**Step 4: Start Backend**

```bash
uvicorn app.main:app --reload --port 8000
```

Backend runs at **http://localhost:8000**

API docs at **http://localhost:8000/docs**

---

### Option 2: Docker (Recommended for Production)

**Step 1: Install Docker**

See [docker.com](https://docker.com/) for platform-specific instructions.

**Step 2: Build and Run**

```bash
# Build image
docker build -t metahuman-backend ./server

# Run container
docker run -p 8000:8000 \
  -e OPENAI_API_KEY=sk-... \
  -e CORS_ALLOW_ORIGINS=http://localhost:5173 \
  metahuman-backend
```

**Or use docker-compose:**

```yaml
version: '3.8'
services:
  backend:
    build: ./server
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - CORS_ALLOW_ORIGINS=http://localhost:5173
```

---

## Production Deployment

### Frontend: GitHub Pages

**Step 1: Build**

```bash
npm run build:pages
```

**Step 2: Configure Repository**

1. Go to GitHub repository → Settings → Pages
2. Set source to "GitHub Actions"

**Step 3: Set Environment Variables**

Go to Settings → Secrets and variables → Actions:

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | Your backend URL |

**Step 4: Deploy**

```bash
git push origin main
```

Or trigger "Deploy Pages" workflow manually.

---

### Backend: Render

**Step 1: Create Blueprint Service**

Import from GitHub using `render.yaml` in project root.

**Step 2: Configure Service**

| Setting | Value |
|---------|-------|
| Root Directory | `server` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health Check | `/health` |

**Step 3: Set Environment Variables**

```
CORS_ALLOW_ORIGINS=https://your-frontend-domain.com
OPENAI_API_KEY=sk-...
```

**Step 4: Connect Frontend**

Update GitHub Repository variable:

```
VITE_API_BASE_URL=https://your-backend.onrender.com
```

---

## Verification

### Frontend Health Check

```bash
# Should return the Vite dev server page
curl http://localhost:5173
```

### Backend Health Check

```bash
# Should return JSON status
curl http://localhost:8000/health

# Expected response:
# {
#   "status": "ok",
#   "services": {
#     "chat": "available",
#     "llm": "mock_mode",
#     "tts": "available",
#     "asr": "unavailable"
#   }
# }
```

### API Test

```bash
# Test chat endpoint
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"userText": "Hello"}'
```

---

## Troubleshooting

### npm install fails

**Clear cache and retry:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Python packages fail to install

**Upgrade pip:**
```bash
pip install --upgrade pip setuptools
pip install -r requirements.txt
```

### Port conflicts

**Frontend (port 5173):**
```bash
# Find process
lsof -ti:5173

# Kill process
lsof -ti:5173 | xargs kill -9
```

**Backend (port 8000):**
```bash
lsof -ti:8000 | xargs kill -9
```

### CORS errors

1. Verify `CORS_ALLOW_ORIGINS` includes frontend URL
2. Ensure no trailing slash mismatches
3. Check protocol (http vs https)

---

<p align="center">
  <a href="./configuration.md">Next: Configuration →</a>
</p>
