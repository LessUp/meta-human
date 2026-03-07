# AGENTS.md — MetaHuman 多 Agent 协作指南

本文件定义了 AI Agent 在本项目中的协作规范、职责边界和工作流程。

## 项目上下文

MetaHuman 是一个 3D 数字人交互平台（React 18 + TypeScript + Three.js + Zustand + Tailwind CSS），详细技术栈和架构见 [CLAUDE.md](./CLAUDE.md)。

---

## Agent 角色定义

### 1. 前端 UI Agent

**职责范围**：
- `src/pages/` — 页面组件
- `src/components/` — UI 组件（排除 `DigitalHumanViewer*.tsx`）
- `src/hooks/` — 自定义 Hooks
- `src/global.css` / `src/index.css` — 全局样式
- `tailwind.config.js` — Tailwind 配置

**规范**：
- 所有 UI 组件必须支持双主题（浅色基础 + `dark:` 变体）
- 使用 Lucide React 图标
- 使用 `cn()` 工具函数合并 className（`@/lib/utils`）
- 通知使用 Sonner 的 `toast`
- 面板组件使用 3 列网格布局适应大量按钮

### 2. 3D 渲染 Agent

**职责范围**：
- `src/components/DigitalHumanViewer.enhanced.tsx` — 核心 3D 渲染
- `src/components/DigitalHumanViewer.tsx` — 基础版

**规范**：
- CyberAvatar 使用 `headGroupRef`（头部独立旋转）和 `group`（身体整体控制）分离控制
- 动画通过 `animState` ref + `lerp` 插值实现平滑过渡，禁止直接设值
- 材质使用 `useMemo` 共享，当前 4 种：`skinMat` / `armorMat` / `frameMat` / `glowCyan`
- 新增动作时需同步更新：头部旋转、身体倾斜/弹跳、手臂旋转（Z+X 轴）、光环速度、灯光亮度
- `@react-three/fiber` 和 `@react-three/drei` 的类型声明警告可忽略

### 3. 状态与引擎 Agent

**职责范围**：
- `src/store/digitalHumanStore.ts` — Zustand 全局状态
- `src/core/avatar/DigitalHumanEngine.ts` — 行为引擎
- `src/core/audio/` — 语音服务
- `src/core/dialogue/` — 对话服务
- `src/core/vision/` — 视觉识别
- `src/core/performance/` — 性能监控

**规范**：
- 新增行为类型时，需同步更新 `BehaviorType` 联合类型、`VALID_BEHAVIORS` 数组、`ANIMATION_DURATIONS` 配置、两处 `behaviorMap` 映射
- 高频状态更新使用 `debouncedSetState`（限制 10次/秒）
- 组合动作方法命名：`perform<ActionName>()`，内部设置情绪 + 表情 + 播放动画
- 动画队列支持链式执行：`queueAnimation(name, options)`

### 4. 测试 Agent

**职责范围**：
- `src/__tests__/` — 测试文件
- `vitest.config.ts` — 测试配置

**规范**：
- 使用 Vitest + @testing-library/react
- 属性测试使用 fast-check（位于 `__tests__/properties/`）
- 测试环境为 jsdom
- 运行命令：`npm run test:run`（单次）/ `npm run test`（watch）

### 5. 后端 Agent

**职责范围**：
- `server/` — Python Flask 后端

**规范**：
- 当前前端独立运行，不强依赖后端
- 后端依赖见 `server/requirements.txt`

---

## 跨 Agent 协作流程

### 新增动作（端到端）

需要 **状态与引擎 Agent** + **3D 渲染 Agent** + **前端 UI Agent** 协同：

1. **状态与引擎 Agent**：
   - 在 `digitalHumanStore.ts` 的 `BehaviorType` 中新增类型
   - 在 `DigitalHumanEngine.ts` 中：
     - `ANIMATION_DURATIONS` 添加持续时间
     - `VALID_BEHAVIORS` 添加有效值
     - 两处 `behaviorMap` 添加映射
     - 添加 `perform<Action>()` 组合方法

2. **3D 渲染 Agent**：
   - 在 `DigitalHumanViewer.enhanced.tsx` 的 `useFrame` 中：
     - 头部动画区块：添加 `isAnim('<action>')` 分支（targetHeadRotX/Y/Z + targetBodyRotX/Z + targetBodyPosY）
     - 手臂动画区块：添加 `isAnim('<action>')` 分支（targetLeftArmRotZ/X + targetRightArmRotZ/X）
     - 光环动画区块：添加速度和晃动配置
     - 灯光区块：添加亮度配置

3. **前端 UI Agent**：
   - `BehaviorControlPanel.new.tsx`：在 `behaviors` 数组中添加按钮
   - `AdvancedDigitalHumanPage.tsx`：添加键盘快捷键处理
   - `KeyboardShortcutsHelp.tsx`：更新快捷键列表

### 主题相关修改

所有涉及 UI 样式的修改，必须同时考虑浅色和深色两套样式：
- 浅色：直接写 class（如 `bg-white text-slate-800`）
- 深色：使用 `dark:` 前缀（如 `dark:bg-slate-900 dark:text-white`）

---

## 文件修改检查清单

### 修改 3D 模型外观时：
- [ ] `DigitalHumanViewer.enhanced.tsx` — CyberAvatar JSX 结构
- [ ] 确认材质是否复用共享 `useMemo` 材质

### 修改动画时：
- [ ] `DigitalHumanViewer.enhanced.tsx` — `useFrame` 动画逻辑
- [ ] `DigitalHumanEngine.ts` — 持续时间 + 映射
- [ ] `digitalHumanStore.ts` — 类型定义

### 修改 UI 布局/样式时：
- [ ] 相关组件文件
- [ ] 确认双主题 `dark:` 变体
- [ ] 确认响应式（移动端适配）

### 修改状态逻辑时：
- [ ] `digitalHumanStore.ts` — 状态和方法
- [ ] 消费状态的组件是否需要同步更新

---

## 环境信息

- **Node.js**: >= 18.0.0
- **包管理**: npm >= 9.0.0
- **开发端口**: 5173
- **预览端口**: 3000
- **部署**: Vercel（`vercel.json` 配置路由重写）
- **构建模式**: default / mobile / desktop / ar

## 代码质量

- **Lint**: ESLint（flat config），运行 `npm run lint`
- **TypeScript**: `strict: false`，允许未使用变量
- **格式**: 遵循 `.editorconfig` 规则
- **提交规范**: Conventional Commits（`feat:` / `fix:` / `docs:` / `style:` / `refactor:`）
