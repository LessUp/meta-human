import logging
import os
import time
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.chat import router as chat_router
from app.services.dialogue import dialogue_service

# ------------------------------------------------------------------
# 日志配置
# ------------------------------------------------------------------
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# 记录服务启动时间
START_TIME = time.time()


# ------------------------------------------------------------------
# FastAPI lifespan（替代已废弃的 on_event）
# ------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """应用生命周期管理：启动时初始化资源，关闭时释放资源"""
    logger.info("MetaHuman 后端服务启动中...")
    await dialogue_service.startup()
    logger.info("MetaHuman 后端服务已就绪")
    yield
    logger.info("MetaHuman 后端服务关闭中...")
    await dialogue_service.shutdown()
    logger.info("MetaHuman 后端服务已关闭")


app = FastAPI(
    title="Digital Human Service",
    description="MetaHuman 数字人后端服务",
    version="1.0.0",
    lifespan=lifespan,
)

# ------------------------------------------------------------------
# CORS 配置 - 允许前端跨域访问
# ------------------------------------------------------------------
origins_env = os.getenv("CORS_ALLOW_ORIGINS", "")
if origins_env:
    allowed_origins = [origin.strip() for origin in origins_env.split(",") if origin.strip()]
else:
    allowed_origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------------------------------------------
# 基础端点
# ------------------------------------------------------------------
@app.get("/health")
async def health() -> dict:
    """健康检查接口，用于确认后端服务是否正常运行。"""
    uptime = time.time() - START_TIME
    has_openai_key = bool(os.getenv("OPENAI_API_KEY"))

    return {
        "status": "ok",
        "uptime_seconds": round(uptime, 2),
        "version": "1.0.0",
        "services": {
            "chat": "available",
            "llm": "available" if has_openai_key else "mock_mode",
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
    }


app.include_router(chat_router, prefix="/v1")
