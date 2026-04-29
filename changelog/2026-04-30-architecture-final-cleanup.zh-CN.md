# v2.3.0 — 架构优化与工程化清理

日期：2026-04-30

## 概述

全面审计并优化项目代码库，消除技术债务，达到归档级稳定标准。

## 变更内容

### 代码治理
- 统一页面组件导入路径为 `@/` 别名（`AdvancedDigitalHumanPage.tsx`、`DigitalHumanPage.tsx`）
- 精简 `vite.config.ts` 路径别名，仅保留 `@/` → `src/`，与 `tsconfig.json` 保持一致
- 移除 `package.json` 中无实际配置的构建脚本（`build:mobile/desktop/ar`、`preview:https`）
- 精简 `index.html` 中冗余的 DNS prefetch 和 preconnect
- 修复 `index.css` 中 `overflow-x: hidden` 与 `overflow-x: clip` 的重复声明

### 文档修复
- 修复 `CHANGELOG.md` 中 v2.2.0 链接引用缺失
- 更新 `docs/index.md` 版本号为 v2.2.0
- 修复 `README.zh-CN.md` 中指向不存在的中文文档的死链
- 移除 `docs/index.md` 中引用不存在的 `index.zh-CN.md`
- 同步 README/README.zh-CN.md 中的脚本列表（移除已删除的命令引用）

### 工程化清理
- 移除 `openspec/` 目录及 `@fission-ai/openspec` devDependency
- 移除 Claude skills 中的 openspec 相关技能
- 移除 ESLint 配置中对不存在的 `.worktrees` 目录的忽略
- 移除 `.gitignore` 中过时的 `.openspec/` 和 `.worktrees/` 条目
- 版本号同步至 2.2.0

### 验证结果
- TypeScript 类型检查：✅ 通过
- ESLint：✅ 0 errors, 0 warnings
- 测试套件：✅ 12 files, 165 tests passed
- 生产构建：✅ 成功（445KB gzipped）
