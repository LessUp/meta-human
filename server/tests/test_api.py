"""API 集成测试

需要真实依赖环境（fastapi, httpx, etc），使用 venv 运行。
"""

import json
import os
import sys
import unittest
from pathlib import Path

SERVER_ROOT = Path(__file__).resolve().parents[1]
if str(SERVER_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVER_ROOT))

os.environ.pop("OPENAI_API_KEY", None)

from fastapi.testclient import TestClient
from app.main import app


class TestHealth(unittest.TestCase):
    def setUp(self):
        self.c = TestClient(app)

    def test_health_ok(self):
        r = self.c.get("/health")
        self.assertEqual(r.status_code, 200)
        d = r.json()
        self.assertEqual(d["status"], "ok")
        self.assertEqual(d["services"]["llm"], "mock_mode")

    def test_root(self):
        r = self.c.get("/")
        self.assertEqual(r.status_code, 200)
        self.assertIn("endpoints", r.json())


class TestChat(unittest.TestCase):
    def setUp(self):
        self.c = TestClient(app)

    def test_chat_ok(self):
        r = self.c.post("/v1/chat", json={"userText": "你好"})
        self.assertEqual(r.status_code, 200)
        d = r.json()
        self.assertIn("replyText", d)
        self.assertIn("emotion", d)

    def test_chat_empty(self):
        r = self.c.post("/v1/chat", json={"userText": "   "})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["replyText"], "我在听，请告诉我您想聊什么。")

    def test_chat_stream_sse(self):
        r = self.c.post("/v1/chat/stream", json={"userText": "你好"})
        self.assertEqual(r.status_code, 200)
        self.assertIn("text/event-stream", r.headers.get("content-type", ""))
        lines = [l for l in r.text.strip().split("\n\n") if l.startswith("data:")]
        self.assertTrue(len(lines) >= 2)
        last = json.loads(lines[-1].replace("data: ", ""))
        self.assertEqual(last["type"], "done")


class TestSession(unittest.TestCase):
    def setUp(self):
        self.c = TestClient(app)

    def test_list_sessions(self):
        r = self.c.get("/v1/sessions")
        self.assertEqual(r.status_code, 200)

    def test_history_empty(self):
        r = self.c.get("/v1/session/nonexistent/history")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["count"], 0)

    def test_chat_creates_history(self):
        sid = "test-api-sess"
        self.c.post("/v1/chat", json={"userText": "test", "sessionId": sid})
        r = self.c.get(f"/v1/session/{sid}/history")
        self.assertGreater(r.json()["count"], 0)
        self.c.delete(f"/v1/session/{sid}")

    def test_delete_nonexistent(self):
        r = self.c.delete("/v1/session/no-such")
        self.assertFalse(r.json()["cleared"])


class TestSpeech(unittest.TestCase):
    def setUp(self):
        self.c = TestClient(app)

    def test_tts_voices(self):
        r = self.c.get("/v1/tts/voices")
        self.assertEqual(r.status_code, 200)
        self.assertIn("provider", r.json())

    def test_asr_status(self):
        r = self.c.get("/v1/asr/status")
        self.assertEqual(r.status_code, 200)
        self.assertIn("provider", r.json())


if __name__ == "__main__":
    unittest.main()
