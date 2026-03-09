"""中间件 — 请求日志 + 速率限制"""
import logging
import time
from collections import defaultdict
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start = time.time()
        response = await call_next(request)
        elapsed_ms = (time.time() - start) * 1000
        if request.url.path not in ("/health", "/"):
            logger.info("%s %s -> %d (%.1fms)", request.method, request.url.path, response.status_code, elapsed_ms)
        return response


class SimpleRateLimiter(BaseHTTPMiddleware):
    def __init__(self, app, max_requests: int = 60, window_seconds: int = 60) -> None:
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._requests: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.url.path in ("/health", "/"):
            return await call_next(request)
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        self._requests[client_ip] = [t for t in self._requests[client_ip] if now - t < self.window_seconds]
        if len(self._requests[client_ip]) >= self.max_requests:
            return Response(content='{"error":"RATE_LIMITED","message":"请求过于频繁"}', status_code=429, media_type="application/json")
        self._requests[client_ip].append(now)
        return await call_next(request)
