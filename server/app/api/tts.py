"""TTS 语音合成路由 — 新增模块

为前端 VoiceInteractionPanel 提供服务端 TTS 能力。
当前为预留接口，后续可接入 edge-tts / Azure TTS 等服务。
"""
from typing import Any, Dict, Optional
from fastapi import APIRouter
from pydantic import BaseModel, field_validator

router = APIRouter()


class TTSRequest(BaseModel):
    text: str
    lang: str = "zh-CN"
    voice: Optional[str] = None
    rate: float = 1.0
    pitch: float = 1.0

    @field_validator("text")
    @classmethod
    def validate_text(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("text 不能为空")
        if len(v) > 5000:
            raise ValueError("text 长度不能超过 5000 字符")
        return v.strip()


@router.post("/tts/synthesize")
async def synthesize(req: TTSRequest) -> Dict[str, Any]:
    """文本转语音（预留接口）

    当前返回提示信息，后续可接入 edge-tts / Azure TTS。
    """
    return {
        "status": "not_implemented",
        "message": "服务端 TTS 尚未配置，请使用浏览器内置 Web Speech API",
        "text_length": len(req.text),
        "lang": req.lang,
    }


@router.get("/tts/voices")
async def list_voices() -> Dict[str, Any]:
    """获取可用语音列表（预留接口）"""
    return {
        "voices": [],
        "message": "服务端 TTS 尚未配置",
    }
