# 2025-11-18 Roadmap 设计与文档更新

## 变更内容

- 在 `docs/` 目录新增 `digital-human-roadmap.md`：
  - 以 Phase 0 ~ Phase 12 的形式梳理数字人系统从当前 Demo 到“真正数字人”的分阶段演进计划。
  - 标记已完成阶段（Phase 0~6）与规划中的阶段（Phase 7+），并给出每个阶段的目标与建议实现内容。
  - 将来自 airi 项目中值得借鉴的理念（多 LLM Provider 抽象、本地记忆、插件/技能系统等）融入中长期规划，但保持 KISS，短期仅做必要的抽象预留。
- 更新 `docs/digital-human-architecture.md`：
  - 在「7. 说明」章节中增加一条说明，指向新的 `digital-human-roadmap.md` 文档，强调本文件聚焦架构，而具体路线与优先级在 Roadmap 中维护。

## 目的

- 将当前已落地的各个阶段（前端分层、FastAPI 后端、LLM 接入、视觉镜像表情 + 点头/摇头）系统化地串成清晰的 Roadmap。
- 为后续迭代（视觉 V2、LLM Provider 抽象、语音 Provider 抽象、记忆系统、Skill 插件系统、桌面版等）提供明确的阶段划分与优先级建议。

## 备注

- 本次变更仅涉及文档与规划，不修改任何运行时代码。
- 后续每完成一个阶段的主要功能，实现应继续在 `changelog/` 目录追加对应的阶段记录，并同步更新 Roadmap 状态。
