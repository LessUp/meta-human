# 2026-04-29 终极重构与架构收尾

## 概述

对 MetaHuman Engine 执行全方位终极重构，清理 3 个过期 worktree、4 个残留分支、20+ 冗余文件，
合并 p0-foundation-observability 核心改动，重写所有 AI 辅助开发配置，使项目达到可归档的工业级稳定状态。

## 核心改动

### 架构（合并自 p0-foundation-observability）

- **dialogueOrchestrator.ts**: turnId 轮次所有权隔离，防止跨轮次状态污染
- **chatSessionStore.ts**: 本地持久化（sessionId + 聊天历史）、消息数限制（100 条）、streaming 占位符过滤
- **systemStore.ts**: ConnectionDiagnostics 健康探测、recordConnectionHealth 行为、初始状态工厂函数
- **chatTransport.ts**: WSServerEvent union 类型缩窄修复、`as const` 字面量类型断言
- **audioService.ts**: ASR 配置可选属性非空断言修复
- **wsClient.ts**: 移除未使用的 resolveConnect 字段

### 清理

- 删除: `.omc/`, `Dockerfile`, `docker/`, `docker-compose.yml`, `render.yaml`, `lighthouserc.json`, `docs/superpowers/`, `docs/portal.html`, `RELEASE_NOTES.md`, `CHANGELOG.zh-CN.md`, `CLAUDE.local.md`, `.claude/plans/`, `.claude/skills/frontend-design/`
- 移除 3 个 worktree + 4 个分支，仅保留 master
- 重写 `.gitignore`

### 文档

- 深度重写 `AGENTS.md`（文件影响矩阵 + 调试指南 + 禁止清单）
- 精简 `CLAUDE.md`（Claude Code 专属工作流）
- 精简 `copilot-instructions.md`
- README.md / README.zh-CN.md: 修正 badges/版本号/路径别名/部署段落

### CI

- ci.yml: release body 改为 `generate_release_notes: true`
- build-pages.sh: 移除 portal.html 复制
- OpenSpec config.yaml: 更新技术栈版本

### 测试修复

- 2 个测试因 speakWith 变为 fire-and-forget 而失败 → 添加 microtask flush

## 验证

- ✅ TypeScript: tsc --noEmit 无错误
- ✅ ESLint: 0 errors, 0 warnings
- ✅ Tests: 12 files, 165 tests passed
- ✅ Build: production build 成功
- ✅ Build:pages: GitHub Pages build 成功
- ✅ Git: 仅 master 分支，无 worktree
