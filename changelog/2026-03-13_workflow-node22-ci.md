# Workflow Node 22 CI 调整

日期：2026-03-13

## 变更内容

- 将前端 CI 的 Node 版本从 `18` 提升到 `22`
- 保持 `npm ci`、lint 与测试流程不变，仅修正 Hosted Runner 上的运行时版本
- 避免依赖树中的 `EBADENGINE` 继续导致前端 job 在安装阶段失败

## 背景

该仓库前端依赖已要求 `Node 20` 或 `>=22`，原先主线 CI 仍固定在 Node 18，导致 GitHub Hosted Runner 上的 `npm ci` 无法通过。本次调整只收敛运行时版本，不改变项目构建逻辑。
