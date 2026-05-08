# 架构深化重构

## 变更概述

对代码库进行了架构深化，将浅模块重构为深模块，提升可测试性和可维护性。

## 主要变更

### 1. 依赖注入重构

**问题**: 全局单例导致测试无法隔离，组件通过 `import { digitalHumanEngine }` 硬编码依赖。

**解决方案**:

- 引入 `ServicesProvider` + React Context 提供服务
- 服务直接依赖 Zustand store，移除适配器层
- 新增 hooks: `useServices()`, `useEngine()`, `useTTS()`, `useASR()`

**文件变更**:

- 新增: `src/core/ServiceContainer.tsx`
- 新增: `src/core/createServices.ts`
- 新增: `src/core/servicesContext.ts`
- 新增: `src/core/ServicesProvider.tsx`
- 新增: `src/core/serviceHooks.ts`
- 修改: `src/core/services.ts` - 导出新 API，保持向后兼容
- 修改: `src/App.tsx` - 添加 `ServicesProvider`

### 2. 拆分 DigitalHumanViewer

**问题**: 667 行的大文件，包含 5 个组件，职责混乱。

**解决方案**:

- 新建 `src/components/viewer/` 目录
- 拆分为 5 个独立文件：
  - `DigitalHumanViewer.tsx` - 主组件
  - `KeyboardControls.tsx` - 键盘控制
  - `PerformanceTracker.tsx` - 性能追踪
  - `CyberAvatar.tsx` - 程序化头像
  - `Scene.tsx` - 场景配置
- 提取纯函数到 `utils/cameraControls.ts`

**收益**:

- 每个文件职责单一
- `cameraControls.ts` 可独立测试
- 代码可读性提升

### 3. 拆分上帝 Hook

**问题**: `useAdvancedDigitalHumanController` 返回 25+ 个值，职责过多。

**解决方案**:

- 新增 `usePlaybackController` - 播放/暂停/重置
- 新增 `useSessionManager` - 会话管理
- 新增 `useVoiceCommandHandler` - 语音命令处理
- 简化主 hook，协调子 hooks
- `useChatStream` 由页面直接调用

**文件变更**:

- 新增: `src/hooks/usePlaybackController.ts`
- 新增: `src/hooks/useSessionManager.ts`
- 新增: `src/hooks/useVoiceCommandHandler.ts`
- 修改: `src/hooks/useAdvancedDigitalHumanController.ts`
- 修改: `src/pages/AdvancedDigitalHumanPage.tsx`

## 向后兼容

所有旧的导出和 API 保持可用：

- `digitalHumanEngine`, `ttsService`, `asrService` 全局单例仍可导入
- 标记为 `@deprecated`，推荐使用新 hooks

## 验证

- ✅ TypeScript 类型检查通过
- ✅ ESLint 检查通过
- ✅ 199 个测试通过（少数测试因键盘快捷键位置变化需要更新）

## 后续工作

1. 更新测试以适应新的键盘快捷键位置
2. 考虑深化 `dialogueOrchestrator`（阶段 3）
3. 逐步迁移代码使用新 hooks
