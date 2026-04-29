"""Extended tests for DialogueService: TTL cleanup, concurrent requests,
LLM error fallback, history truncation, stream error handling."""

import json
import os
import sys
import time
import types
import unittest
from pathlib import Path

SERVER_ROOT = Path(__file__).resolve().parents[1]
if str(SERVER_ROOT) not in sys.path:
  sys.path.insert(0, str(SERVER_ROOT))

# Ensure the httpx stub is available (same pattern as existing tests)
if "httpx" not in sys.modules:
  httpx_stub = types.ModuleType("httpx")

  class TimeoutException(Exception):
    pass

  class HTTPStatusError(Exception):
    def __init__(self, *args, request=None, response=None, **kwargs):
      super().__init__(*args)
      self.request = request
      self.response = response

  class RequestError(Exception):
    def __init__(self, *args, request=None, **kwargs):
      super().__init__(*args)
      self.request = request

  class AsyncClient:
    def __init__(self, *args, **kwargs):
      pass

    async def __aenter__(self):
      return self

    async def __aexit__(self, exc_type, exc, tb):
      return False

    async def post(self, *args, **kwargs):
      raise RuntimeError("httpx stub does not support network calls")

  httpx_stub.TimeoutException = TimeoutException
  httpx_stub.HTTPStatusError = HTTPStatusError
  httpx_stub.RequestError = RequestError
  httpx_stub.AsyncClient = AsyncClient
  sys.modules["httpx"] = httpx_stub

from app.services.dialogue import DialogueService
from app.config import get_settings


class SessionTTLCleanupTest(unittest.IsolatedAsyncioTestCase):
  """Tests for cleanup_expired and session expiry."""

  def setUp(self) -> None:
    self.original_api_key = os.environ.get("OPENAI_API_KEY")
    os.environ.pop("OPENAI_API_KEY", None)
    self.service = DialogueService()

  def tearDown(self) -> None:
    if self.original_api_key is None:
      os.environ.pop("OPENAI_API_KEY", None)
    else:
      os.environ["OPENAI_API_KEY"] = self.original_api_key

  async def test_expired_session_is_cleaned_up(self) -> None:
    import time
    # Create a session with an old timestamp by manipulating the store directly
    self.service.store.append_history("old-session", "user", "hi", "1")
    # Set last_active to an old time
    self.service.store._last_active["old-session"] = time.monotonic() - self.service.session_ttl - 100

    # Trigger cleanup
    self.service.store.cleanup_expired(self.service.session_ttl)

    self.assertEqual(self.service.get_session_history("old-session"), [])

  async def test_active_session_is_not_cleaned_up(self) -> None:
    self.service.store.append_history("active-session", "user", "hi", "1")

    self.service.store.cleanup_expired(self.service.session_ttl)

    self.assertEqual(len(self.service.get_session_history("active-session")), 1)

  async def test_list_sessions_triggers_cleanup(self) -> None:
    import time
    self.service.store.append_history("old", "user", "hi", "1")
    self.service.store._last_active["old"] = time.monotonic() - self.service.session_ttl - 100

    sessions = self.service.list_sessions()

    self.assertEqual(len(sessions), 0)
    self.assertEqual(self.service.get_session_history("old"), [])

  async def test_generate_reply_triggers_cleanup(self) -> None:
    import time
    self.service.store.append_history("old", "user", "hi", "1")
    self.service.store._last_active["old"] = time.monotonic() - self.service.session_ttl - 100

    await self.service.generate_reply("test", session_id="new-session")

    self.assertEqual(self.service.get_session_history("old"), [])
    self.assertEqual(len(self.service.get_session_history("new-session")), 2)


class LLMErrorFallbackTest(unittest.IsolatedAsyncioTestCase):
  """Tests for LLM error handling and mock degradation."""

  def setUp(self) -> None:
    self.original_api_key = os.environ.get("OPENAI_API_KEY")
    os.environ["OPENAI_API_KEY"] = "test-key"
    # Clear lru_cache so get_settings() picks up the new key
    get_settings.cache_clear()
    self.service = DialogueService()

  def tearDown(self) -> None:
    get_settings.cache_clear()
    if self.original_api_key is None:
      os.environ.pop("OPENAI_API_KEY", None)
    else:
      os.environ["OPENAI_API_KEY"] = self.original_api_key

  async def test_timeout_falls_back_to_mock_reply(self) -> None:
    import httpx as real_httpx
    # Get the stub class
    httpx_mod = sys.modules["httpx"]

    async def fake_call_timeout(messages):
      raise httpx_mod.TimeoutException("timed out")

    self.service._call_llm = fake_call_timeout  # type: ignore[method-assign]

    result = await self.service.generate_reply("你好", session_id="test")

    self.assertIn("replyText", result)
    self.assertIn("emotion", result)
    self.assertIn("action", result)
    self.assertEqual(result["emotion"], "happy")  # greeting detection

  async def test_http_status_error_falls_back_to_mock_reply(self) -> None:
    httpx_mod = sys.modules["httpx"]

    async def fake_call_status_error(messages):
      raise httpx_mod.HTTPStatusError(
        "server error",
        request=type("R", (), {"url": "http://test"})(),
        response=type("R", (), {"status_code": 500, "text": "internal error"})(),
      )

    self.service._call_llm = fake_call_status_error  # type: ignore[method-assign]

    result = await self.service.generate_reply("test message", session_id="test")
    self.assertIn("replyText", result)

  async def test_request_error_falls_back_to_mock_reply(self) -> None:
    httpx_mod = sys.modules["httpx"]

    async def fake_call_request_error(messages):
      raise httpx_mod.RequestError(
        "connection refused",
        request=type("R", (), {"url": "http://test"})(),
      )

    self.service._call_llm = fake_call_request_error  # type: ignore[method-assign]

    result = await self.service.generate_reply("test message", session_id="test")
    self.assertIn("replyText", result)

  async def test_generic_exception_falls_back_to_mock_reply(self) -> None:
    async def fake_call_generic_error(messages):
      raise RuntimeError("something unexpected")

    self.service._call_llm = fake_call_generic_error  # type: ignore[method-assign]

    result = await self.service.generate_reply("test message", session_id="test")
    self.assertIn("replyText", result)

  async def test_non_json_llm_response_uses_raw_text(self) -> None:
    # We need to monkey-patch the httpx.AsyncClient to avoid the stub's
    # RuntimeError and instead return a response with non-JSON content.
    async def fake_call_raw_text(messages):
      # Simulate a real response by returning the expected dict structure
      return {
        "choices": [{"message": {"content": "这是纯文本回复，不是JSON"}}]
      }

    self.service._call_llm = fake_call_raw_text  # type: ignore[method-assign]

    # The httpx stub's AsyncClient.post raises RuntimeError, which is
    # caught by the generic Exception handler before we reach JSON parsing.
    # To actually test the non-JSON path, we bypass _call_llm by mocking it.
    result = await self.service.generate_reply("test", session_id="test")

    self.assertEqual(result["replyText"], "这是纯文本回复，不是JSON")
    self.assertEqual(result["emotion"], "neutral")
    self.assertEqual(result["action"], "idle")

  async def test_invalid_emotion_normalized_to_neutral(self) -> None:
    async def fake_call_invalid_emotion(messages):
      return {
        "choices": [{"message": {"content": json.dumps({
          "replyText": "hello",
          "emotion": "excited",
          "action": "idle",
        })}}]
      }

    self.service._call_llm = fake_call_invalid_emotion  # type: ignore[method-assign]

    result = await self.service.generate_reply("test", session_id="test")
    self.assertEqual(result["emotion"], "neutral")

  async def test_invalid_action_normalized_to_idle(self) -> None:
    async def fake_call_invalid_action(messages):
      return {
        "choices": [{"message": {"content": json.dumps({
          "replyText": "hello",
          "emotion": "neutral",
          "action": "jump",
        })}}]
      }

    self.service._call_llm = fake_call_invalid_action  # type: ignore[method-assign]

    result = await self.service.generate_reply("test", session_id="test")
    self.assertEqual(result["action"], "idle")

  async def test_empty_replytext_falls_back_to_echo(self) -> None:
    async def fake_call_empty_reply(messages):
      return {
        "choices": [{"message": {"content": json.dumps({
          "replyText": "",
          "emotion": "neutral",
          "action": "idle",
        })}}]
      }

    self.service._call_llm = fake_call_empty_reply  # type: ignore[method-assign]

    result = await self.service.generate_reply("用户输入", session_id="test")
    self.assertEqual(result["replyText"], "你刚才说：用户输入")


class HistoryTruncationTest(unittest.IsolatedAsyncioTestCase):
  """Tests for history truncation limits."""

  def setUp(self) -> None:
    self.original_api_key = os.environ.get("OPENAI_API_KEY")
    os.environ.pop("OPENAI_API_KEY", None)
    self.service = DialogueService()

  def tearDown(self) -> None:
    if self.original_api_key is None:
      os.environ.pop("OPENAI_API_KEY", None)
    else:
      os.environ["OPENAI_API_KEY"] = self.original_api_key

  async def test_session_history_truncated_at_max(self) -> None:
    # max_length=40 is the truncation threshold for history
    max_entries = 40

    for i in range(max_entries + 10):
      self.service.store.append_history("test-session", "user" if i % 2 == 0 else "assistant", f"msg-{i}", str(i))

    history = self.service.get_session_history("test-session")
    self.assertEqual(len(history), max_entries)
    # Should keep the most recent entries
    self.assertIn(f"msg-{max_entries + 9}", history[-1]["content"])

  async def test_session_messages_truncated_at_max(self) -> None:
    max_msgs = self.service.max_session_messages

    for i in range(max_msgs + 5):
      self.service.store.append_messages("test-session", [
        {"role": "user", "content": f"u-{i}"},
        {"role": "assistant", "content": f"a-{i}"},
      ], max_length=max_msgs)

    messages = self.service._get_session_messages("test-session")
    self.assertEqual(len(messages), max_msgs)


class StreamErrorFallbackTest(unittest.IsolatedAsyncioTestCase):
  """Tests for generate_reply_stream error handling."""

  def setUp(self) -> None:
    self.original_api_key = os.environ.get("OPENAI_API_KEY")
    os.environ.pop("OPENAI_API_KEY", None)
    get_settings.cache_clear()
    self.service = DialogueService()

  def tearDown(self) -> None:
    get_settings.cache_clear()
    if self.original_api_key is None:
      os.environ.pop("OPENAI_API_KEY", None)
    else:
      os.environ["OPENAI_API_KEY"] = self.original_api_key

  async def test_stream_blank_input_returns_done_immediately(self) -> None:
    events = []
    async for event in self.service.generate_reply_stream("   "):
      events.append(json.loads(event))

    self.assertEqual(len(events), 1)
    self.assertEqual(events[0]["type"], "done")
    self.assertEqual(events[0]["emotion"], "neutral")

  async def test_stream_mock_mode_yields_tokens_then_done(self) -> None:
    events = []
    async for event in self.service.generate_reply_stream("你好"):
      events.append(json.loads(event))

    # Should have at least one token event and a done event
    token_events = [e for e in events if e["type"] == "token"]
    done_events = [e for e in events if e["type"] == "done"]

    self.assertGreater(len(token_events), 0)
    self.assertEqual(len(done_events), 1)
    self.assertIn("replyText", done_events[0])
    self.assertIn("emotion", done_events[0])

  async def test_stream_llm_error_yields_error_then_done_with_mock(self) -> None:
    os.environ["OPENAI_API_KEY"] = "test-key"
    get_settings.cache_clear()
    self.service = DialogueService()

    async def fake_stream_error(messages):
      raise RuntimeError("LLM unavailable")
      yield  # noqa: unreachable — makes this an async generator

    self.service._call_llm_stream = fake_stream_error  # type: ignore[method-assign]

    events = []
    async for event in self.service.generate_reply_stream("test"):
      events.append(json.loads(event))

    error_events = [e for e in events if e["type"] == "error"]
    done_events = [e for e in events if e["type"] == "done"]

    self.assertEqual(len(error_events), 1)
    self.assertEqual(error_events[0]["message"], "LLM unavailable")
    self.assertEqual(len(done_events), 1)
    self.assertIn("replyText", done_events[0])

  async def test_stream_llm_success_yields_parsed_tokens(self) -> None:
    os.environ["OPENAI_API_KEY"] = "test-key"
    get_settings.cache_clear()
    self.service = DialogueService()

    async def fake_stream_success(messages):
      yield json.dumps({
        "replyText": "好的",
        "emotion": "happy",
        "action": "nod",
      })

    self.service._call_llm_stream = fake_stream_success  # type: ignore[method-assign]

    events = []
    async for event in self.service.generate_reply_stream("test"):
      events.append(json.loads(event))

    done_events = [e for e in events if e["type"] == "done"]
    self.assertEqual(len(done_events), 1)
    self.assertEqual(done_events[0]["replyText"], "好的")
    self.assertEqual(done_events[0]["emotion"], "happy")

  async def test_stream_records_history(self) -> None:
    events = []
    async for event in self.service.generate_reply_stream("你好", session_id="stream-session"):
      events.append(json.loads(event))

    history = self.service.get_session_history("stream-session")
    self.assertEqual(len(history), 2)
    self.assertEqual(history[0]["role"], "user")
    self.assertEqual(history[0]["content"], "你好")


class ConcurrentRequestTest(unittest.IsolatedAsyncioTestCase):
  """Tests for concurrent request behavior (state integrity, not safety)."""

  def setUp(self) -> None:
    self.original_api_key = os.environ.get("OPENAI_API_KEY")
    os.environ.pop("OPENAI_API_KEY", None)
    self.service = DialogueService()

  def tearDown(self) -> None:
    if self.original_api_key is None:
      os.environ.pop("OPENAI_API_KEY", None)
    else:
      os.environ["OPENAI_API_KEY"] = self.original_api_key

  async def test_concurrent_requests_to_same_session_preserve_all_messages(self) -> None:
    import asyncio

    # Fire 5 concurrent requests to the same session
    tasks = [
      self.service.generate_reply(f"消息{i}", session_id="concurrent-session")
      for i in range(5)
    ]
    await asyncio.gather(*tasks)

    history = self.service.get_session_history("concurrent-session")
    # Each request adds 2 entries (user + assistant), so 5 * 2 = 10
    self.assertEqual(len(history), 10)

    # All user messages should be present
    user_contents = [m["content"] for m in history if m["role"] == "user"]
    for i in range(5):
      self.assertIn(f"消息{i}", user_contents)

  async def test_concurrent_requests_to_different_sessions_are_isolated(self) -> None:
    import asyncio

    tasks = [
      self.service.generate_reply(f"msg-{i}", session_id=f"session-{i}")
      for i in range(5)
    ]
    await asyncio.gather(*tasks)

    for i in range(5):
      history = self.service.get_session_history(f"session-{i}")
      self.assertEqual(len(history), 2)
      self.assertEqual(history[0]["content"], f"msg-{i}")


class URLConstructionTest(unittest.TestCase):
  """Tests for _get_openai_chat_completions_url."""

  def setUp(self) -> None:
    self.original_api_key = os.environ.get("OPENAI_API_KEY")
    os.environ.pop("OPENAI_API_KEY", None)
    self.service = DialogueService()

  def tearDown(self) -> None:
    if self.original_api_key is None:
      os.environ.pop("OPENAI_API_KEY", None)
    else:
      os.environ["OPENAI_API_KEY"] = self.original_api_key

  def test_empty_base_url_returns_default(self) -> None:
    self.service.base_url = ""
    url = self.service._get_openai_chat_completions_url()
    self.assertEqual(url, "https://api.openai.com/v1/chat/completions")

  def test_base_url_with_v1_appends_chat_completions(self) -> None:
    self.service.base_url = "http://localhost:8000/v1"
    url = self.service._get_openai_chat_completions_url()
    self.assertEqual(url, "http://localhost:8000/v1/chat/completions")

  def test_base_url_with_v1_chat_appends_completions(self) -> None:
    self.service.base_url = "http://localhost:8000/v1/chat"
    url = self.service._get_openai_chat_completions_url()
    self.assertEqual(url, "http://localhost:8000/v1/chat/completions")

  def test_base_url_already_has_completions(self) -> None:
    self.service.base_url = "http://localhost:8000/v1/chat/completions"
    url = self.service._get_openai_chat_completions_url()
    self.assertEqual(url, "http://localhost:8000/v1/chat/completions")

  def test_base_url_without_v1_adds_v1(self) -> None:
    self.service.base_url = "http://localhost:8000"
    url = self.service._get_openai_chat_completions_url()
    self.assertEqual(url, "http://localhost:8000/v1/chat/completions")

  def test_base_url_with_trailing_slash(self) -> None:
    self.service.base_url = "http://localhost:8000/v1/"
    url = self.service._get_openai_chat_completions_url()
    self.assertEqual(url, "http://localhost:8000/v1/chat/completions")


if __name__ == "__main__":
  unittest.main()
