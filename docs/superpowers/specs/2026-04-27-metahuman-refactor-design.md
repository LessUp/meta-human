# MetaHuman Engine 全方位重构设计规范

**日期**: 2026-04-27
**状态**: 已批准
**作者**: Claude Code

---

## 一、背景与动机

### 1.1 当前问题

MetaHuman Engine 项目经过多轮迭代开发后，虽然架构设计良好，但存在以下"过度工程化"问题：

| 问题类别           | 具体表现                                      |
| ------------------ | --------------------------------------------- |
| **安全漏洞**       | 20 个漏洞（15 high, 5 moderate）              |
| **依赖过时**       | React、Three.js、Vite 等核心依赖主版本落后    |
| **CI/CD 过度设计** | 3 个工作流 ~300 行 YAML，matrix 测试无意义    |
| **文档冗余**       | 中英文完全镜像 + AGENTS.md/CLAUDE.md 60% 重叠 |
| **版本声明不一致** | Node 版本在 package.json/CI/.nvmrc 不统一     |

### 1.2 目标状态

- 依赖升级到最新稳定版本
- 文档精简但保持双语支持
- CI/CD 极简化
- Git Pages 现代化展示
- AI 工具链优化配置
- 达到可归档的稳定完结状态

---

## 二、技术决策

### 2.1 依赖升级策略

**决策**: 激进策略 - 升级到最新稳定版本

**升级目标**:

| 包名               | 当前版本 | 目标版本 | Breaking Changes 风险           |
| ------------------ | -------- | -------- | ------------------------------- |
| react              | 18.3.1   | 19.2.5   | 中 - forwardRef 行为变化        |
| react-dom          | 18.3.1   | 19.2.5   | 中                              |
| three              | 0.158.0  | 0.184.0  | 低 - 废弃 API 检查              |
| @react-three/fiber | 8.15.19  | 9.6.0    | 高 - useFrame/useThree API 变化 |
| @react-three/drei  | 9.88.13  | 10.7.7   | 高 - 配合 R3F 升级              |
| vite               | 5.4.21   | 8.0.10   | 中 - 配置 API 变化              |
| typescript         | 5.8.3    | 6.0.3    | 低                              |
| tailwindcss        | 3.4.18   | 4.2.4    | 高 - 配置格式完全重写           |
| zustand            | 4.5.7    | 5.0.12   | 低                              |
| lucide-react       | 0.294.0  | 1.11.0   | 低                              |

**Node 版本统一**: 所有位置统一为 Node 22.x

### 2.2 文档策略

**决策**: 中英双语 - 保持但优化结构

**精简原则**:

1. 删除 `docs/` 下的冗余 changelog 和过时文档
2. 合并 AGENTS.md 与 CLAUDE.md 的重叠内容
3. 双语文档采用"核心同步，细节差异化"策略

### 2.3 CI/CD 策略

**决策**: 极简模式 - 合并简化工作流

**合并方案**: 3 个工作流 → 1 个工作流

删除:

- `.github/workflows/pages.yml`
- `.github/workflows/release.yml`
- Matrix 测试配置
- 重复的缓存配置

### 2.4 Git Pages 策略

**决策**: 重新设计 - 现代美观展示页

**设计要点**:

- 使用项目本身的 3D 引擎展示 demo
- 响应式设计，支持移动端
- 突出特色：实时对话、情绪动画、多模态交互

---

## 三、实施计划

### Phase 1: 依赖升级与安全修复

**并行执行**: 可与其他 Phase 1 任务并行

**任务列表**:

1. 创建升级分支 `refactor/dependency-upgrade`
2. 升级 React 18 → 19
3. 升级 Three.js + R3F + Drei
4. 升级 Vite 5 → 8
5. 升级 Tailwind 3 → 4
6. 升级其他依赖
7. 统一 Node 版本声明
8. 运行测试并修复问题
9. 手动测试 3D 场景

**关键文件**:

- `package.json`
- `package-lock.json`
- `.nvmrc`
- `.github/workflows/*.yml`
- `vite.config.ts`
- `tailwind.config.js`

### Phase 2: 文档重构与 OpenSpec 规范化

**并行执行**: 可与 Phase 1 并行

**任务列表**:

1. 审计并删除冗余文档
2. 重构 AGENTS.md - OpenSpec 驱动流程
3. 精简 CLAUDE.md - 项目核心指导
4. 更新 README.md - 项目展示
5. 补充 OpenSpec 规范文档
6. 检查所有链接有效性

**删除文件**:

```
docs/api/*.en.md (合并到主文档)
docs/architecture/*.en.md (合并到主文档)
过时的 changelog 文件
```

**修改文件**:

- `AGENTS.md`
- `CLAUDE.md`
- `CLAUDE.local.md`
- `README.md`
- `docs/` 目录结构

**新建文件**:

- `openspec/specs/frontend-design.md` (如需要)

### Phase 3: CI/CD 极简化

**依赖**: Phase 1 完成后执行

**任务列表**:

1. 创建合并后的 `ci.yml`
2. 删除 `pages.yml` 和 `release.yml`
3. 测试 PR 触发流程
4. 测试 master 推送部署流程
5. 测试 tag 发布流程

**新建文件**:

- `.github/workflows/ci.yml` (合并版)

**删除文件**:

- `.github/workflows/pages.yml`
- `.github/workflows/release.yml`

### Phase 4: Git Pages 重新设计

**依赖**: Phase 1-2 完成后执行

**任务列表**:

1. 设计 landing page 结构
2. 创建展示组件
3. 集成 3D demo 区域
4. 响应式适配
5. 部署并验证

**新建/修改文件**:

- `src/pages/LandingPage.tsx`
- `src/components/landing/` 目录

### Phase 5: AI 工具链配置

**并行执行**: 可与 Phase 2-4 并行

**任务列表**:

1. 更新 `.github/copilot-instructions.md`
2. 配置 `.vscode/settings.json` LSP 规则
3. 清理无用的 CLI Skills
4. 评估 MCP 配置需求

---

## 四、验证标准

### 4.1 功能验证

- [ ] 所有测试通过 (`npm run test:run`)
- [ ] TypeScript 编译无错误 (`npm run typecheck`)
- [ ] Lint 无错误 (`npm run lint`)
- [ ] 构建成功 (`npm run build`)
- [ ] 3D 场景正常运行
- [ ] 对话功能正常工作

### 4.2 部署验证

- [ ] CI 工作流正常运行
- [ ] GitHub Pages 正常部署
- [ ] 线上 demo 可访问

### 4.3 文档验证

- [ ] 所有链接有效
- [ ] 文档与代码同步
- [ ] 双语内容完整

---

## 五、风险与缓解

| 风险                      | 概率 | 影响 | 缓解措施                 |
| ------------------------- | ---- | ---- | ------------------------ |
| React 19 breaking changes | 中   | 高   | 逐个升级，每步测试       |
| R3F v9 API 变化           | 高   | 高   | 查阅迁移指南，增量修改   |
| Tailwind v4 配置重写      | 高   | 中   | 使用官方迁移工具         |
| CI 合并后功能缺失         | 低   | 中   | 保留原文件备份，快速回滚 |

---

## 六、预期成果

1. **依赖状态**: 所有依赖升级到最新稳定版本，无安全漏洞
2. **文档状态**: 精简双语文档，OpenSpec 规范完整
3. **CI/CD 状态**: 单一工作流，~100 行 YAML
4. **Git Pages**: 现代化展示页面，突出项目特色
5. **AI 工具**: 优化的 CLAUDE.md、AGENTS.md、copilot-instructions.md

---

**批准者**: Shane
**批准日期**: 2026-04-27
