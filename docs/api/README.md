# API Reference

Complete API documentation for MetaHuman Engine backend services.

---

## Overview

The MetaHuman Engine backend provides a RESTful API and WebSocket endpoint for:

- 🤖 **Chat & Dialogue** — AI-powered conversations with streaming support
- 🔊 **Text-to-Speech** — Multi-voice speech synthesis
- 🎤 **Speech-to-Text** — Audio transcription
- 📊 **Session Management** — Persistent conversation contexts

---

## Base URL

```
VITE_API_BASE_URL || http://localhost:8000
```

---

## Authentication

Currently, the API does not require authentication for most endpoints. Rate limiting is applied based on IP address.

For production deployments, set `CORS_ALLOW_ORIGINS` to restrict access:

```bash
CORS_ALLOW_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

---

## API Endpoints

### Health Check

```http
GET /health
```

Check service status and availability of subsystems.

**Response:**

```json
{
  "status": "ok",
  "uptime_seconds": 123.45,
  "version": "1.0.0",
  "services": {
    "chat": "available",
    "llm": "available",
    "tts": "available",
    "asr": "unavailable"
  }
}
```

| Status | Meaning |
|--------|---------|
| `available` | Service is working |
| `mock_mode` | No API key, using local mock |
| `unavailable` | Service not configured |

---

## Detailed Documentation

| Document | Description |
|----------|-------------|
| [REST API](./rest-api.md) | Complete HTTP API reference |
| [WebSocket](./websocket.md) | Real-time communication protocol |

---

## Rate Limiting

Default: 60 requests per minute per IP

Headers included in responses:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1700000000
```

Configure via environment variable:

```bash
RATE_LIMIT_RPM=60
```

---

## CORS Configuration

Configure allowed origins:

```bash
CORS_ALLOW_ORIGINS=https://example.com,https://app.example.com
```

For local development, all origins are allowed.

---

## Error Handling

All endpoints return errors in this format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 400 | Bad request — invalid input |
| 401 | Unauthorized — missing/invalid API key |
| 429 | Too many requests — rate limited |
| 500 | Server error — fallback may activate |
| 503 | Service unavailable — check health endpoint |

---

## OpenAPI / Swagger

When running the backend locally, access interactive API documentation:

```
http://localhost:8000/docs         # Swagger UI
http://localhost:8000/redoc        # ReDoc
```

---

## SDKs & Clients

Currently, no official SDKs are provided. Use standard HTTP clients:

### cURL Example

```bash
curl -X POST http://localhost:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userText": "Hello, how are you?"
  }'
```

### JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:8000/v1/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userText: 'Hello!' })
});

const data = await response.json();
```

---

## Changelog

See [CHANGELOG](../../CHANGELOG.md) for API changes and version history.

---

<p align="center">
  <a href="./rest-api.md">REST API Reference →</a>
</p>
