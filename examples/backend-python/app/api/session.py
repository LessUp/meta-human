"""会话管理 API 路由"""

from typing import Any, Dict, List

from fastapi import APIRouter

from app.services.dialogue import dialogue_service

router = APIRouter()


@router.get("/sessions")
async def list_sessions() -> List[Dict[str, Any]]:
    """列出所有活跃会话的摘要信息"""
    return dialogue_service.list_sessions()


@router.get("/session/{session_id}/history")
async def get_session_history(session_id: str) -> Dict[str, Any]:
    """获取指定会话的完整历史记录"""
    session_id = (session_id or "").strip()
    if not session_id:
        return {"sessionId": "", "messages": [], "count": 0}
    history = dialogue_service.get_session_history(session_id)
    return {
        "sessionId": session_id,
        "messages": history,
        "count": len(history),
    }


@router.delete("/session/{session_id}")
async def delete_session(session_id: str) -> dict:
    """清除指定会话的后端历史记录"""
    session_id = (session_id or "").strip()
    if not session_id:
        return {"cleared": False}
    cleared = dialogue_service.clear_session(session_id)
    return {"cleared": cleared}
