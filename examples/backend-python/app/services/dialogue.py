from typing import Any, AsyncGenerator, Dict, List, Optional
import json
import logging
import random
from datetime import datetime
from urllib.parse import urlparse, urlunparse

import httpx

from app.config import get_settings
from app.stores.session_store import SessionStore, create_session_store

logger = logging.getLogger(__name__)

# 流式协议标记：LLM 先输出 replyText 纯文本，新起一行输出该标记 + meta JSON
STREAM_META_MARKER = "===META==="
_VALID_EMOTIONS = {"neutral", "happy", "surprised", "sad", "angry"}
_VALID_ACTIONS = {"idle", "wave", "greet", "think", "nod", "shakeHead", "dance", "speak"}

# 角色预设 → system prompt 映射。前端只传 characterId，后端控制 prompt（避免注入）。
CHARACTER_PROMPTS = {
  "lively-assistant": (
    "你是一个活泼、友好的虚拟数字人对话大脑，负责驱动屏幕上的数字人。"
    "必须使用简体中文、自然口语风格回答用户，语气偏轻松、积极。"
    "你需要根据用户的话尽量多地使用非 neutral 的 emotion 和非 idle 的 action，"
    "但在严肃、负面话题时要适当收敛，不要过度夸张。"
  ),
  "serious-advisor": (
    "你是一位稳重、专业的虚拟顾问。必须使用简体中文，语气克制、准确、有条理。"
    "回答要言简意赅，避免夸张表情，emotion 多用 neutral，仅在强调重点时用 surprised，"
    "负面或警示话题可用 sad/angry。action 多用 nod/think，避免 dance/wave。"
  ),
  "cute-companion": (
    "你是一个俏皮可爱的虚拟伙伴。必须使用简体中文，语气活泼、卖萌、多用语气词。"
    "尽量多用 happy/surprised 的 emotion 和 wave/greet/dance 的 action，"
    "让数字人显得灵动。但遇到严肃话题时适当收敛。"
  ),
  "pro-service": (
    "你是一位礼貌、规范的虚拟客服。必须使用简体中文，语气专业、简洁、得体。"
    "回答直接了当，不卖弄。emotion 多用 neutral，招呼时用 happy，"
    "action 多用 greet/nod，避免 dance 等娱乐性动作。"
  ),
}

DEFAULT_CHARACTER_ID = "lively-assistant"


def _get_character_prompt(character_id: Optional[str]) -> str:
  """根据 characterId 选 system prompt，未识别时回退默认。"""
  cid = (character_id or "").strip() or DEFAULT_CHARACTER_ID
  return CHARACTER_PROMPTS.get(cid, CHARACTER_PROMPTS[DEFAULT_CHARACTER_ID])


class DialogueService:
  def __init__(self) -> None:
    settings = get_settings()
    self.api_key = settings.openai_api_key
    self.model = settings.openai_model
    self.base_url = settings.openai_base_url
    self.provider = settings.llm_provider
    self.max_session_messages = settings.max_session_messages
    self.session_ttl = settings.session_ttl_seconds
    self.cleanup_interval = settings.session_cleanup_interval
    self.store: SessionStore = create_session_store(settings.redis_url)

  def _normalize_user_text(self, user_text: str) -> str:
    return (user_text or "").strip()

  def _append_turn(self, session_id: Optional[str], user_text: str, reply_text: str) -> None:
    if not session_id:
      return
    self.store.append_history(session_id, "user", user_text, datetime.now().isoformat())
    self.store.append_history(session_id, "assistant", reply_text, datetime.now().isoformat())
    self.store.append_messages(
      session_id,
      [
        {"role": "user", "content": user_text},
        {"role": "assistant", "content": reply_text},
      ],
      max_length=self.max_session_messages,
    )

  def _get_smart_mock_reply(self, user_text: str) -> Dict[str, Any]:
    """智能本地 Mock 回复，根据用户输入生成合理的响应"""
    text_lower = user_text.lower()
    
    greetings = ['你好', '您好', 'hello', 'hi', '嗨', '早上好', '下午好', '晚上好']
    if any(g in text_lower for g in greetings):
      replies = [
        ("您好！很高兴见到您，有什么可以帮助您的吗？", "happy", "wave"),
        ("你好呀！今天心情怎么样？", "happy", "greet"),
        ("嗨！欢迎来到数字人交互系统！", "happy", "wave"),
      ]
      return dict(zip(["replyText", "emotion", "action"], random.choice(replies)))
    
    if '你是谁' in user_text or '介绍' in user_text or '什么' in user_text:
      return {"replyText": "我是一个数字人助手，可以和您进行对话交流，展示各种表情和动作。", "emotion": "happy", "action": "greet"}
    if '谢谢' in user_text or '感谢' in user_text:
      return {"replyText": "不客气！能帮到您我很开心。", "emotion": "happy", "action": "nod"}
    if '再见' in user_text or '拜拜' in user_text or 'bye' in text_lower:
      return {"replyText": "再见！期待下次与您交流！", "emotion": "happy", "action": "wave"}
    if '天气' in user_text:
      return {"replyText": "今天天气看起来不错呢！", "emotion": "happy", "action": "think"}
    if '跳舞' in user_text or '舞' in user_text:
      return {"replyText": "好的，让我来给您跳一段舞！", "emotion": "happy", "action": "dance"}
    if '?' in user_text or '？' in user_text or '吗' in user_text:
      return {"replyText": "这是个好问题！让我想想...", "emotion": "neutral", "action": "think"}
    
    default_replies = [("我明白了，请继续说。", "neutral", "nod"), ("好的，我在听。", "neutral", "idle")]
    return dict(zip(["replyText", "emotion", "action"], random.choice(default_replies)))

  async def generate_reply(
    self,
    user_text: str,
    session_id: Optional[str] = None,
    meta: Optional[Dict[str, Any]] = None,
  ) -> Dict[str, Any]:
    """生成对话回复
    
    支持会话历史管理和 LLM 调用，当 API Key 未配置时使用智能 Mock 回复。
    """
    session_id = (session_id or "").strip() or None
    user_text = self._normalize_user_text(user_text)
    if not user_text:
      return {
        "replyText": "我在听，请告诉我您想聊什么。",
        "emotion": "neutral",
        "action": "idle",
      }

    self.store.cleanup_expired(self.session_ttl)

    if not self.api_key:
      logger.info("OPENAI_API_KEY 未配置，使用智能 Mock 回复")
      result = self._get_smart_mock_reply(user_text)
      self._append_turn(session_id, user_text, result["replyText"])
      return result

    character_id = (meta or {}).get("characterId") if isinstance(meta, dict) else None
    system_prompt = self._build_system_prompt(character_id)

    history_messages: list[dict[str, str]] = []
    if session_id:
      history_messages = self._get_session_messages(session_id)

    messages: list[dict[str, str]] = [
      {"role": "system", "content": system_prompt},
    ]

    # 添加会话历史
    if history_messages:
      messages.extend(history_messages)
    elif session_id:
      history = self.store.get_history(session_id)[-10:]
      for msg in history:
        if msg["role"] in ("user", "assistant"):
          messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": user_text})

    if meta:
      messages.append(
        {
          "role": "system",
          "content": f"附加上下文信息（可选）：{json.dumps(meta, ensure_ascii=False)}",
        }
      )

    try:
      data = await self._call_llm(messages)
      content = data["choices"][0]["message"]["content"]

      try:
        parsed = json.loads(content)
      except json.JSONDecodeError:
        logger.warning("LLM 返回内容不是合法 JSON，将内容作为 replyText 使用: %s", content)
        result = {
          "replyText": content,
          "emotion": "neutral",
          "action": "idle",
        }
        self._append_turn(session_id, user_text, result["replyText"])
        return result

      reply_text = str(parsed.get("replyText", "")).strip() or f"你刚才说：{user_text}"
      emotion = str(parsed.get("emotion", "neutral")).strip() or "neutral"
      action = str(parsed.get("action", "idle")).strip() or "idle"

      if emotion not in {"neutral", "happy", "surprised", "sad", "angry"}:
        emotion = "neutral"
      if action not in {"idle", "wave", "greet", "think", "nod", "shakeHead", "dance", "speak"}:
        action = "idle"

      self._append_turn(session_id, user_text, reply_text)

      return {
        "replyText": reply_text,
        "emotion": emotion,
        "action": action,
      }
    except httpx.TimeoutException:
      logger.warning(
        "LLM 请求超时 url=%s，将使用智能 Mock 回复",
        self._get_openai_chat_completions_url(),
      )
      result = self._get_smart_mock_reply(user_text)
      self._append_turn(session_id, user_text, result["replyText"])
      return result
    except httpx.HTTPStatusError as exc:
      body_preview = (exc.response.text or "")[:500]
      logger.error(
        "LLM 请求失败 status=%s url=%s body=%s，将使用智能 Mock 回复",
        exc.response.status_code,
        str(exc.request.url),
        body_preview,
      )
      result = self._get_smart_mock_reply(user_text)
      self._append_turn(session_id, user_text, result["replyText"])
      return result
    except httpx.RequestError as exc:
      req_url = str(exc.request.url) if exc.request else self._get_openai_chat_completions_url()
      logger.error(
        "LLM 请求异常 url=%s error=%s，将使用智能 Mock 回复",
        req_url,
        exc,
      )
      result = self._get_smart_mock_reply(user_text)
      self._append_turn(session_id, user_text, result["replyText"])
      return result
    except Exception as exc:
      logger.exception("调用 LLM 失败，将使用智能 Mock 回复: %s", exc)
      result = self._get_smart_mock_reply(user_text)
      self._append_turn(session_id, user_text, result["replyText"])
      return result

  def clear_session(self, session_id: str) -> bool:
    """清除指定会话的历史记录"""
    return self.store.clear(session_id)

  def get_session_history(self, session_id: str) -> List[Dict[str, str]]:
    """获取指定会话的历史记录"""
    return self.store.get_history(session_id)

  def list_sessions(self) -> List[Dict[str, Any]]:
    """列出所有活跃会话的摘要信息"""
    self.store.cleanup_expired(self.session_ttl)
    return self.store.list_sessions()

  async def generate_reply_stream(
    self,
    user_text: str,
    session_id: Optional[str] = None,
    meta: Optional[Dict[str, Any]] = None,
  ) -> AsyncGenerator[str, None]:
    """流式生成对话回复（SSE 格式）

    每个 yield 是一个 SSE data 行的 JSON 字符串。
    类型：
    - {"type": "token", "content": "..."}
    - {"type": "done", "replyText": "...", "emotion": "...", "action": "..."}
    - {"type": "error", "message": "..."}
    """
    session_id = (session_id or "").strip() or None
    user_text = self._normalize_user_text(user_text)
    if not user_text:
      yield json.dumps(
        {"type": "done", "replyText": "我在听，请告诉我您想聊什么。", "emotion": "neutral", "action": "idle"},
        ensure_ascii=False,
      )
      return

    self.store.cleanup_expired(self.session_ttl)

    if not self.api_key:
      logger.info("OPENAI_API_KEY 未配置，流式模式使用智能 Mock 回复")
      result = self._get_smart_mock_reply(user_text)
      self._append_turn(session_id, user_text, result["replyText"])
      for char in result["replyText"]:
        yield json.dumps({"type": "token", "content": char}, ensure_ascii=False)
      yield json.dumps({"type": "done", **result}, ensure_ascii=False)
      return

    system_prompt = self._build_streaming_system_prompt(
      (meta or {}).get("characterId") if isinstance(meta, dict) else None
    )
    messages = self._build_messages(session_id, user_text, meta, system_prompt)

    try:
      collected_reply = ""
      meta_text = ""
      buffer = ""
      in_meta = False

      # 真流式：直接转发 LLM token，扫描 marker 分离 replyText 和 meta
      async for chunk_text in self._call_llm_stream(messages):
        if in_meta:
          meta_text += chunk_text
          continue

        buffer += chunk_text
        safe_text, buffer, marker_found = self._split_stream_chunk(buffer)

        if safe_text:
          collected_reply += safe_text
          yield json.dumps({"type": "token", "content": safe_text}, ensure_ascii=False)

        if marker_found:
          in_meta = True
          meta_text = buffer
          buffer = ""

      # 流结束：处理剩余 buffer 和 meta
      if not in_meta:
        # LLM 未输出 marker，剩余 buffer 当 replyText
        if buffer:
          collected_reply += buffer
          yield json.dumps({"type": "token", "content": buffer}, ensure_ascii=False)
        emotion, action = "neutral", "idle"
      else:
        emotion, action = self._parse_stream_meta(meta_text)

      reply_text = collected_reply.strip() or f"你刚才说：{user_text}"
      self._append_turn(session_id, user_text, reply_text)

      yield json.dumps(
        {"type": "done", "replyText": reply_text, "emotion": emotion, "action": action},
        ensure_ascii=False,
      )

    except Exception as exc:
      logger.exception("流式 LLM 调用失败: %s", exc)
      result = self._get_smart_mock_reply(user_text)
      self._append_turn(session_id, user_text, result["replyText"])
      yield json.dumps({"type": "error", "message": str(exc)}, ensure_ascii=False)
      yield json.dumps({"type": "done", **result}, ensure_ascii=False)

  def _build_system_prompt(self, character_id: Optional[str] = None) -> str:
    character_intro = _get_character_prompt(character_id)
    return (
      character_intro
      + "请只输出一个 JSON 对象，包含三个字段："
      "replyText（字符串，给用户的自然语言回答，要友好自然），"
      "emotion（字符串，取值限定为: neutral, happy, surprised, sad, angry），"
      "action（字符串，取值限定为: idle, wave, greet, think, nod, shakeHead, dance, speak）。"
      "emotion 取值建议：正向场景多用 happy；惊喜时用 surprised；负面情绪时用 sad；严肃提醒时用 angry；普通回答用 neutral。"
      "action 取值建议：招呼告别用 greet/wave；思考用 think/nod；否定用 shakeHead；庆祝用 dance；说话用 speak；静止用 idle。"
      "严禁输出 JSON 以外的任何文字。"
    )

  def _build_streaming_system_prompt(self, character_id: Optional[str] = None) -> str:
    """流式专用 prompt：先输出 replyText 纯文本，再新起一行输出 marker + meta JSON。"""
    character_intro = _get_character_prompt(character_id)
    return (
      character_intro
      + "\n\n输出格式（严格遵守）：\n"
      "1. 先直接输出给用户的自然语言回答（replyText），就是纯文本，不要任何 JSON 或标记。\n"
      f"2. 回答结束后，新起一行输出 {STREAM_META_MARKER}，然后在同一行紧跟一个 JSON 对象："
      "{\"emotion\":\"...\",\"action\":\"...\"}\n"
      "emotion 取值限定: neutral, happy, surprised, sad, angry\n"
      "action 取值限定: idle, wave, greet, think, nod, shakeHead, dance, speak\n"
      f"严禁在 replyText 部分出现 {STREAM_META_MARKER} 字样或任何 JSON。\n"
      "示例输出：\n"
      "您好！很高兴见到您。\n"
      f"{STREAM_META_MARKER}{{\"emotion\":\"happy\",\"action\":\"wave\"}}"
    )

  def _split_stream_chunk(self, buffer: str) -> tuple:
    """从 buffer 分离可安全 yield 的文本和 marker 后的 meta。

    返回 (safe_text, remaining_buffer, marker_found)。
    - 若 buffer 含完整 marker：safe_text = marker 前内容，
      remaining_buffer = marker 后内容（meta 起始），marker_found = True。
    - 若 buffer 末尾是 marker 的前缀（marker 跨 chunk）：safe_text = 去掉前缀的部分，
      remaining_buffer = 前缀部分，marker_found = False。
    - 否则：safe_text = 全部 buffer，remaining_buffer = ""，marker_found = False。
    """
    pos = buffer.find(STREAM_META_MARKER)
    if pos != -1:
      return buffer[:pos], buffer[pos + len(STREAM_META_MARKER):], True

    # 检查末尾是否 marker 前缀（从长到短，优先 hold 住更多）
    for i in range(len(STREAM_META_MARKER) - 1, 0, -1):
      if buffer.endswith(STREAM_META_MARKER[:i]):
        return buffer[:-i], buffer[-i:], False

    return buffer, "", False

  def _parse_stream_meta(self, meta_text: str) -> tuple:
    """解析流式 meta JSON，返回 (emotion, action)，失败回退 neutral/idle。"""
    try:
      parsed = json.loads(meta_text.strip())
    except (json.JSONDecodeError, AttributeError):
      return "neutral", "idle"

    emotion = str(parsed.get("emotion", "neutral")).strip() or "neutral"
    action = str(parsed.get("action", "idle")).strip() or "idle"

    if emotion not in _VALID_EMOTIONS:
      emotion = "neutral"
    if action not in _VALID_ACTIONS:
      action = "idle"

    return emotion, action

  def _build_messages(
    self,
    session_id: Optional[str],
    user_text: str,
    meta: Optional[Dict[str, Any]],
    system_prompt: str,
  ) -> list[dict[str, str]]:
    history_messages: list[dict[str, str]] = []
    if session_id:
      history_messages = self._get_session_messages(session_id)

    messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]
    if history_messages:
      messages.extend(history_messages)
    elif session_id:
      history = self.store.get_history(session_id)[-10:]
      for msg in history:
        if msg["role"] in ("user", "assistant"):
          messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": user_text})

    if meta:
      messages.append({
        "role": "system",
        "content": f"附加上下文信息（可选）：{json.dumps(meta, ensure_ascii=False)}",
      })
    return messages

  def _parse_llm_response(self, content: str, user_text: str) -> Dict[str, Any]:
    """解析 LLM 返回的 JSON 内容，做字段校验和兜底"""
    try:
      parsed = json.loads(content)
    except json.JSONDecodeError:
      logger.warning("LLM 返回内容不是合法 JSON: %s", content[:200])
      return {"replyText": content, "emotion": "neutral", "action": "idle"}

    reply_text = str(parsed.get("replyText", "")).strip() or f"你刚才说：{user_text}"
    emotion = str(parsed.get("emotion", "neutral")).strip() or "neutral"
    action = str(parsed.get("action", "idle")).strip() or "idle"

    if emotion not in {"neutral", "happy", "surprised", "sad", "angry"}:
      emotion = "neutral"
    if action not in {"idle", "wave", "greet", "think", "nod", "shakeHead", "dance", "speak"}:
      action = "idle"

    return {"replyText": reply_text, "emotion": emotion, "action": action}

  async def _call_llm_stream(self, messages: list[dict[str, str]]) -> AsyncGenerator[str, None]:
    """流式调用 LLM，逐块 yield 文本内容"""
    url = self._get_openai_chat_completions_url()
    headers = {
      "Authorization": f"Bearer {self.api_key}",
      "Content-Type": "application/json",
    }
    payload = {
      "model": self.model,
      "messages": messages,
      "temperature": 0.7,
      "stream": True,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
      async with client.stream("POST", url, headers=headers, json=payload) as resp:
        resp.raise_for_status()
        async for line in resp.aiter_lines():
          if not line.startswith("data: "):
            continue
          data_str = line[6:].strip()
          if data_str == "[DONE]":
            break
          try:
            chunk = json.loads(data_str)
            delta = chunk.get("choices", [{}])[0].get("delta", {})
            content = delta.get("content", "")
            if content:
              yield content
          except json.JSONDecodeError:
            continue

  def _get_openai_chat_completions_url(self) -> str:
    base_url = (self.base_url or "").strip()
    if not base_url:
      return "https://api.openai.com/v1/chat/completions"

    base_url = base_url.rstrip("/")
    parsed = urlparse(base_url)
    if not parsed.scheme:
      base_url = f"https://{base_url.lstrip('/')}"
      parsed = urlparse(base_url)

    path = (parsed.path or "").rstrip("/")

    if path.endswith("/chat/completions"):
      final_path = path
    elif path.endswith("/v1/chat") or path.endswith("/chat"):
      final_path = f"{path}/completions"
    elif path.endswith("/v1"):
      final_path = f"{path}/chat/completions"
    else:
      segments = [seg for seg in path.split("/") if seg]
      if not segments:
        final_path = "/v1/chat/completions"
      elif "v1" in segments:
        final_path = f"{path}/chat/completions"
      else:
        final_path = f"{path}/v1/chat/completions"

    return urlunparse(parsed._replace(path=final_path))

  async def _call_llm(self, messages: list[dict[str, str]]) -> Dict[str, Any]:
    provider = (self.provider or "openai").lower()
    logger.debug("Calling LLM provider=%s model=%s messages=%d", provider, self.model, len(messages))

    if provider != "openai":
      logger.warning("LLM_PROVIDER=%s 未实现，暂时使用 openai 作为回退", provider)

    url = self._get_openai_chat_completions_url()
    headers = {
      "Authorization": f"Bearer {self.api_key}",
      "Content-Type": "application/json",
    }
    payload = {
      "model": self.model,
      "messages": messages,
      "temperature": 0.7,
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
      resp = await client.post(url, headers=headers, json=payload)
    resp.raise_for_status()
    return resp.json()

  def _get_session_messages(self, session_id: str) -> list[dict[str, str]]:
    return self.store.get_messages(session_id)


dialogue_service = DialogueService()
