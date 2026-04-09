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

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if self.rpm <= 0:
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        window_start = now - 60.0

        # 清理窗口外的记录
        timestamps = self._requests[client_ip]
        self._requests[client_ip] = [t for t in timestamps if t > window_start]

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
