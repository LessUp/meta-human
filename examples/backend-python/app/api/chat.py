from typing import Any, Dict, Optional

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator

from app.exceptions import ValidationError
from app.services.dialogue import dialogue_service

router = APIRouter()


class ChatRequest(BaseModel):
  sessionId: Optional[str] = None
  userText: str
  meta: Optional[Dict[str, Any]] = None

  @field_validator("userText")
  @classmethod
  def validate_user_text(cls, v: str) -> str:
    text = (v or "").strip()
    if not text:
      raise ValidationError("userText 不能为空")
    if len(text) > 5000:
      raise ValidationError("userText 超过最大长度 5000 字符")
    return text


class ChatResponse(BaseModel):
  replyText: str
  emotion: str = "neutral"
  action: str = "idle"


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
  """对话接口：输入文本，返回结构化的数字人驱动信息。

  支持 LLM 调用（配置 OPENAI_API_KEY）或 Mock 回复（未配置时自动回退）。"""
  result = await dialogue_service.generate_reply(
    user_text=req.userText,
    session_id=req.sessionId,
    meta=req.meta,
  )
  return ChatResponse(**result)


@router.post("/chat/stream")
async def chat_stream(req: ChatRequest) -> StreamingResponse:
  """流式对话接口（SSE）。

  返回 Server-Sent Events 流，每个事件为 JSON 对象：
  - {"type": "token", "content": "..."}  逐 token 推送
  - {"type": "done", "replyText": "...", "emotion": "...", "action": "..."}  完成
  - {"type": "error", "message": "..."}  错误
  """

  async def event_generator():
    async for chunk in dialogue_service.generate_reply_stream(
      user_text=req.userText,
      session_id=req.sessionId,
      meta=req.meta,
    ):
      yield f"data: {chunk}\n\n"

  return StreamingResponse(
    event_generator(),
    media_type="text/event-stream",
    headers={
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  )
