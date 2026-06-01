from typing import Any, Dict, List, Optional

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator, model_validator

from app.exceptions import ValidationError
from app.services.dialogue import dialogue_service

router = APIRouter()


class ChatMessage(BaseModel):
  role: str
  content: str

  @field_validator("role")
  @classmethod
  def validate_role(cls, value: str) -> str:
    role = (value or "").strip().lower()
    if role not in {"system", "user", "assistant"}:
      raise ValidationError("messages.role 必须为 system/user/assistant")
    return role

  @field_validator("content")
  @classmethod
  def validate_content(cls, value: str) -> str:
    content = (value or "").strip()
    if not content:
      raise ValidationError("messages.content 不能为空")
    return content


class ChatRequest(BaseModel):
  sessionId: Optional[str] = None
  userText: Optional[str] = None
  meta: Optional[Dict[str, Any]] = None
  metadata: Optional[Dict[str, Any]] = None
  context: Optional[Dict[str, Any]] = None
  messages: Optional[List[ChatMessage]] = None

  @field_validator("userText")
  @classmethod
  def normalize_user_text(cls, value: Optional[str]) -> Optional[str]:
    if value is None:
      return None
    text = value.strip()
    return text or None

  @model_validator(mode="after")
  def validate_payload(self) -> "ChatRequest":
    resolved_user_text = self.resolve_user_text()
    if not resolved_user_text:
      raise ValidationError("userText 不能为空")
    if len(resolved_user_text) > 5000:
      raise ValidationError("userText 超过最大长度 5000 字符")
    self.userText = resolved_user_text
    return self

  def resolve_user_text(self) -> str:
    if self.userText:
      return self.userText.strip()

    if self.messages:
      for message in reversed(self.messages):
        if message.role == "user":
          content = message.content.strip()
          if content:
            return content

    return ""

  def resolve_meta(self) -> Optional[Dict[str, Any]]:
    merged: Dict[str, Any] = {}
    if self.meta:
      merged.update(self.meta)
    if self.metadata:
      merged.update(self.metadata)
    if self.context:
      merged["context"] = self.context
    if not merged:
      return None
    return merged


class ChatResponse(BaseModel):
  replyText: str
  emotion: str = "neutral"
  action: str = "idle"


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
  """对话接口：输入文本，返回结构化的数字人驱动信息。

  支持 LLM 调用（配置 OPENAI_API_KEY）或 Mock 回复（未配置时自动回退）。"""
  result = await dialogue_service.generate_reply(
    user_text=req.resolve_user_text(),
    session_id=req.sessionId,
    meta=req.resolve_meta(),
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
      user_text=req.resolve_user_text(),
      session_id=req.sessionId,
      meta=req.resolve_meta(),
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
