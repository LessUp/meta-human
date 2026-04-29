# CLAUDE.md

Claude Code 项目专用指南。完整架构和开发规范参见 `AGENTS.md`。

## 快速开始

```bash
npm run dev          # 启动开发服务器 (http://localhost:5173)
npm run typecheck    # TypeScript 类型检查
npm run lint         # ESLint 检查
npm run test:run     # 运行全部测试
npm run build:pages  # GitHub Pages 构建
```

## 构建模式

| 命令            | 用途                  |
| --------------- | --------------------- |
| `build`         | 标准生产构建          |
| `build:pages`   | GitHub Pages 部署构建（base: `/meta-human/`） |
| `build:analyze` | 构建产物分析（Bundle Visualizer） |

## 环境要求

- Node.js ≥ 22.0.0 / npm ≥ 10.0.0
- `.nvmrc` 已配置，使用 `nvm use` 即可

## 测试须知

- 测试环境: jsdom（`vitest.config.ts`）
- Three.js / R3F / 浏览器 API（Speech, Canvas）需要 mock
- 主测试入口: `src/__tests__/`
- 覆盖率阈值: lines ≥ 40%, functions ≥ 34%, branches ≥ 30%
- `speakWith` 是 fire-and-forget，测试断言前需 flush microtasks

## 项目约定

1. **单分支策略**: 所有工作在 `master` 分支完成
2. **修改记录**: 所有变更在 `changelog/` 下创建条目
3. **路径别名**: 始终使用 `@/` 前缀（如 `@/store/systemStore`）
4. **Zustand 5**: `set` 函数使用 `replace?: false`（非 `boolean`）
5. **Tailwind CSS 4**: 使用 `@import 'tailwindcss'` + `@theme` 语法
