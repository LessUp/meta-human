"""TTS 语音合成服务

支持两种 provider：
- edge: 使用 edge-tts（微软 Edge 免费 TTS，无需 API Key）
- openai: 使用 OpenAI TTS API（需要 OPENAI_API_KEY）
"""

import io
import logging
from typing import Optional

import httpx

from app.config import get_settings
from app.exceptions import TTSError

logger = logging.getLogger(__name__)


class TTSService:
    def __init__(self) -> None:
        self._settings = get_settings()

    @property
    def provider(self) -> str:
        return self._settings.tts_provider

    @property
    def available(self) -> bool:
        if self.provider == "openai":
            return self._settings.has_openai_key
        return True  # edge-tts 不需要 key

    async def synthesize(
        self,
        text: str,
        voice: Optional[str] = None,
        rate: Optional[str] = None,
        output_format: str = "mp3",
    ) -> bytes:
        """将文本合成为音频，返回音频字节数据"""
        text = (text or "").strip()
        if not text:
            raise TTSError("合成文本不能为空")

        provider = self.provider
        if provider == "openai":
            return await self._synthesize_openai(text, voice, output_format)
        elif provider == "edge":
            return await self._synthesize_edge(text, voice, rate)
        else:
            raise TTSError(f"不支持的 TTS provider: {provider}")

    async def _synthesize_edge(
        self,
        text: str,
        voice: Optional[str] = None,
        rate: Optional[str] = None,
    ) -> bytes:
        """使用 edge-tts 合成语音"""
        try:
            import edge_tts
        except ImportError:
            raise TTSError(
                "edge-tts 未安装，请执行 pip install edge-tts",
                detail={"provider": "edge", "fix": "pip install edge-tts"},
            )

        voice = voice or self._settings.tts_voice
        rate = rate or self._settings.tts_rate

        try:
            communicate = edge_tts.Communicate(text, voice=voice, rate=rate)
            audio_buffer = io.BytesIO()
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_buffer.write(chunk["data"])

            audio_data = audio_buffer.getvalue()
            if not audio_data:
                raise TTSError("语音合成结果为空")

            logger.info("Edge TTS 合成成功: %d bytes, voice=%s", len(audio_data), voice)
            return audio_data
        except TTSError:
            raise
        except Exception as exc:
            logger.exception("Edge TTS 合成失败: %s", exc)
            raise TTSError(f"语音合成失败: {exc}")

    async def _synthesize_openai(
        self,
        text: str,
        voice: Optional[str] = None,
        output_format: str = "mp3",
    ) -> bytes:
        """使用 OpenAI TTS API 合成语音"""
        if not self._settings.has_openai_key:
            raise TTSError("OpenAI TTS 需要配置 OPENAI_API_KEY")

        voice = voice or "alloy"
        base_url = self._settings.openai_base_url.rstrip("/")
        url = f"{base_url}/audio/speech"

        headers = {
            "Authorization": f"Bearer {self._settings.openai_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": "tts-1",
            "input": text,
            "voice": voice,
            "response_format": output_format,
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            audio_data = resp.content
            logger.info("OpenAI TTS 合成成功: %d bytes, voice=%s", len(audio_data), voice)
            return audio_data
        except httpx.TimeoutException:
            raise TTSError("OpenAI TTS 请求超时")
        except httpx.HTTPStatusError as exc:
            raise TTSError(
                f"OpenAI TTS 请求失败: HTTP {exc.response.status_code}",
                detail={"status": exc.response.status_code, "body": exc.response.text[:500]},
            )
        except Exception as exc:
            logger.exception("OpenAI TTS 调用异常: %s", exc)
            raise TTSError(f"语音合成失败: {exc}")

    async def list_voices(self) -> list[dict[str, str]]:
        """获取可用的语音列表"""
        if self.provider == "edge":
            return await self._list_edge_voices()
        elif self.provider == "openai":
            return self._list_openai_voices()
        return []

    async def _list_edge_voices(self) -> list[dict[str, str]]:
        try:
            import edge_tts
            voices = await edge_tts.list_voices()
            return [
                {
                    "id": v["ShortName"],
                    "name": v.get("FriendlyName", v["ShortName"]),
                    "locale": v.get("Locale", ""),
                    "gender": v.get("Gender", ""),
                }
                for v in voices
            ]
        except ImportError:
            return []
        except Exception as exc:
            logger.warning("获取 Edge 语音列表失败: %s", exc)
            return []

    @staticmethod
    def _list_openai_voices() -> list[dict[str, str]]:
        return [
            {"id": "alloy", "name": "Alloy", "locale": "en", "gender": "neutral"},
            {"id": "echo", "name": "Echo", "locale": "en", "gender": "male"},
            {"id": "fable", "name": "Fable", "locale": "en", "gender": "male"},
            {"id": "onyx", "name": "Onyx", "locale": "en", "gender": "male"},
            {"id": "nova", "name": "Nova", "locale": "en", "gender": "female"},
            {"id": "shimmer", "name": "Shimmer", "locale": "en", "gender": "female"},
        ]


tts_service = TTSService()
