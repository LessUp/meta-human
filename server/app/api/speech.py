"""语音服务 API 路由（TTS + ASR）"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel

from app.services.tts import tts_service
from app.services.asr import asr_service
from app.exceptions import ValidationError

router = APIRouter()


# --- TTS ---

class TTSRequest(BaseModel):
    text: str
    voice: Optional[str] = None
    rate: Optional[str] = None
    format: str = "mp3"


@router.post("/tts")
async def text_to_speech(req: TTSRequest) -> Response:
    """文字转语音，返回音频字节流"""
    text = (req.text or "").strip()
    if not text:
        raise ValidationError("text 不能为空")
    if len(text) > 5000:
        raise ValidationError("text 超过最大长度 5000 字符")

    audio_data = await tts_service.synthesize(
        text=text,
        voice=req.voice,
        rate=req.rate,
        output_format=req.format,
    )

    content_type_map = {
        "mp3": "audio/mpeg",
        "opus": "audio/opus",
        "aac": "audio/aac",
        "flac": "audio/flac",
        "wav": "audio/wav",
    }
    content_type = content_type_map.get(req.format, "audio/mpeg")

    return Response(
        content=audio_data,
        media_type=content_type,
        headers={
            "Content-Disposition": f'inline; filename="speech.{req.format}"',
        },
    )


@router.get("/tts/voices")
async def list_tts_voices() -> Dict[str, Any]:
    """获取可用的 TTS 语音列表"""
    voices = await tts_service.list_voices()
    return {
        "provider": tts_service.provider,
        "available": tts_service.available,
        "voices": voices,
    }


# --- ASR ---

@router.post("/asr")
async def speech_to_text(
    file: UploadFile = File(..., description="音频文件"),
    language: Optional[str] = Form(None, description="语言代码，如 zh、en"),
) -> Dict[str, Any]:
    """语音识别，上传音频文件返回识别文本"""
    if not file.filename:
        raise ValidationError("请上传音频文件")

    audio_data = await file.read()
    if not audio_data:
        raise ValidationError("音频文件为空")

    result = await asr_service.transcribe(
        audio_data=audio_data,
        filename=file.filename or "audio.wav",
        language=language,
        content_type=file.content_type or "audio/wav",
    )
    return result


@router.get("/asr/status")
async def asr_status() -> Dict[str, Any]:
    """获取 ASR 服务状态"""
    return {
        "provider": asr_service.provider,
        "available": asr_service.available,
    }
