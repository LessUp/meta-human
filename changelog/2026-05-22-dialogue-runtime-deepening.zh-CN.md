# 架构深化：对话运行时下沉到服务容器

## 变更摘要

1. **移除应用路径对全局对话单例的依赖**
   - `Services` 新增 `dialogue: DialogueOrchestrator`
   - 新增 `useDialogue()` Hook
   - `useChatStream`、`useSessionManager`、`ASRService` 改为使用 Provider 作用域内的对话运行时

2. **修复 `DigitalHumanEngine` 事件接口不一致**
   - 非法 expression / emotion / behavior 输入现在统一归一化为 `neutral` 或 `idle`
   - 事件 payload 与实际写入 store 的值保持一致，避免下游监听者收到不可能状态

3. **收紧 UI store 订阅面**
   - `ControlPanel` 改为使用精确 selector
   - `DigitalHumanPage` 改为按字段订阅，减少无关状态变化引发的重渲染

4. **补齐回归测试**
   - 新增 `src/__tests__/audioService.test.ts`
   - 新增 `src/__tests__/ControlPanel.test.tsx`
   - 新增 `src/__tests__/useSessionManager.test.tsx`
   - 扩展服务层 / Hook / Engine 相关测试

## 影响范围

- `src/core/services*.ts`
- `src/core/audio/audioService.ts`
- `src/core/avatar/DigitalHumanEngine.ts`
- `src/hooks/useChatStream.ts`
- `src/hooks/useSessionManager.ts`
- `src/components/ControlPanel.tsx`
- `src/pages/DigitalHumanPage.tsx`
- `src/__tests__/`

## 测试结果

- TypeScript 类型检查：通过
- ESLint：通过
- Vitest：175 passed
- Build：通过
