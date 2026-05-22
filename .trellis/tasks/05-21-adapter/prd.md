# PRD: 架构优化 — 消除透传层、集中Adapter定义、消除模块级状态

## 背景

通过架构分析发现以下摩擦点：

1. **纯透传层** — `DigitalHumanViewer.tsx` 仅重新导出，无价值
2. **Adapter分散** — 服务层 adapter 定义分散，难以看到完整依赖图
3. **模块级状态** — `dialogueOrchestrator` 和 `visionService` 的模块级状态导致测试泄漏

## 目标

1. 删除 `DigitalHumanViewer.tsx` 透传层
2. 集中所有 adapter 定义到 `src/core/adapters.ts`
3. 消除模块级状态，改为类实例或 store 管理

## 范围

### In Scope

- 删除透传文件并更新导入
- 创建集中式 adapter 定义文件
- 重构 dialogueOrchestrator 为类实例
- 重构 visionService 为类实例

### Out of Scope

- ASRStateAdapter 拆分（工作量过大，单独任务）
- 聊天流架构文档（低优先级）

## 验收标准

- [ ] 所有导入 DigitalHumanViewer 的地方已更新
- [ ] 所有 adapter 定义集中在 `src/core/adapters.ts`
- [ ] dialogueOrchestrator 无模块级状态
- [ ] visionService 无模块级状态
- [ ] 现有测试通过
- [ ] 类型检查通过
