"""统一异常定义"""

from typing import Any, Dict, Optional


class AppError(Exception):
    """应用基础异常"""

    def __init__(
        self,
        message: str = "内部服务错误",
        status_code: int = 500,
        detail: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.detail = detail or {}


class ValidationError(AppError):
    """请求参数校验失败"""

    def __init__(self, message: str = "请求参数无效", detail: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message=message, status_code=400, detail=detail)


class NotFoundError(AppError):
    """资源不存在"""

    def __init__(self, message: str = "资源不存在") -> None:
        super().__init__(message=message, status_code=404)


class RateLimitError(AppError):
    """请求频率超限"""

    def __init__(self, message: str = "请求过于频繁，请稍后重试") -> None:
        super().__init__(message=message, status_code=429)


class LLMError(AppError):
    """LLM 调用失败"""

    def __init__(self, message: str = "LLM 服务不可用", detail: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message=message, status_code=502, detail=detail)


class TTSError(AppError):
    """TTS 服务失败"""

    def __init__(self, message: str = "语音合成失败", detail: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message=message, status_code=502, detail=detail)


class ASRError(AppError):
    """ASR 服务失败"""

    def __init__(self, message: str = "语音识别失败", detail: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(message=message, status_code=502, detail=detail)
