# Avatar Presentation Protocol 重构

日期：2026-03-13

## 变更内容

- 新增 `src/core/avatar/avatarPresentation.ts` 作为统一人物表现协议层，集中定义 `AvatarPresentation`、`AvatarCommand`、表现状态、校验集合、行为/姿态/动作映射与动画时长。
- 调整 `src/store/digitalHumanStore.ts`，改为复用统一协议类型与选择器，并修正 `setBehavior()` 不再意外覆盖当前动画。
- 重构 `src/core/avatar/DigitalHumanEngine.ts`，将 emotion / expression / behavior / animation 的兼容入口收口到统一命令提交逻辑，保留既有 API，同时新增 `applyCommand()` 作为协议入口。
- 调整 `src/core/dialogue/dialogueOrchestrator.ts` 与 `src/core/audio/audioService.ts`，优先通过 `digitalHumanEngine` 驱动说话、倾听、思考与预设动作，减少对 store 底层字段的直接竞争写入。
- 更新相关测试桩与属性测试，覆盖新的协议依赖字段与更完整的行为集合。

## 背景

原有人物系统中，`emotion`、`expression`、`behavior`、`animation` 的语义边界重叠，页面、对话、语音和引擎都可能直接写 store，导致状态所有权分散、Cyber/VRM 难以共享统一输入模型。本次重构先引入稳定的中间表现协议，为后续 Stage Driver 分层和渲染适配打基础。

## 验证

- 使用 `./node_modules/.bin/tsc --noEmit` 通过类型检查。
- 使用 `./node_modules/.bin/vitest run src/__tests__/store.test.ts src/__tests__/engine.test.ts src/__tests__/properties/engine.property.test.ts src/__tests__/properties/orchestrator.property.test.ts src/__tests__/properties/tts.property.test.ts src/__tests__/properties/asr.property.test.ts --silent`，共 82 项测试全部通过。
- 使用 `./node_modules/.bin/vite build` 构建通过；仍有既存的 chunk size warning，但不阻塞产物生成。

## 备注

- 当前 `npm run build` / `npm run test:run` 在本环境下会因 `spawn pwsh ENOENT` 失败，因此本次改用本地二进制直接执行 `vite`、`tsc`、`vitest` 完成验证。
