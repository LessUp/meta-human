import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings, setup_logging
from app.api.chat import router as chat_router
from app.api.session import router as session_router
from app.api.speech import router as speech_router
from app.api.ws import router as ws_router
from app.middleware import AuthMiddleware, ErrorHandlerMiddleware, RateLimitMiddleware, RequestLoggingMiddleware

# 初始化日志
setup_logging()

# 记录服务启动时间
START_TIME = time.time()

settings = get_settings()

app = FastAPI(
    title="Digital Human Service",
    description="MetaHuman 数字人后端服务 — 对话、语音合成、语音识别、会话管理",
    version="1.0.0",
)

# --- 中间件（注册顺序：后注册的先执行）---

# CORS 配置 - 允许前端跨域访问
if settings.cors_allow_origins:
    allowed_origins = [o.strip() for o in settings.cors_allow_origins.split(",") if o.strip()]
else:
    allowed_origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://lessup.github.io",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(ErrorHandlerMiddleware)
app.add_middleware(RateLimitMiddleware, rpm=settings.rate_limit_rpm)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(AuthMiddleware)


# --- 路由 ---

@app.get("/health")
async def health() -> dict:
    """健康检查接口，用于确认后端服务是否正常运行。"""
    from app.services.tts import tts_service
    from app.services.asr import asr_service

    uptime = time.time() - START_TIME

    return {
        "status": "ok",
        "uptime_seconds": round(uptime, 2),
        "version": "1.0.0",
        "services": {
            "chat": "available",
            "llm": "available" if settings.has_openai_key else "mock_mode",
            "tts": "available" if tts_service.available else "unavailable",
            "asr": "available" if asr_service.available else "unavailable",
        },
    }


@app.get("/")
async def root() -> dict:
    """根路径，返回服务基本信息。"""
    return {
        "service": "MetaHuman Digital Human Service",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "chat": "/v1/chat",
            "chat_stream": "/v1/chat/stream",
            "tts": "/v1/tts",
            "asr": "/v1/asr",
            "sessions": "/v1/sessions",
        },
    }


app.include_router(chat_router, prefix="/v1", tags=["对话"])
app.include_router(session_router, prefix="/v1", tags=["会话管理"])
app.include_router(speech_router, prefix="/v1", tags=["语音"])
app.include_router(ws_router, tags=["WebSocket"])
