# CLAUDE.md

Claude Code 项目开发指南。完整架构、模式和 OpenSpec 工作流请参阅 `AGENTS.md`。

## 开发命令

```bash
npm install          # 安装依赖
npm run dev          # 启动开发服务器 (端口 5173)
npm run build        # 生产构建
npm run preview      # 预览生产构建
npm run lint         # ESLint 检查
npm run lint:fix     # 自动修复 ESLint 问题
npm run format       # Prettier 格式化
npm run typecheck    # TypeScript 类型检查
npm run test         # Vitest 监视模式
npm run test:run     # 运行测试一次
npm run test:coverage # 生成覆盖率报告
```

## 构建模式

| 命令            | 用途                  |
| --------------- | --------------------- |
| `build`         | 标准生产构建          |
| `build:mobile`  | 移动端优化构建        |
| `build:desktop` | 桌面端优化构建        |
| `build:ar`      | AR 场景构建           |
| `build:pages`   | GitHub Pages 部署构建 |
| `build:analyze` | 构建产物分析          |

## 技术栈

- **框架:** React 19 + TypeScript
- **构建:** Vite 6
- **3D:** Three.js + React Three Fiber v9 + Drei
- **状态:** Zustand 5
- **样式:** Tailwind CSS 4
- **测试:** Vitest + Testing Library

**路径别名:** `@/*` → `src/*`

## 环境要求

- Node.js >= 22.0.0
- npm >= 10.0.0

## 测试说明

- 测试需 mock Three.js、R3F 和浏览器 API
- 主测试文件: `src/__tests__/digitalHuman.test.tsx`
- 浏览器 API (speech、media) 需要 mock
- 覆盖率目标: ≥ 50%
