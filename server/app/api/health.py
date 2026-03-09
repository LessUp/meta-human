"""健康检查路由 — 从 main.py 提取为独立模块"""
import os
import time
from typing import Any, Dict

from fastapi import APIRouter

router = APIRouter()

START_TIME = time.time()


@router.get("/health")
async def health() -> Dict[str, Any]:
    """健康检查接口"""
    uptime = time.time() - START_TIME
    has_openai_key = bool(os.getenv("OPENAI_API_KEY"))
    return {
        "status": "ok",
        "uptime_seconds": round(uptime, 2),
        "version": "1.1.0",
        "services": {
            "chat": "available",
            "llm": "available" if has_openai_key else "mock_mode",
        },
    }


@router.get("/")
async def root() -> Dict[str, Any]:
    """根路径"""
    return {
        "service": "MetaHuman Digital Human Service",
        "version": "1.1.0",
        "docs": "/docs",
        "health": "/health",
    }
