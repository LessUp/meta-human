# 架构优化：消除透传层、集中Adapter定义、消除模块级状态

## 变更类型

- refactor: 架构优化

## 变更内容

### 1. 删除透传层

- 删除 `src/components/DigitalHumanViewer.tsx`（仅重新导出，无价值）
- 更新所有导入路径直接使用 `@/components/viewer`

### 2. 集中 Adapter 定义

- 新建 `src/core/adapters.ts`，集中所有服务层与状态层的适配器接口和工厂函数
- 更新 `createServices.ts` 使用集中式 adapters
- 更新 `audioService.ts` 从 adapters.ts 导入接口
- 更新 `DigitalHumanEngine.ts` 从 adapters.ts 导入接口

### 3. 消除模块级状态

- 重构 `dialogueOrchestrator.ts` 为 `DialogueOrchestrator` 类
- 模块级状态改为类实例状态，避免测试间泄漏
- 保留向后兼容的函数导出（标记为 deprecated）

### 4. 收紧运行时所有权与清理

- `ServicesProvider` 统一负责共享 `engine` / `tts` / `asr` 的释放
- `useAdvancedDigitalHumanController` 不再在页面卸载时误销毁应用级单例服务
- `useChatStream` 在卸载和会话切换时主动中止未完成的对话轮次，避免悬挂流式回调

### 5. 修复状态透传与适配器安全性

- `AdvancedDigitalHumanPage` 改为从 store 读取真实 `isMuted`，修复聊天流始终未静音的问题
- `src/core/adapters.ts` 改为静态 ESM 导入，移除浏览器侧运行时 `require()` 调用
- 新增回归测试覆盖 Provider 清理、控制器生命周期、聊天流卸载清理、静音状态透传

## 影响范围

- `src/components/DigitalHumanViewer.tsx`（已删除）
- `src/pages/AdvancedDigitalHumanPage.tsx`
- `src/pages/DigitalHumanPage.tsx`
- `src/__tests__/digitalHuman.test.tsx`
- `src/core/adapters.ts`（新增）
- `src/core/createServices.ts`
- `src/core/audio/audioService.ts`
- `src/core/avatar/DigitalHumanEngine.ts`
- `src/core/dialogue/dialogueOrchestrator.ts`
- `src/core/ServicesProvider.tsx`
- `src/hooks/useAdvancedDigitalHumanController.ts`
- `src/hooks/useChatStream.ts`
- `src/__tests__/AdvancedDigitalHumanPage.test.tsx`（新增）
- `src/__tests__/ServicesProvider.test.tsx`（新增）
- `src/__tests__/useAdvancedDigitalHumanController.test.tsx`
- `src/__tests__/useChatStream.test.tsx`

## 验证

- ✅ TypeScript 类型检查通过
- ✅ ESLint 检查通过
- ✅ 168 个测试全部通过

## 参考

- 架构分析发现的问题：透传层、Adapter分散、模块级状态泄漏
- 解决方案：删除透传、集中定义、类实例化
