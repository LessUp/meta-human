# 2025-11-18 Phase 1 前端重构：抽取音频服务

## 变更内容

- 新增 `src/core/audio/audioService.ts`：
  - 从 `store/digitalHumanStore.ts` 中迁移 `TTSService` 和 `ASRService` 的完整实现。
  - 保持对 `useDigitalHumanStore` 的依赖，用于更新 `isSpeaking`、`isRecording` 等状态。
  - 导出 `ttsService` 与 `asrService` 单例实例供页面使用。
- 精简 `store/digitalHumanStore.ts`：
  - 移除 `TTSService`、`ASRService` 类定义及其实例导出，仅保留数字人状态和控制方法（play/pause/reset 等）。
- 更新引用：
  - `DigitalHumanPage.tsx` 和 `AdvancedDigitalHumanPage.tsx`：
    - 不再从 `store/digitalHumanStore` 导入 `ttsService`、`asrService`，改为从 `core/audio/audioService` 导入。
  - `__tests__/digitalHuman.test.tsx`：
    - 测试中引用的 `TTSService`、`ASRService` 改为从 `core/audio/audioService` 导入。

## 目的

- 将语音相关逻辑从全局 store 中抽离，形成独立的 `audioService` 层，为后续：
  - 接入后端 TTS/ASR 服务；
  - 在对话层和视觉层中复用音频能力；
  打下清晰的分层基础。

## 备注

- 本次重构未改变对外行为，UI 与现有语音交互功能应保持原有体验。
- 后续 Phase 1 将继续实现：
  - `core/avatar/DigitalHumanEngine.ts`；
  - 页面与 Engine/Service 的解耦；
  并在完成后追加新的 changelog 记录。
