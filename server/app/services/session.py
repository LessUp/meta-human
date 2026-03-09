"""会话历史管理器 — 从 dialogue.py 提取

参考 AIRI chat/session-store 的领域分离设计。
支持 TTL 过期清理、最大消息数限制。
"""
import time
from datetime import datetime
from typing import Dict, List


class SessionManager:
    """统一的会话历史管理器"""

    def __init__(self, max_messages: int = 20, session_ttl_seconds: int = 3600) -> None:
        self._histories: Dict[str, List[Dict[str, str]]] = {}
        self._last_access: Dict[str, float] = {}
        self.max_messages = max_messages
        self.session_ttl = session_ttl_seconds

    def _cleanup_expired(self) -> None:
        """清理过期会话"""
        now = time.time()
        expired = [
            sid for sid, ts in self._last_access.items()
            if now - ts > self.session_ttl
        ]
        for sid in expired:
            self._histories.pop(sid, None)
            self._last_access.pop(sid, None)

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
        self._last_access[session_id] = time.time()

    def get_context_messages(self, session_id: str, limit: int = 10) -> List[Dict[str, str]]:
        """获取会话上下文消息（用于 LLM 调用）"""
        self._last_access[session_id] = time.time()
        history = self._histories.get(session_id, [])
        # 只返回 role + content，去掉 timestamp
        return [
            {"role": msg["role"], "content": msg["content"]}
            for msg in history[-limit:]
        ]

    def get_history(self, session_id: str) -> List[Dict[str, str]]:
        """获取完整历史（含 timestamp）"""
        return self._histories.get(session_id, [])

    def clear(self, session_id: str) -> bool:
        """清除指定会话"""
        existed = session_id in self._histories
        self._histories.pop(session_id, None)
        self._last_access.pop(session_id, None)
        return existed

    @property
    def session_count(self) -> int:
        return len(self._histories)
