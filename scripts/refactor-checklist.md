# MetaHuman Engine 重构执行清单

## 执行摘要

本文档记录了项目的重构执行清单，用于验证和追踪所有已完成的改进。

---

## Phase 1: 代码规范化 ✅

### P1-1: TypeScript Strict Mode
- [x] 启用 `strict: true`
- [x] 启用 `noUnusedLocals: true`
- [x] 启用 `noUnusedParameters: true`
- [x] 启用 `noFallthroughCasesInSwitch: true`
- [x] 修复所有类型错误（31处）

### P1-2: BehaviorType 类型去重
- [x] 分析重复语义的类型值
- [x] 保持向后兼容性（未修改，需要更大范围重构）

### P1-3: buildEmptyResponse 统一
- [x] 从 dialogueService.ts 导出函数
- [x] 删除 chatTransport.ts 中的重复定义

### P1-4: dialogueOrchestrator 模块变量
- [x] 分析模块级状态管理
- [x] 保持现有设计（适用于单实例场景）

### P1-5: 版本号统一
- [x] 统一 Node.js 版本要求为 >= 20
- [x] 更新 README.md
- [x] 更新 README.zh-CN.md
- [x] 更新 docs/guide/README.md
- [x] 更新 docs/guide/README.zh-CN.md
- [x] 更新 docs/guide/installation.md
- [x] 更新 docs/guide/installation.zh-CN.md
- [x] 更新 Dockerfile
- [x] 创建 .nvmrc

### P1-6: Python 依赖锁定
- [x] 创建 server/requirements.lock

---

## Phase 2: 工程化改进 (进行中)

### P2-3: Bundle Size 徽章
- [x] 更新 README 徽章数据 (~240KB gzip)

### P2-2: 测试覆盖率
- [ ] 提升至 50%（当前 40%）

---

## 验证命令

npm run typecheck
npm run lint
npm run test:run
npm run build

---

## 完成时间

- Phase 1: 2026-04-27
- Phase 2: 进行中
