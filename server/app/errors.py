"""统一错误体系 — 参考 AIRI utils/error.ts 的 ApiError 模式

提供结构化错误类和工厂函数，替代散落的 HTTPException。
"""
from typing import Any, Optional

from fastapi import HTTPException


class ApiError(HTTPException):
    """结构化 API 错误，包含错误码和详情"""

    def __init__(
        self,
        status_code: int,
        error_code: str,
        message: str,
        details: Optional[Any] = None,
    ) -> None:
        self.error_code = error_code
        self.details = details
        super().__init__(
            status_code=status_code,
            detail={
                "error": error_code,
                "message": message,
                "details": details,
            },
        )


# 工厂函数

def bad_request(message: str, error_code: str = "BAD_REQUEST", details: Any = None) -> ApiError:
    return ApiError(400, error_code, message, details)


def unauthorized(message: str = "未授权", details: Any = None) -> ApiError:
    return ApiError(401, "UNAUTHORIZED", message, details)


def not_found(message: str = "资源不存在", details: Any = None) -> ApiError:
    return ApiError(404, "NOT_FOUND", message, details)


def rate_limited(message: str = "请求过于频繁，请稍后重试", details: Any = None) -> ApiError:
    return ApiError(429, "RATE_LIMITED", message, details)


def internal_error(message: str = "服务暂时不可用，请稍后重试", details: Any = None) -> ApiError:
    return ApiError(500, "INTERNAL_ERROR", message, details)
