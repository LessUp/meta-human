# 消除废弃单例 — 统一服务接入层

## Goal

消除 `src/core/services.ts` 中的废弃全局单例（`digitalHumanEngine`, `ttsService`, `asrService`），将所有消费者迁移到已有的 `ServicesProvider` + `useServices()` hooks 体系，然后删除废弃代码。

## What I already know

### 当前架构状态

**新的 Context 体系已就绪：**

- `ServicesProvider.tsx` — 通过 React Context 提供服务实例
- `servicesContext.ts` — Context 定义
- `serviceHooks.ts` — `useServices()`, `useEngine()`, `useTTS()`, `useASR()`
- `createServices.ts` — 服务工厂函数

**已迁移的消费者（使用 hooks）：**

- `src/hooks/usePlaybackController.ts` — `useEngine`
- `src/hooks/useAdvancedDigitalHumanController.ts` — `useEngine`, `useASR`
- `src/hooks/useVoiceCommandHandler.ts` — `useEngine`, `useASR`, `useTTS`
- `src/App.tsx` — `ServicesProvider`

**未迁移的消费者（使用废弃单例）：**

- `src/pages/DigitalHumanPage.tsx` — `ttsService`, `asrService`, `digitalHumanEngine`
- `src/hooks/useVoiceInteraction.ts` — `ttsService`, `asrService`
- `src/hooks/useChatStream.ts` — `ttsService`, `digitalHumanEngine`
- `src/core/dialogue/dialogueOrchestrator.ts` — `digitalHumanEngine`
- `src/lib/voiceCommands.ts` — 全部三个（已废弃，待删除）

### 关键约束

1. `dialogueOrchestrator.ts` 不是 hook，无法直接使用 `useEngine()`。它的 `prepareDialogueTurn` 和 `handleDialogueResponse` 函数直接调用 `digitalHumanEngine`。
2. `useVoiceInteraction.ts` 是 hook，可以直接迁移到 `useTTS()` + `useASR()`。
3. `useChatStream.ts` 是 hook，可以直接迁移到 `useTTS()` + `useEngine()`。
4. `DigitalHumanPage.tsx` 是组件，可以直接使用 hooks。
5. `lib/voiceCommands.ts` 已标记 `@deprecated`，在 `DigitalHumanPage.tsx` 迁移后可直接删除。

## Assumptions (temporary)

- `ServicesProvider` 已在 `App.tsx` 中正确包裹应用
- 所有需要迁移的消费者都在 `ServicesProvider` 子树中渲染
- `dialogueOrchestrator` 的函数只在 React 组件/hook 的调用链中被调用（不在独立的 worker 或模块初始化中）

## Open Questions

（无）

## Requirements (evolving)

- 所有消费者从废弃单例迁移到 Context hooks
- `dialogueOrchestrator` 的 `digitalHumanEngine` 依赖通过参数注入
- 迁移完成后删除 `services.ts` 中的废弃单例代码
- 删除 `lib/voiceCommands.ts`（已废弃）
- 所有现有测试继续通过

## Acceptance Criteria (evolving)

- [x] `src/core/services.ts` 不再导出 `digitalHumanEngine`, `ttsService`, `asrService`
- [x] `src/lib/voiceCommands.ts` 被删除
- [x] 所有消费者使用 `useServices()` hooks 或参数注入
- [x] `npm run typecheck` 通过
- [x] `npm run lint` 通过
- [x] `npm run test:run` 通过（13 文件，199 用例全部通过）

## Definition of Done

- 所有测试通过
- Lint / typecheck 通过
- 无废弃单例残留

## Out of Scope (explicit)

- 重构 `dialogueOrchestrator` 的模块级可变状态（候选方案 2）
- 拆分 `audioService.ts`（候选方案 4）
- 拆分 `systemStore.ts`（候选方案 5）

## Decision (ADR-lite)

**Context**: `dialogueOrchestrator` 是纯函数模块，不是 hook，无法使用 `useEngine()`。需要决定如何注入 `digitalHumanEngine` 依赖。

**Decision**: 方案 A — 通过函数参数注入。在 `prepareDialogueTurn` 和 `handleDialogueResponse` 的参数中增加 `engine` 字段，调用方通过 `useServices()` 获取 engine 并传入。

**Consequences**:

- 函数签名变更，所有调用点需要传入 engine
- 测试可以注入 mock engine，无需加载全局单例
- 为后续重构模块级可变状态（候选方案 2）奠定基础

## Technical Notes

- `createServices.ts` 工厂函数与 `services.ts` 中的废弃单例使用相同的 store 适配器逻辑
- 迁移后，`services.ts` 只保留 Context/hooks 的 re-export
- `dialogueOrchestrator` 的迁移是本任务的核心难点
- 测试文件不直接导入 `lib/voiceCommands.ts`，删除该文件不会影响测试
- `voiceCommandProcessor.ts` 是另一个废弃文件，属于候选方案 3（语音命令重构），不在本任务范围内
