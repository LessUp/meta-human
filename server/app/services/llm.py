"""LLM 调用服务 — 从 dialogue.py 提取

职责：OpenAI 兼容 API 调用、URL 构建、响应解析。
"""
import json
import logging
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse, urlunparse

import httpx

from app.config import LLMConfig

logger = logging.getLogger(__name__)

# 合法的情感和动作取值
VALID_EMOTIONS = {"neutral", "happy", "surprised", "sad", "angry"}
VALID_ACTIONS = {"idle", "wave", "greet", "think", "nod", "shakeHead", "dance", "speak"}

# 系统提示词
SYSTEM_PROMPT = (
    "你是一个活泼、友好的虚拟数字人对话大脑，负责驱动屏幕上的数字人。"
    "必须使用简体中文、自然口语风格回答用户，语气偏轻松、积极。"
    "你需要根据用户的话尽量多地使用非 neutral 的 emotion 和非 idle 的 action，"
    "但在严肃、负面话题时要适当收敛，不要过度夸张。"
    "请只输出一个 JSON 对象，包含三个字段："
    "replyText（字符串，给用户的自然语言回答，要友好自然），"
    "emotion（字符串，取值限定为: neutral, happy, surprised, sad, angry），"
    "action（字符串，取值限定为: idle, wave, greet, think, nod, shakeHead, dance, speak）。"
    "emotion 取值建议：正向场景多用 happy；惊喜时用 surprised；负面情绪时用 sad；"
    "严肃提醒时用 angry；普通回答用 neutral。"
    "action 取值建议：招呼告别用 greet/wave；思考用 think/nod；否定用 shakeHead；"
    "庆祝用 dance；说话用 speak；静止用 idle。"
    "严禁输出 JSON 以外的任何文字。"
)


class LLMService:
    """LLM API 调用服务"""

    def __init__(self, config: LLMConfig) -> None:
        self.config = config
        self._http_client: Optional[httpx.AsyncClient] = None

    async def startup(self) -> None:
        self._http_client = httpx.AsyncClient(timeout=float(self.config.timeout_seconds))
        logger.info("LLM 服务已初始化: provider=%s model=%s", self.config.provider, self.config.model)

    async def shutdown(self) -> None:
        if self._http_client:
            await self._http_client.aclose()
            self._http_client = None
        logger.info("LLM 服务已关闭")

    @property
    def is_available(self) -> bool:
        return self.config.is_available

    async def call(self, messages: List[Dict[str, str]]) -> Dict[str, Any]:
        """调用 LLM API，返回原始响应 JSON"""
        provider = (self.config.provider or "openai").lower()
        logger.debug("调用 LLM provider=%s model=%s messages=%d", provider, self.config.model, len(messages))

        if provider != "openai":
            logger.warning("LLM_PROVIDER=%s 未实现，回退到 openai", provider)

        url = self._build_url()
        headers = {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.config.model,
            "messages": messages,
            "temperature": 0.7,
        }

        client = self._http_client or httpx.AsyncClient(timeout=float(self.config.timeout_seconds))
        resp = await client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        return resp.json()

    def build_messages(
        self,
        user_text: str,
        context: Optional[List[Dict[str, str]]] = None,
        meta: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, str]]:
        """构建 LLM 消息列表"""
        messages: List[Dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT}]

        if context:
            messages.extend(context)

        # 附加元数据（放在 user 消息之前）
        if meta:
            messages.append({
                "role": "system",
                "content": f"附加上下文信息：{json.dumps(meta, ensure_ascii=False)}",
            })

        messages.append({"role": "user", "content": user_text})
        return messages

    @staticmethod
    def parse_response(content: str, user_text: str) -> Dict[str, Any]:
        """解析 LLM 返回的 JSON，做合法性校验"""
        try:
            parsed = json.loads(content)
        except json.JSONDecodeError:
            logger.warning("LLM 返回非法 JSON: %s", content[:200])
            return {"replyText": content, "emotion": "neutral", "action": "idle"}

        reply_text = str(parsed.get("replyText", "")).strip() or f"你刚才说：{user_text}"
        emotion = str(parsed.get("emotion", "neutral")).strip()
        action = str(parsed.get("action", "idle")).strip()

        if emotion not in VALID_EMOTIONS:
            emotion = "neutral"
        if action not in VALID_ACTIONS:
            action = "idle"

        return {"replyText": reply_text, "emotion": emotion, "action": action}

    def _build_url(self) -> str:
        """根据 base_url 拼接完整的 chat/completions 端点"""
        base_url = (self.config.base_url or "").strip()
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
