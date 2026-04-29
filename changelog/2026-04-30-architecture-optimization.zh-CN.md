# 2026-04-30 架构优化与文档治理

## 概述

对 MetaHuman Engine 执行架构优化，将 Python 后端移至 `examples/` 目录，
清理文档冗余，优化 Git Pages 构建流程，使项目达到更清晰的模块化状态。

## 核心改动

### 架构重组

- **server/ → examples/backend-python/**: Python 后端移至示例目录，明确标注为可选参考实现
- **README.md / README.zh-CN.md**: 添加后端可选说明，更新 Node.js 版本要求（≥22）
- **docs/guide/README.md**: 移除 Python 前置要求，更新项目结构图
- **docs/index.md**: 更新版本号为 v2.1.0

### 文档治理

- 删除 `changelog/CHANGELOG.zh-CN.md`（根目录 CHANGELOG.md 已足够）
- 统一 Node.js 版本要求：所有文档标注 ≥ 22

### 工程化优化

- **scripts/build-pages.sh**: 
  - 添加构建时间戳注入
  - 生成 sitemap.xml
  - 输出构建产物大小
- **.gitignore**: 
  - 添加 `*.tsbuildinfo`
  - 更新 Python 注释为 `examples/backend-python/`
  - 保留 `.vscode/settings.json` 和 `.vscode/mcp.json`
- **.vscode/**: 添加 VSCode 配置文件（MCP + settings）

### GitHub 元数据

- 更新仓库描述为更简洁的版本

## 验证

- ✅ TypeScript: tsc --noEmit 无错误
- ✅ ESLint: 0 errors, 0 warnings
- ✅ Tests: 12 files, 165 tests passed
- ✅ Build: production build 成功（17.39s）
- ✅ Git: 仅 master 分支，无 worktree
