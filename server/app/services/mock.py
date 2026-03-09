"""智能 Mock 回复服务 — 从 dialogue.py 提取

当 LLM API Key 未配置时，提供基于关键词匹配的本地回复。
"""
import random
from typing import Any, Dict


class MockReplyService:
    """智能本地 Mock 回复"""

    def generate(self, user_text: str) -> Dict[str, Any]:
        """根据用户输入生成合理的 Mock 响应"""
        text_lower = user_text.lower()

        # 问候
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
