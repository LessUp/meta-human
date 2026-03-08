from typing import Any, Dict, List, Optional
import json
import logging
import os
import random
import time
from datetime import datetime
from urllib.parse import urlparse, urlunparse

import httpx


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


class SessionManager:
    """统一的会话历史管理器，支持 TTL 过期清理"""

    def __init__(
        self,
        max_messages: int = 20,
        session_ttl_seconds: int = 3600,
    ) -> None:
        self._histories: Dict[str, List[Dict[str, str]]] = {}
        self._last_access: Dict[str, float] = {}
        self.max_messages = max_messages
        self.session_ttl = session_ttl_seconds

    def append(self, session_id: str, role: str, content: str) -> None:
        """添加一条消息到会话历史"""
        self._cleanup_expired()
        if session_id not in self._histories:
            self._histories[session_id] = []
        self._histories[session_id].append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat(),
        })
        # 超出限制时裁剪（保留最近的消息）
        max_len = self.max_messages * 2  # 每轮含 user + assistant
        if len(self._histories[session_id]) > max_len:
            self._histories[session_id] = self._histories[session_id][-max_len:]
        self._last_access[session_id] = time.monotonic()

    def get_history(self, session_id: str) -> List[Dict[str, str]]:
        """获取指定会话的完整历史记录"""
        self._last_access[session_id] = time.monotonic()
        return self._histories.get(session_id, [])

    def get_context_messages(
        self,
        session_id: str,
        limit: int = 10,
    ) -> List[Dict[str, str]]:
        """获取用于发送给 LLM 的上下文消息（仅含 role 和 content）"""
        history = self.get_history(session_id)
        recent = history[-limit:]
        return [
            {"role": msg["role"], "content": msg["content"]}
            for msg in recent
            if msg["role"] in ("user", "assistant")
        ]

    def clear(self, session_id: str) -> bool:
        """清除指定会话的历史记录"""
        existed = session_id in self._histories
        self._histories.pop(session_id, None)
        self._last_access.pop(session_id, None)
        return existed

    def _cleanup_expired(self) -> None:
        """清理超过 TTL 的过期会话"""
        now = time.monotonic()
        expired = [
            sid
            for sid, last in self._last_access.items()
            if now - last > self.session_ttl
        ]
        for sid in expired:
            self._histories.pop(sid, None)
            self._last_access.pop(sid, None)
        if expired:
            logger.info("已清理 %d 个过期会话", len(expired))


class DialogueService:
    """对话服务：管理 LLM 调用和 Mock 回复"""

    def __init__(self) -> None:
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.model = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
        self.base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        self.provider = os.getenv("LLM_PROVIDER", "openai").lower()
        self._http_client: Optional[httpx.AsyncClient] = None

        try:
            max_msgs = int(os.getenv("DIALOGUE_MAX_SESSION_MESSAGES", "20"))
        except ValueError:
            max_msgs = 20
        try:
            ttl = int(os.getenv("SESSION_TTL_SECONDS", "3600"))
        except ValueError:
            ttl = 3600

        self.sessions = SessionManager(
            max_messages=max_msgs,
            session_ttl_seconds=ttl,
        )

    # ------------------------------------------------------------------
    # 生命周期管理（由 FastAPI lifespan 调用）
    # ------------------------------------------------------------------

    async def startup(self) -> None:
        """初始化持久化 HTTP 客户端"""
        timeout = float(os.getenv("LLM_TIMEOUT_SECONDS", "30"))
        self._http_client = httpx.AsyncClient(timeout=timeout)
        logger.info("DialogueService 已启动，LLM 超时设置: %.1fs", timeout)

    async def shutdown(self) -> None:
        """关闭 HTTP 客户端，释放连接资源"""
        if self._http_client:
            await self._http_client.aclose()
            self._http_client = None
        logger.info("DialogueService 已关闭")

    # ------------------------------------------------------------------
    # Mock 回复
    # ------------------------------------------------------------------

    def _get_smart_mock_reply(self, user_text: str) -> Dict[str, Any]:
        """智能本地 Mock 回复，根据用户输入生成合理的响应"""
        text_lower = user_text.lower()

        greetings = ["你好", "您好", "hello", "hi", "嗨", "早上好", "下午好", "晚上好"]
        if any(g in text_lower for g in greetings):
            replies = [
                ("您好！很高兴见到您，有什么可以帮助您的吗？", "happy", "wave"),
                ("你好呀！今天心情怎么样？", "happy", "greet"),
                ("嗨！欢迎来到数字人交互系统！", "happy", "wave"),
            ]
            r = random.choice(replies)
            return {"replyText": r[0], "emotion": r[1], "action": r[2]}

        # 关键词匹配规则
        rules = [
            (["你是谁", "介绍", "什么"],
             "我是一个数字人助手，可以和您进行对话交流，展示各种表情和动作。", "happy", "greet"),
            (["谢谢", "感谢"],
             "不客气！能帮到您我很开心。", "happy", "nod"),
            (["再见", "拜拜", "bye"],
             "再见！期待下次与您交流！", "happy", "wave"),
            (["天气"],
             "今天天气看起来不错呢！", "happy", "think"),
            (["跳舞", "舞"],
             "好的，让我来给您跳一段舞！", "happy", "dance"),
        ]
        for keywords, reply, emotion, action in rules:
            if any(kw in text_lower for kw in keywords):
                return {"replyText": reply, "emotion": emotion, "action": action}

        # 疑问句
        if "?" in user_text or "？" in user_text or "吗" in user_text:
            return {"replyText": "这是个好问题！让我想想...", "emotion": "neutral", "action": "think"}

        # 默认回复
        default_replies = [
            ("我明白了，请继续说。", "neutral", "nod"),
            ("好的，我在听。", "neutral", "idle"),
        ]
        r = random.choice(default_replies)
        return {"replyText": r[0], "emotion": r[1], "action": r[2]}

    # ------------------------------------------------------------------
    # 核心对话
    # ------------------------------------------------------------------

    async def generate_reply(
        self,
        user_text: str,
        session_id: Optional[str] = None,
        meta: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """生成对话回复

        支持会话历史管理和 LLM 调用，当 API Key 未配置时使用智能 Mock 回复。
        """
        # 记录用户消息
        if session_id:
            self.sessions.append(session_id, "user", user_text)

        # 无 API Key 时使用 Mock 回复
        if not self.api_key:
            logger.info("OPENAI_API_KEY 未配置，使用智能 Mock 回复")
            result = self._get_smart_mock_reply(user_text)
            if session_id:
                self.sessions.append(session_id, "assistant", result["replyText"])
            return result

        # 构建 LLM 消息列表
        messages: List[Dict[str, str]] = [
            {"role": "system", "content": SYSTEM_PROMPT},
        ]

        # 添加会话历史上下文
        if session_id:
            context = self.sessions.get_context_messages(session_id, limit=10)
            # 排除刚添加的当前用户消息（避免重复）
            if context and context[-1]["content"] == user_text:
                context = context[:-1]
            messages.extend(context)

        messages.append({"role": "user", "content": user_text})

        # 附加元数据作为补充上下文（放在 user 消息之前更合理）
        if meta:
            messages.insert(-1, {
                "role": "system",
                "content": f"附加上下文信息：{json.dumps(meta, ensure_ascii=False)}",
            })

        try:
            data = await self._call_llm(messages)
            content = data["choices"][0]["message"]["content"]
            result = self._parse_llm_response(content, user_text)

            # 记录助手回复
            if session_id:
                self.sessions.append(session_id, "assistant", result["replyText"])

            return result

        except httpx.TimeoutException:
            logger.warning("LLM 请求超时，回退到 Mock 回复")
            return self._get_smart_mock_reply(user_text)
        except httpx.HTTPStatusError as exc:
            body_preview = (exc.response.text or "")[:500]
            logger.error(
                "LLM 请求失败 status=%s body=%s",
                exc.response.status_code,
                body_preview,
            )
            return self._get_smart_mock_reply(user_text)
        except httpx.RequestError as exc:
            logger.error("LLM 请求异常: %s", exc)
            return self._get_smart_mock_reply(user_text)
        except Exception as exc:
            logger.exception("调用 LLM 失败: %s", exc)
            return self._get_smart_mock_reply(user_text)

    # ------------------------------------------------------------------
    # 会话管理（委托给 SessionManager）
    # ------------------------------------------------------------------

    def clear_session(self, session_id: str) -> bool:
        """清除指定会话的历史记录"""
        return self.sessions.clear(session_id)

    def get_session_history(self, session_id: str) -> List[Dict[str, str]]:
        """获取指定会话的历史记录"""
        return self.sessions.get_history(session_id)

    # ------------------------------------------------------------------
    # LLM 调用内部方法
    # ------------------------------------------------------------------

    def _parse_llm_response(self, content: str, user_text: str) -> Dict[str, Any]:
        """解析 LLM 返回的 JSON 响应，做合法性校验"""
        try:
            parsed = json.loads(content)
        except json.JSONDecodeError:
            logger.warning("LLM 返回非法 JSON，将原文作为 replyText: %s", content[:200])
            return {"replyText": content, "emotion": "neutral", "action": "idle"}

        reply_text = str(parsed.get("replyText", "")).strip() or f"你刚才说：{user_text}"
        emotion = str(parsed.get("emotion", "neutral")).strip()
        action = str(parsed.get("action", "idle")).strip()

        if emotion not in VALID_EMOTIONS:
            emotion = "neutral"
        if action not in VALID_ACTIONS:
            action = "idle"

        return {"replyText": reply_text, "emotion": emotion, "action": action}

    def _get_openai_chat_completions_url(self) -> str:
        """根据 base_url 拼接完整的 chat/completions 端点"""
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

    async def _call_llm(self, messages: List[Dict[str, str]]) -> Dict[str, Any]:
        """调用 LLM API"""
        provider = (self.provider or "openai").lower()
        logger.debug(
            "调用 LLM provider=%s model=%s messages=%d",
            provider, self.model, len(messages),
        )

        if provider != "openai":
            logger.warning("LLM_PROVIDER=%s 未实现，回退到 openai", provider)

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

        client = self._http_client or httpx.AsyncClient(timeout=30.0)
        resp = await client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        return resp.json()


# 全局单例
dialogue_service = DialogueService()
