"""中间件：全局异常处理、请求速率限制、请求日志"""

import logging
import time
from collections import defaultdict
from typing import Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.config import get_settings
from app.exceptions import AppError

logger = logging.getLogger(__name__)


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """统一异常处理中间件：将 AppError 转为结构化 JSON 响应"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            response = await call_next(request)
            return response
        except AppError as exc:
            logger.warning("AppError: %s (status=%d)", exc.message, exc.status_code)
            return JSONResponse(
                status_code=exc.status_code,
                content={"error": exc.message, "detail": exc.detail},
            )
        except Exception as exc:
            logger.exception("Unhandled exception: %s", exc)
            return JSONResponse(
                status_code=500,
                content={"error": "内部服务错误", "detail": {}},
            )


class RateLimitMiddleware(BaseHTTPMiddleware):
    """简单的内存速率限制（基于 IP，滑动窗口 60s）"""

    def __init__(self, app, rpm: int | None = None) -> None:  # type: ignore[override]
        super().__init__(app)
        self.rpm = rpm or get_settings().rate_limit_rpm
        self._requests: dict[str, list[float]] = defaultdict(list)
        self._request_count = 0
        self._cleanup_interval = 1000  # 每 1000 次请求执行一次全量清理

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if self.rpm <= 0:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        window_start = now - 60.0

        # 清理窗口外的记录
        timestamps = self._requests[client_ip]
        self._requests[client_ip] = [t for t in timestamps if t > window_start]

        # 定期清理无活动 IP 键，防止内存泄漏
        self._request_count += 1
        if self._request_count >= self._cleanup_interval:
            self._request_count = 0
            stale_ips = [ip for ip, ts in self._requests.items() if not ts]
            for ip in stale_ips:
                del self._requests[ip]

        if len(self._requests[client_ip]) >= self.rpm:
            logger.warning("Rate limit exceeded for %s", client_ip)
            return JSONResponse(
                status_code=429,
                content={"error": "请求过于频繁，请稍后重试"},
                headers={"Retry-After": "60"},
            )

        self._requests[client_ip].append(now)
        return await call_next(request)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """请求日志中间件：记录方法、路径、状态码、耗时"""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start = time.time()
        response = await call_next(request)
        duration = time.time() - start
        logger.info(
            "%s %s -> %d (%.3fs)",
            request.method,
            request.url.path,
            response.status_code,
            duration,
        )
        return response


class AuthMiddleware(BaseHTTPMiddleware):
    """API Key 认证中间件：验证 X-API-Key 请求头"""

    # WebSocket 升级请求不支持自定义 header，需要豁免
    # /docs, /redoc, /openapi.json 是 FastAPI 内置文档，也应豁免
    EXEMPT_PATHS = {"/health", "/", "/ws", "/docs", "/redoc", "/openapi.json"}

    def __init__(self, app) -> None:
        super().__init__(app)
        settings = get_settings()
        self.enabled = settings.auth_enabled
        self.valid_keys = set(k.strip() for k in settings.api_keys.split(",") if k.strip()) if settings.api_keys else set()

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not self.enabled:
            return await call_next(request)
        if request.url.path in self.EXEMPT_PATHS:
            return await call_next(request)
        api_key = request.headers.get("X-API-Key")
        if not api_key:
            return JSONResponse(status_code=401, content={"error": "Missing X-API-Key header"})
        if api_key not in self.valid_keys:
            return JSONResponse(status_code=403, content={"error": "Invalid API key"})
        return await call_next(request)
