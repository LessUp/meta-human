"""MetaHuman 后端服务 — 模块化入口

参考 AIRI app.ts 的模块化注册设计：
  - config.py    → 集中配置管理
  - errors.py    → 统一错误体系
  - middleware.py → 请求日志 + 速率限制
  - api/         → 路由层（chat, health, tts）
  - services/    → 业务层（dialogue → session + llm + mock）
"""
import logging
import os
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import load_config
from app.middleware import RequestLoggingMiddleware, SimpleRateLimiter
from app.api.chat import router as chat_router
from app.api.health import router as health_router
from app.api.tts import router as tts_router
from app.services.dialogue import dialogue_service

# 加载配置
config = load_config()

# 日志配置
logging.basicConfig(
    level=getattr(logging, config.log_level, logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """应用生命周期管理"""
    logger.info("MetaHuman 后端服务启动中...")
    await dialogue_service.startup()
    logger.info("MetaHuman 后端服务已就绪 (v%s)", config.version)
    yield
    logger.info("MetaHuman 后端服务关闭中...")
    await dialogue_service.shutdown()
    logger.info("MetaHuman 后端服务已关闭")


app = FastAPI(
    title="Digital Human Service",
    description="MetaHuman 数字人后端服务",
    version=config.version,
    lifespan=lifespan,
)

# 中间件注册（顺序：外→内）
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.cors.allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(SimpleRateLimiter, max_requests=60, window_seconds=60)

# 路由注册
app.include_router(health_router)
app.include_router(chat_router, prefix="/v1")
app.include_router(tts_router, prefix="/v1")
