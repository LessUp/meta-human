# 架构深化：移除废弃模块、合并服务层

## 变更摘要

1. **移除废弃的 `voiceCommandProcessor.ts`**
   - 删除 `src/core/audio/voiceCommandProcessor.ts`（已标记 @deprecated）
   - 删除 `src/__tests__/voiceCommandProcessor.test.ts`
   - 更新 `src/core/audio/index.ts` 停止导出废弃函数
   - 更新 `digitalHuman.test.tsx` 使用新的 `VoiceCommandExecutor`

2. **优化服务层文件结构**
   - 保持 4 文件结构（符合 react-refresh 要求）
   - 更新 `services.ts` 为清晰的重导出入口
   - 文件职责分明：
     - `servicesContext.ts`: Context 定义
     - `createServices.ts`: 服务工厂
     - `ServicesProvider.tsx`: React Provider
     - `serviceHooks.ts`: Hooks

## 影响范围

- `src/core/audio/`: 移除废弃模块
- `src/core/services*.ts`: 结构优化
- `src/__tests__/`: 测试更新

## 测试结果

- TypeScript 类型检查：通过
- ESLint 检查：通过（0 warnings）
- Vitest 测试：165 passed
