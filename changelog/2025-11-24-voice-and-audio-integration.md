# 2025-11-24 行为引擎与语音管线集成

## 行为状态系统

- `digitalHumanStore` 新增 `currentBehavior` 字段和 `setBehavior()` 方法
- `DigitalHumanEngine` 新增 `setBehavior()` — 行为语义自动映射到动画（greeting→wave、thinking→shakeHead 等）
- 行为面板操作现在真实更新全局状态和动画

## 语音管线

- **TTS**（文字转语音）：Web Speech API，自动同步 `isSpeaking` 状态，中文语音优先选择
- **ASR**（语音识别）：支持连续识别，结果自动发送到后端对话服务
- 本地语音命令优先处理（"打招呼"、"跳舞"等直接触发动作）
- 录音/静音状态与全局 Store 同步

## 对话服务

- 前端 `dialogueService`：重试机制（3 次指数退避）、15 秒超时、离线降级
- 前端 `dialogueOrchestrator`：将后端返回的 `{replyText, emotion, action}` 分发到 Store/Engine/TTS
- 后端 `DialogueService`：
  - 智能 Mock 回复（关键词匹配 + 随机回复）
  - System Prompt 约束 LLM 输出 JSON 格式
  - `OPENAI_BASE_URL` 自动规范化（兼容多种 URL 格式）
  - `LLM_PROVIDER` 预留多 Provider 扩展接口

## 交互细节

- 聊天输入框防重复提交（加载/录音时禁用）
- 占位文案根据状态切换（录音中 / 思考中 / 默认）
- 发送/录音按钮在加载时禁用并显示视觉反馈
