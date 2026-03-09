"""环境变量配置管理 — 参考 AIRI env.ts 的 schema 验证模式

集中管理所有环境变量，启动时验证必要配置。
"""
import os
import logging
from dataclasses import dataclass, field
from typing import List, Optional

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class LLMConfig:
    """LLM 服务配置"""
    api_key: Optional[str] = None
    model: str = "gpt-3.5-turbo"
    base_url: str = "https://api.openai.com/v1"
    provider: str = "openai"
    timeout_seconds: int = 30

    @property
    def is_available(self) -> bool:
        return bool(self.api_key)


@dataclass(frozen=True)
class SessionConfig:
    """会话配置"""
    max_messages: int = 20
    ttl_seconds: int = 3600


@dataclass(frozen=True)
class CORSConfig:
    """CORS 配置"""
    allow_origins: List[str] = field(default_factory=lambda: [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ])


@dataclass(frozen=True)
class AppConfig:
    """应用总配置"""
    llm: LLMConfig
    session: SessionConfig
    cors: CORSConfig
    log_level: str = "INFO"
    version: str = "1.1.0"


def load_config() -> AppConfig:
    """从环境变量加载并验证配置

    所有配置项均有合理默认值，API Key 未配置时自动降级为 Mock 模式。
    """
    # 尝试加载 .env
    try:
        from dotenv import load_dotenv
        env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
        if os.path.exists(env_path):
            load_dotenv(env_path)
            logger.info("已加载环境变量: %s", env_path)
    except ImportError:
        pass

    # CORS 配置
    origins_env = os.getenv("CORS_ALLOW_ORIGINS", "")
    if origins_env:
        cors_origins = [o.strip() for o in origins_env.split(",") if o.strip()]
    else:
        cors_origins = CORSConfig().allow_origins

    # LLM 配置
    llm = LLMConfig(
        api_key=os.getenv("OPENAI_API_KEY") or None,
        model=os.getenv("OPENAI_MODEL", "gpt-3.5-turbo"),
        base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
        provider=os.getenv("LLM_PROVIDER", "openai"),
        timeout_seconds=int(os.getenv("LLM_TIMEOUT_SECONDS", "30")),
    )

    # 会话配置
    session = SessionConfig(
        max_messages=int(os.getenv("DIALOGUE_MAX_SESSION_MESSAGES", "20")),
        ttl_seconds=int(os.getenv("SESSION_TTL_SECONDS", "3600")),
    )

    config = AppConfig(
        llm=llm,
        session=session,
        cors=CORSConfig(allow_origins=cors_origins),
        log_level=os.getenv("LOG_LEVEL", "INFO").upper(),
    )

    # 日志输出配置摘要
    logger.info(
        "配置加载完成: LLM=%s model=%s mock=%s session_ttl=%ds",
        llm.provider, llm.model, not llm.is_available, session.ttl_seconds,
    )

    return config
