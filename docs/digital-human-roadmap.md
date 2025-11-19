# 数字人系统 Roadmap（MetaHuman → 真正数字人）

> 本路线图围绕「前端引擎 + FastAPI 后端 + LLM + 视觉镜像」的整体架构，按 **KISS 原则** 分阶段推进。
> 已完成的阶段标记为 ✅，规划中的阶段标记为 ⏳。

---

## 1. 阶段总览

| 阶段 | 目标 | 状态 |
| ---- | ---- | ---- |
| Phase 0 | 架构设计与文档输出 | ✅ |
| Phase 1 | 前端分层与服务抽取（音频 + Avatar 引擎） | ✅ |
| Phase 2 | FastAPI 后端骨架 + 对话服务 API | ✅ |
| Phase 3 | 高级页面对话 UI 接入 | ✅ |
| Phase 4 | LLM 对话大脑接入（OpenAI + 回退） | ✅ |
| Phase 5 | 视觉镜像 V1：表情（我笑它也笑） | ✅ |
| Phase 6 | 视觉镜像 V1：点头 / 摇头 | ✅ |
| Phase 7 | 视觉镜像 V2：上半身动作（举手 / 挥手） | ⏳ |
| Phase 8 | LLM Provider 抽象 + 多模型支持 | ⏳ |
| Phase 9 | 语音 Provider 抽象 + 云端 TTS / ASR 支持 | ⏳ |
| Phase 10 | 记忆与人格系统（短期/长期记忆） | ⏳ |
| Phase 11 | 场景化 Skill / 插件系统（外部集成） | ⏳ |
| Phase 12 | 桌面版 / 常驻数字人（Tauri/Electron） | ⏳ |

---

## 2. 已完成阶段（现状回顾）

### Phase 0：架构设计与文档输出 ✅

- 输出整体架构与设计文档：
  - `docs/digital-human-architecture.md`
- 明确：前端（React + TS + Three.js + Zustand）、后端（FastAPI）、视觉镜像（MediaPipe）、LLM（OpenAI）等关键模块。

### Phase 1：前端分层与服务抽取 ✅

- 目标：把 Demo 式实现改造成清晰分层的前端架构。
- 主要结果：
  - `core/audio/audioService.ts`：
    - 把 `TTSService` / `ASRService` 从 `digitalHumanStore` 中抽离，统一封装音频逻辑。
  - `core/avatar/DigitalHumanEngine.ts`：
    - 统一管理播放、表情、动作等控制接口。
  - `DigitalHumanPage` / `AdvancedDigitalHumanPage`：
    - 页面只通过 `audioService` / `digitalHumanEngine` 调用，不直接触碰浏览器语音/3D API。

### Phase 2：FastAPI 后端骨架 + 对话服务 ✅

- 目标：让数字人拥有独立的后端“大脑服务”。
- 主要结果：
  - `server/app/main.py`：FastAPI 应用，提供 `/health` + 注册 `/v1/chat` 路由。
  - `server/app/api/chat.py`：`POST /v1/chat` Mock 实现。
  - `server/app/services/dialogue.py`：`DialogueService`，初版为 echo。
  - `server/requirements.txt`：FastAPI + Uvicorn 依赖。

### Phase 3：高级页面对话 UI 接入 ✅

- 目标：在前端形成完整的「对话体验」闭环。
- 主要结果：
  - `src/core/dialogue/dialogueService.ts`：
    - 封装前端对 `/v1/chat` 的调用，统一返回 `{ replyText, emotion, action }`。
  - `AdvancedDigitalHumanPage.tsx`：
    - 新增 **「对话」Tab**：文本输入框 + 消息气泡列表。
    - 调用 `sendUserInput` 获取回复，使用 `ttsService` 播放，并根据 `emotion/action` 驱动 `digitalHumanEngine`。
    - 语音识别结果（来自 `VoiceInteractionPanel`）也走同一对话链路。

### Phase 4：LLM 对话大脑接入（OpenAI + 回退） ✅

- 目标：让数字人拥有真正的 LLM 对话能力，同时保证没有 Key 时也能工作。
- 主要结果：
  - `server/app/services/dialogue.py`：
    - 集成 OpenAI Chat Completions API。
    - 通过 prompt 约定返回结构化 JSON：`replyText` / `emotion` / `action`。
    - 无 `OPENAI_API_KEY` 或调用异常时，回退到安全的 Mock 回复。
- 当前：
  - 前端完全不感知 LLM 类型，只消费 `{ replyText, emotion, action }`。

### Phase 5：视觉镜像 V1 — 表情 ✅

- 目标：实现“我笑它也笑”的基础表情镜像。
- 主要结果：
  - `core/vision/visionMapper.ts`：
    - 基于 MediaPipe FaceMesh 关键点，把嘴部几何特征映射为：`happy` / `neutral` / `surprised`。
  - `core/vision/visionService.ts`：
    - 管理摄像头 + FaceMesh 推理循环。
  - `components/VisionMirrorPanel.tsx`：
    - 提供摄像头预览和当前表情显示。
  - `AdvancedDigitalHumanPage.tsx`：
    - 新增 **「视觉镜像」Tab**。
    - 根据 `happy/neutral/surprised` 调用 `digitalHumanEngine.setExpression` / `setEmotion`。

### Phase 6：视觉镜像 V1 — 点头 / 摇头 ✅

- 目标：实现“我点头它点头，我摇头它摇头”的动作镜像。
- 主要结果：
  - `core/vision/visionService.ts`：
    - 在 FaceMesh 结果上估算头部 `yaw/pitch`，使用滑动窗口检测：
      - pitch 上下波动大 → `nod`；
      - yaw 左右波动大 → `shakeHead`。
  - `components/VisionMirrorPanel.tsx`：
    - 支持 `onHeadMotion('nod'|'shakeHead')` 回调。
  - `AdvancedDigitalHumanPage.tsx`：
    - `vision` Tab 中，根据 `onHeadMotion` 调用 `digitalHumanEngine.playAnimation('nod'|'shakeHead')`。

---

## 3. 规划中的阶段

### Phase 7：视觉镜像 V2 — 上半身动作（举手 / 挥手） ⏳

- 目标：让数字人的手部/上半身动作也能跟随用户。
- 建议内容：
  - 引入 Pose 模型（例如 MediaPipe Pose），检测：
    - 手腕相对肩膀的高度 / 水平位置；
    - 手在头部附近的快速左右移动。
  - 定义简化动作：`raiseHand` / `waveHand` 等。
  - 映射到数字人动画：
    - `raiseHand` → `playAnimation('wave' or 'raiseHand')`；
    - `waveHand` → `playAnimation('wave')`。
- 与现有架构的关系：
  - 只扩展 `visionService` / `visionMapper` 和 `DigitalHumanEngine` 的 `playAnimation` 调用，无需改后端。

### Phase 8：LLM Provider 抽象 + 多模型支持 ⏳

- 目标：让后端对话服务可以无痛切换 OpenAI / DeepSeek / Moonshot / Qwen 等不同 LLM 提供商。
- 建议内容：
  - 在 `DialogueService` 内部增加 `provider` 配置枚举和统一 `call_llm(provider, messages, meta)` 函数。
  - 为不同 provider 实现：
    - 请求构造（URL、Header、Body）；
    - 响应解析（得到 `replyText` / `emotion` / `action`）。
  - 保持 `/v1/chat` 的接口不变，前端无需改动。

### Phase 9：语音 Provider 抽象 + 云端 TTS / ASR ⏳

- 目标：从“浏览器 Web Speech API”迈向“可切换的语音服务（本地 / 云端）”。
- 建议内容：
  - 在 `core/audio/audioService.ts` 中引入 provider 概念：
    - `browser-webspeech`（当前实现）；
    - `backend-tts` / `backend-asr`（调用 FastAPI `/v1/tts`、`/v1/asr`）。
  - 在配置层决定当前使用哪种 provider，或按场景切换。
- 与架构关系：
  - UI 仍然只依赖 `audioService.speak()`、`startListening()` 等高层接口。

### Phase 10：记忆与人格系统 ⏳

- 目标：让数字人具备“记住你”的能力，并有稳定的 persona。
- 建议内容：
  - 短期：
    - 在后端维护 per-session 的对话记忆（有限轮数 + 重要摘要）。
    - 使用简单存储（文件 / 轻量数据库）。
  - 中期：
    - 引入本地或云端向量存储，用于长期记忆检索。
- 与 airi 的对比借鉴：
  - airi 使用 DuckDB WASM / pglite 做浏览器侧记忆；你可以先从后端简单持久化做起，再考虑前端本地 DB。

### Phase 11：场景化 Skill / 插件系统（外部集成） ⏳

- 目标：让数字人具备“技能”，可扩展地接入外部系统（如游戏、工具、企业 API）。
- 建议内容：
  - 在后端定义统一 Skill 接口：
    - `runSkill(name, payload) → result`。
  - 在 LLM Prompt 中为不同场景注册不同 Skill 能力。
  - 先从简单的工具（如天气查询、日程查询）开始，再扩展到更复杂的场景。
- 借鉴 airi：
  - airi 面向 Minecraft / Factorio / Discord 等做了深度集成，你可以先围绕自己真实需要的业务场景做小而精的 Skill。

### Phase 12：桌面版 / 常驻数字人（Tauri / Electron） ⏳

- 目标：让数字人以“桌面宠物 / 常驻助手”形态运行，而不仅仅是浏览器页面。
- 建议内容：
  - 采用 Tauri / Electron 将现有 Web 前端封装成桌面应用。
  - 后端可以：
    - 本地 FastAPI 服务；或
    - 远程云服务（通过 HTTPS 调用）。
- 与当前架构的关系：
  - 现有 React + core/service/engine 架构无需大改，只是运行环境从浏览器变为桌面 WebView。

---

## 4. 近期优先级建议

综合实现收益与工程复杂度，建议接下来 2~3 个迭代优先完成：

1. **Phase 7：视觉镜像 V2（上半身动作）**
   - 进一步强化“我怎么动，它也怎么动”的感知能力。
2. **Phase 8：LLM Provider 抽象**
   - 为将来切换国内外不同 LLM 提供商打好基础，避免后端逻辑越写越耦合某一家。
3. **Phase 9：语音 Provider 抽象**
   - 为后续上云端 TTS/ASR 做准备，同时保留浏览器 Web Speech 的兜底能力。

记忆（Phase 10）和 Skill 系统（Phase 11）可以在上述基础打牢之后，再按真实业务需求逐步推进。
