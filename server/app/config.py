"""集中配置管理模块"""

import os
import logging
from dataclasses import dataclass
from functools import lru_cache


@dataclass(frozen=True)
class Settings:
    # LLM
    openai_api_key: str = ""
    openai_model: str = "gpt-3.5-turbo"
    openai_base_url: str = "https://api.openai.com/v1"
    llm_provider: str = "openai"
    llm_timeout: float = 20.0
    llm_stream_timeout: float = 60.0

    # TTS
    tts_provider: str = "edge"  # edge | openai
    tts_voice: str = "zh-CN-XiaoxiaoNeural"
    tts_rate: str = "+0%"

    # ASR
    asr_provider: str = "whisper"  # whisper | local
    asr_model: str = "whisper-1"
    asr_language: str = "zh"

    # Session
    max_history_length: int = 20
    max_session_messages: int = 10
    session_ttl_seconds: int = 1800
    session_cleanup_interval: int = 300

    # Rate limit
    rate_limit_rpm: int = 60

    # Auth
    auth_enabled: bool = False
    api_keys: str = ""

    # Redis
    redis_url: str = ""

    # CORS
    cors_allow_origins: str = ""

    @property
    def has_openai_key(self) -> bool:
        return bool(self.openai_api_key)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    def _int(key: str, default: int) -> int:
        try:
            return int(os.getenv(key, str(default)))
        except ValueError:
            return default

    def _float(key: str, default: float) -> float:
        try:
            return float(os.getenv(key, str(default)))
        except ValueError:
            return default

    return Settings(
        openai_api_key=os.getenv("OPENAI_API_KEY", ""),
        openai_model=os.getenv("OPENAI_MODEL", "gpt-3.5-turbo"),
        openai_base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
        llm_provider=os.getenv("LLM_PROVIDER", "openai").lower(),
        llm_timeout=_float("LLM_TIMEOUT", 20.0),
        llm_stream_timeout=_float("LLM_STREAM_TIMEOUT", 60.0),
        tts_provider=os.getenv("TTS_PROVIDER", "edge").lower(),
        tts_voice=os.getenv("TTS_VOICE", "zh-CN-XiaoxiaoNeural"),
        tts_rate=os.getenv("TTS_RATE", "+0%"),
        asr_provider=os.getenv("ASR_PROVIDER", "whisper").lower(),
        asr_model=os.getenv("ASR_MODEL", "whisper-1"),
        asr_language=os.getenv("ASR_LANGUAGE", "zh"),
        max_history_length=_int("DIALOGUE_MAX_HISTORY_LENGTH", 20),
        max_session_messages=_int("DIALOGUE_MAX_SESSION_MESSAGES", 10),
        session_ttl_seconds=_int("SESSION_TTL_SECONDS", 1800),
        session_cleanup_interval=_int("SESSION_CLEANUP_INTERVAL", 300),
        rate_limit_rpm=_int("RATE_LIMIT_RPM", 60),
        auth_enabled=os.getenv("AUTH_ENABLED", "false").lower() in ("true", "1", "yes"),
        api_keys=os.getenv("API_KEYS", ""),
        redis_url=os.getenv("REDIS_URL", ""),
        cors_allow_origins=os.getenv("CORS_ALLOW_ORIGINS", ""),
    )


def setup_logging() -> None:
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    logging.basicConfig(
        level=getattr(logging, log_level, logging.INFO),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
