"""WebSocket chat endpoint (skeleton).

Provides a real-time bidirectional alternative to SSE+REST.
SSE endpoints remain available for backward compatibility.
"""

import json
import logging
from typing import Any, Dict

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from app.services.dialogue import dialogue_service

logger = logging.getLogger(__name__)

router = APIRouter()


class ConnectionManager:
    """Manages active WebSocket connections."""

    def __init__(self) -> None:
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, session_id: str) -> None:
        await websocket.accept()
        self.active_connections[session_id] = websocket
        logger.info("WebSocket connected: session=%s", session_id)

    def disconnect(self, session_id: str) -> None:
        self.active_connections.pop(session_id, None)
        logger.info("WebSocket disconnected: session=%s", session_id)

    async def send_json(self, session_id: str, data: Dict[str, Any]) -> None:
        ws = self.active_connections.get(session_id)
        if ws:
            await ws.send_json(data)


manager = ConnectionManager()


@router.websocket("/ws")
async def websocket_chat(
    websocket: WebSocket,
    session_id: str = Query(...),
) -> None:
    """WebSocket endpoint for real-time chat.

    Protocol:
    - Client sends: {"type": "chat", "userText": "...", "meta": {...}}
    - Server sends: {"type": "token", "content": "..."}
    - Server sends: {"type": "done", "replyText": "...", "emotion": "...", "action": "..."}
    - Server sends: {"type": "error", "message": "..."}
    """
    await manager.connect(websocket, session_id)

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type != "chat":
                await manager.send_json(session_id, {
                    "type": "error",
                    "message": f"Unknown message type: {msg_type}",
                })
                continue

            user_text = (data.get("userText") or "").strip()
            if not user_text:
                await manager.send_json(session_id, {
                    "type": "error",
                    "message": "userText cannot be empty",
                })
                continue

            async for chunk in dialogue_service.generate_reply_stream(
                user_text=user_text,
                session_id=session_id,
                meta=data.get("meta"),
            ):
                try:
                    event = json.loads(chunk)
                    await manager.send_json(session_id, event)
                except json.JSONDecodeError:
                    pass

    except WebSocketDisconnect:
        manager.disconnect(session_id)
    except Exception as exc:
        logger.exception("WebSocket error for session %s: %s", session_id, exc)
        manager.disconnect(session_id)
        try:
            await websocket.close(code=1011, reason=str(exc))
        except Exception:
            pass
