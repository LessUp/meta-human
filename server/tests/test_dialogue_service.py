import json
import os
import sys
import types
import unittest
from pathlib import Path

SERVER_ROOT = Path(__file__).resolve().parents[1]
if str(SERVER_ROOT) not in sys.path:
  sys.path.insert(0, str(SERVER_ROOT))

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

from app.services.dialogue import DialogueService, session_histories


class DialogueServiceTestCase(unittest.IsolatedAsyncioTestCase):
  def setUp(self) -> None:
    self.original_api_key = os.environ.get("OPENAI_API_KEY")
    os.environ.pop("OPENAI_API_KEY", None)
    session_histories.clear()
    self.service = DialogueService()

  def tearDown(self) -> None:
    session_histories.clear()
    if self.original_api_key is None:
      os.environ.pop("OPENAI_API_KEY", None)
    else:
      os.environ["OPENAI_API_KEY"] = self.original_api_key

  async def test_blank_input_returns_default_reply_without_creating_history(self) -> None:
    result = await self.service.generate_reply("   ", session_id=" demo-session ")

    self.assertEqual(result["replyText"], "我在听，请告诉我您想聊什么。")
    self.assertEqual(result["emotion"], "neutral")
    self.assertEqual(result["action"], "idle")
    self.assertEqual(self.service.get_session_history("demo-session"), [])

  async def test_mock_reply_records_complete_turn_and_clear_session_clears_both_caches(self) -> None:
    result = await self.service.generate_reply("你好", session_id=" demo-session ")

    history = self.service.get_session_history("demo-session")
    cached_messages = self.service._get_session_messages("demo-session")

    self.assertEqual(len(history), 2)
    self.assertEqual(history[0]["role"], "user")
    self.assertEqual(history[0]["content"], "你好")
    self.assertEqual(history[1]["role"], "assistant")
    self.assertEqual(history[1]["content"], result["replyText"])
    self.assertEqual(len(cached_messages), 2)

    cleared = self.service.clear_session("demo-session")

    self.assertTrue(cleared)
    self.assertEqual(self.service.get_session_history("demo-session"), [])
    self.assertEqual(self.service._get_session_messages("demo-session"), [])

  async def test_current_user_message_is_not_duplicated_when_building_prompt(self) -> None:
    os.environ["OPENAI_API_KEY"] = "test-key"
    self.service = DialogueService()
    session_histories["demo-session"] = [
      {"role": "user", "content": "上一句", "timestamp": "1"},
      {"role": "assistant", "content": "上一答", "timestamp": "2"},
    ]
    captured_messages: list[dict[str, str]] = []

    async def fake_call(messages: list[dict[str, str]]) -> dict:
      captured_messages.extend(messages)
      return {
        "choices": [
          {
            "message": {
              "content": json.dumps(
                {
                  "replyText": "收到",
                  "emotion": "happy",
                  "action": "nod",
                },
                ensure_ascii=False,
              )
            }
          }
        ]
      }

    self.service._call_llm = fake_call  # type: ignore[method-assign]

    result = await self.service.generate_reply("本轮提问", session_id="demo-session")

    user_contents = [message["content"] for message in captured_messages if message["role"] == "user"]

    self.assertEqual(result["replyText"], "收到")
    self.assertEqual(user_contents.count("本轮提问"), 1)

  async def test_session_id_is_stripped_and_normalized(self) -> None:
    result = await self.service.generate_reply("你好", session_id="  spaced-id  ")

    history = self.service.get_session_history("spaced-id")
    self.assertEqual(len(history), 2)
    self.assertEqual(history[0]["content"], "你好")
    self.assertEqual(history[1]["content"], result["replyText"])

  async def test_clear_session_on_nonexistent_session_returns_false(self) -> None:
    cleared = self.service.clear_session("no-such-session")
    self.assertFalse(cleared)

  async def test_sessions_are_isolated(self) -> None:
    await self.service.generate_reply("消息A", session_id="session-a")
    await self.service.generate_reply("消息B", session_id="session-b")

    history_a = self.service.get_session_history("session-a")
    history_b = self.service.get_session_history("session-b")

    self.assertTrue(all("消息A" != m["content"] for m in history_b if m["role"] == "user"))
    self.assertTrue(all("消息B" != m["content"] for m in history_a if m["role"] == "user"))

    self.service.clear_session("session-a")
    self.assertEqual(self.service.get_session_history("session-a"), [])
    self.assertEqual(len(self.service.get_session_history("session-b")), 2)


if __name__ == "__main__":
  unittest.main()
