"""Session storage abstraction for DialogueService.

Provides a pluggable interface for session persistence, with in-memory
and Redis implementations. The in-memory store is the default and works
for single-process development. The Redis store enables distributed
session management across multiple workers/instances.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
import json
import time
import logging
from collections import defaultdict

logger = logging.getLogger(__name__)


class SessionStore(ABC):
    """Abstract session store interface."""

    @abstractmethod
    def get_history(self, session_id: str) -> List[Dict[str, str]]:
        """Get the conversation history for a session."""
        ...

    @abstractmethod
    def append_history(
        self, session_id: str, role: str, content: str, timestamp: str, max_length: int = 40
    ) -> None:
        """Append a message to the session history."""
        ...

    @abstractmethod
    def get_messages(self, session_id: str) -> List[Dict[str, str]]:
        """Get the LLM-format messages for a session."""
        ...

    @abstractmethod
    def append_messages(
        self, session_id: str, messages: List[Dict[str, str]], max_length: int = 10
    ) -> None:
        """Append messages to the LLM-format session store."""
        ...

    @abstractmethod
    def touch(self, session_id: str) -> None:
        """Update the last-active timestamp for a session."""
        ...

    @abstractmethod
    def clear(self, session_id: str) -> bool:
        """Clear all data for a session. Returns True if anything was removed."""
        ...

    @abstractmethod
    def list_sessions(self) -> List[Dict[str, Any]]:
        """List all active sessions with summary info."""
        ...

    @abstractmethod
    def cleanup_expired(self, ttl_seconds: int) -> int:
        """Remove sessions older than TTL. Returns count of removed sessions."""
        ...


class InMemorySessionStore(SessionStore):
    """In-memory session storage using Python dicts.

    Suitable for single-process development. Sessions are lost on restart.
    """

    def __init__(self) -> None:
        self._histories: Dict[str, List[Dict[str, str]]] = defaultdict(list)
        self._messages: Dict[str, List[Dict[str, str]]] = {}
        self._last_active: Dict[str, float] = {}

    def get_history(self, session_id: str) -> List[Dict[str, str]]:
        return list(self._histories.get(session_id, []))

    def append_history(
        self, session_id: str, role: str, content: str, timestamp: str, max_length: int = 40
    ) -> None:
        self._histories[session_id].append({
            "role": role,
            "content": content,
            "timestamp": timestamp,
        })
        # Truncate if needed
        if len(self._histories[session_id]) > max_length:
            self._histories[session_id] = self._histories[session_id][-max_length:]
        self.touch(session_id)

    def get_messages(self, session_id: str) -> List[Dict[str, str]]:
        return list(self._messages.get(session_id, []))

    def append_messages(
        self, session_id: str, messages: List[Dict[str, str]], max_length: int = 10
    ) -> None:
        history = self._messages.get(session_id, [])
        history.extend(messages)
        self._messages[session_id] = history[-max_length:]

    def touch(self, session_id: str) -> None:
        self._last_active[session_id] = time.monotonic()

    def clear(self, session_id: str) -> bool:
        removed = False
        if session_id in self._histories:
            del self._histories[session_id]
            removed = True
        if session_id in self._messages:
            del self._messages[session_id]
            removed = True
        if session_id in self._last_active:
            del self._last_active[session_id]
            removed = True
        return removed

    def list_sessions(self) -> List[Dict[str, Any]]:
        sessions = []
        for sid, history in self._histories.items():
            if not history:
                continue
            sessions.append({
                "sessionId": sid,
                "messageCount": len(history),
                "lastActivity": history[-1].get("timestamp", ""),
                "preview": history[-1].get("content", "")[:80],
            })
        sessions.sort(key=lambda s: s["lastActivity"], reverse=True)
        return sessions

    def cleanup_expired(self, ttl_seconds: int) -> int:
        cutoff = time.monotonic() - ttl_seconds
        expired = [sid for sid, ts in self._last_active.items() if ts < cutoff]
        for sid in expired:
            self.clear(sid)
        if expired:
            logger.info("Cleaned up %d expired sessions", len(expired))
        return len(expired)


class RedisSessionStore(SessionStore):
    """Redis-backed session storage.

    Requires the `redis` package. Falls back gracefully if Redis is unavailable.
    """

    def __init__(self, redis_url: str, key_prefix: str = "metahuman:session:") -> None:
        try:
            import redis
        except ImportError as e:
            raise ImportError(
                "redis package required for RedisSessionStore. "
                "Install with: pip install redis"
            ) from e
        self._redis = redis.from_url(redis_url, decode_responses=True)
        self._prefix = key_prefix

    def _history_key(self, session_id: str) -> str:
        return f"{self._prefix}{session_id}:history"

    def _messages_key(self, session_id: str) -> str:
        return f"{self._prefix}{session_id}:messages"

    def _active_key(self, session_id: str) -> str:
        return f"{self._prefix}{session_id}:active"

    def get_history(self, session_id: str) -> List[Dict[str, str]]:
        raw = self._redis.get(self._history_key(session_id))
        return json.loads(raw) if raw else []

    def append_history(
        self, session_id: str, role: str, content: str, timestamp: str, max_length: int = 40
    ) -> None:
        history = self.get_history(session_id)
        history.append({"role": role, "content": content, "timestamp": timestamp})
        # Truncate if needed
        if len(history) > max_length:
            history = history[-max_length:]
        self._redis.set(self._history_key(session_id), json.dumps(history))
        self.touch(session_id)

    def get_messages(self, session_id: str) -> List[Dict[str, str]]:
        raw = self._redis.get(self._messages_key(session_id))
        return json.loads(raw) if raw else []

    def append_messages(
        self, session_id: str, messages: List[Dict[str, str]], max_length: int = 10
    ) -> None:
        current = self.get_messages(session_id)
        current.extend(messages)
        self._redis.set(self._messages_key(session_id), json.dumps(current[-max_length:]))

    def touch(self, session_id: str) -> None:
        # Store with 1 hour TTL so inactive sessions get auto-cleaned by Redis
        self._redis.set(self._active_key(session_id), str(time.monotonic()), ex=3600)

    def clear(self, session_id: str) -> bool:
        keys = [
            self._history_key(session_id),
            self._messages_key(session_id),
            self._active_key(session_id),
        ]
        return self._redis.delete(*keys) > 0

    def list_sessions(self) -> List[Dict[str, Any]]:
        pattern = f"{self._prefix}*:history"
        sessions = []
        for key in self._redis.scan_iter(pattern):
            sid = key.replace(self._prefix, "").replace(":history", "")
            history = self.get_history(sid)
            if history:
                sessions.append({
                    "sessionId": sid,
                    "messageCount": len(history),
                    "lastActivity": history[-1].get("timestamp", ""),
                    "preview": history[-1].get("content", "")[:80],
                })
        sessions.sort(key=lambda s: s["lastActivity"], reverse=True)
        return sessions

    def cleanup_expired(self, ttl_seconds: int) -> int:
        # Redis handles TTL via the `ex` parameter on touch()
        # This method is a no-op but kept for interface compatibility
        return 0


def create_session_store(redis_url: Optional[str] = None) -> SessionStore:
    """Factory function to create the appropriate session store.

    If redis_url is provided and Redis is available, uses RedisSessionStore.
    Otherwise falls back to InMemorySessionStore.
    """
    if redis_url:
        try:
            store = RedisSessionStore(redis_url)
            logger.info("Using Redis session store: %s", redis_url)
            return store
        except ImportError:
            logger.warning(
                "REDIS_URL set but redis package not installed, "
                "falling back to in-memory session store"
            )
        except Exception as exc:
            logger.warning(
                "Redis connection failed (%s), falling back to in-memory session store",
                exc,
            )
    return InMemorySessionStore()
