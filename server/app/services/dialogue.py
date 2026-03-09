"""对话服务 Facade — 组合 session/llm/mock 三个子服务

参考 AIRI 的 createChatService 工厂模式，通过组合而非继承来构建服务。
原 300+ 行单体已拆分为：
  - services/session.py — 会话历史管理
  - services/llm.py     — LLM API 调用
  - services/mock.py    — 智能 Mock 回复
"""
from typing import Any, Dict, List, Optional
import logging

import httpx

from app.config import AppConfig, load_config
from app.services.session import SessionManager
from app.services.llm import LLMService
from app.services.mock import MockReplyService

logger = logging.getLogger(__name__)


class DialogueService:
    """对话服务 — 组合 SessionManager + LLMService + MockReplyService"""

    def __init__(self, config: Optional[AppConfig] = None) -> None:
        self._config = config or load_config()
        self.sessions = SessionManager(
            max_messages=self._config.session.max_messages,
            session_ttl_seconds=self._config.session.ttl_seconds,
        )
        self.llm = LLMService(self._config.llm)
        self.mock = MockReplyService()

    async def startup(self) -> None:
        await self.llm.startup()
        logger.info("DialogueService 已启动 (LLM=%s)", "可用" if self.llm.is_available else "Mock模式")

    async def shutdown(self) -> None:
        await self.llm.shutdown()
        logger.info("DialogueService 已关闭")

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
        if not self.llm.is_available:
            logger.info("LLM 不可用，使用智能 Mock 回复")
            result = self.mock.generate(user_text)
            if session_id:
                self.sessions.append(session_id, "assistant", result["replyText"])
            return result

        # 构建 LLM 消息列表
        context: Optional[List[Dict[str, str]]] = None
        if session_id:
            context = self.sessions.get_context_messages(session_id, limit=10)
            # 排除刚添加的当前用户消息（避免重复）
            if context and context[-1]["content"] == user_text:
                context = context[:-1]

        messages = self.llm.build_messages(user_text, context=context, meta=meta)

        try:
            data = await self.llm.call(messages)
            content = data["choices"][0]["message"]["content"]
            result = self.llm.parse_response(content, user_text)

            if session_id:
                self.sessions.append(session_id, "assistant", result["replyText"])
            return result

        except httpx.TimeoutException:
            logger.warning("LLM 请求超时，回退到 Mock 回复")
            return self.mock.generate(user_text)
        except httpx.HTTPStatusError as exc:
            logger.error("LLM 请求失败 status=%s", exc.response.status_code)
            return self.mock.generate(user_text)
        except httpx.RequestError as exc:
            logger.error("LLM 请求异常: %s", exc)
            return self.mock.generate(user_text)
        except Exception as exc:
            logger.exception("调用 LLM 失败: %s", exc)
            return self.mock.generate(user_text)

    def clear_session(self, session_id: str) -> bool:
        return self.sessions.clear(session_id)

    def get_session_history(self, session_id: str) -> List[Dict[str, str]]:
        return self.sessions.get_history(session_id)


# 全局单例（向后兼容）
dialogue_service = DialogueService()
