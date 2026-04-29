# Copilot Instructions — MetaHuman Engine

基于 React 19 + Three.js + TypeScript 的 3D 数字人交互引擎。
完整规范参见项目根目录 `AGENTS.md`。

## 核心规则

1. 使用 `@/*` 路径别名（`@/components/...`, `@/store/...`）
2. 服务层通过 `useXStore.getState()` 读写状态（非 props）
3. 所有外部调用必须有降级方案
4. `core/` 目录禁止引入 React 依赖

## 常用命令

```bash
npm run dev          # 开发服务器
npm run typecheck    # 类型检查
npm run lint         # ESLint
npm run test:run     # 测试
```

## 关键文件

| 文件 | 职责 |
|------|------|
| `src/core/avatar/DigitalHumanEngine.ts` | 数字人控制门面 |
| `src/core/dialogue/dialogueService.ts` | 对话服务（重试/降级） |
| `src/core/dialogue/dialogueOrchestrator.ts` | 对话轮次编排 |
| `src/store/digitalHumanStore.ts` | 数字人状态 |
| `src/components/DigitalHumanViewer.tsx` | 3D 视口组件 |
