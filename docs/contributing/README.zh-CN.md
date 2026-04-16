# 贡献指南

感谢您对 MetaHuman Engine 的贡献兴趣！

---

## 贡献方式

### 🐛 Bug 报告

发现 Bug？请创建 Issue 并包含：

- 问题清晰描述
- 复现步骤
- 预期与实际行为
- 环境详情（操作系统、浏览器、版本）
- 截图/录像（如有）

### 💡 功能请求

有想法？创建 Issue 并包含：

- 用例描述
- 建议的解决方案
- 考虑过的替代方案

### 📝 代码贡献

想修复 Bug 或添加功能？请按照以下流程。

### 📚 文档

文档、README 或代码注释的改进总是受欢迎的。

---

## 开发设置

### 1. Fork 并克隆

```bash
# 在 GitHub 上 Fork 仓库，然后：
git clone https://github.com/你的用户名/meta-human.git
cd meta-human
git remote add upstream https://github.com/LessUp/meta-human.git
```

### 2. 安装依赖

```bash
# 前端
npm install

# 后端（可选）
cd server
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

### 3. 创建分支

```bash
git checkout -b feat/你的功能名称
# 或: git checkout -b fix/bug描述
```

---

## 代码规范

### 提交信息

遵循 [Conventional Commits](https://www.conventionalcommits.org/lang/zh-CN/)：

```
<类型>(<范围>): <描述>

<正文>

<页脚>
```

**类型：**

| 类型 | 描述 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档变更 |
| `style` | 代码风格（格式化、分号等） |
| `refactor` | 代码重构 |
| `perf` | 性能优化 |
| `test` | 添加或更新测试 |
| `chore` | 维护任务 |

**示例：**

```bash
feat(avatar): 添加挥手动画触发
docs(api): 更新 WebSocket 文档
fix(dialogue): 修复流式中的内存泄漏
```

### TypeScript 规范

**命名：**
- `PascalCase` 用于组件、类型、接口
- `camelCase` 用于函数、变量
- `SCREAMING_SNAKE_CASE` 用于常量

**导入：**
```typescript
// 1. 外部导入
import React from 'react';

// 2. 内部绝对导入
import { Button } from '@/components/ui/Button';

// 3. 内部相对导入
import { helper } from './utils';
```

**注释：**
```typescript
// 好：解释为什么，而不是什么
// 指数退避重试以增强网络韧性
await retry(operation, { delay: 1000 * attempts });

// 差：重复代码
// 用尝试次数乘延迟
delay = 1000 * attempts;
```

### 代码风格

项目使用自动化格式化：

```bash
# 格式化代码
npm run format

# 检查格式
npm run format:check

# 代码检查
npm run lint

# 修复检查问题
npm run lint:fix
```

---

## 测试

### 运行测试

```bash
# 监听模式
npm run test

# 单次运行
npm run test:run

# 带覆盖率
npm run test:coverage
```

### 编写测试

**组件示例：**

```typescript
import { render, screen } from '@testing-library/react';
import { ChatDock } from './ChatDock';

describe('ChatDock', () => {
  it('渲染输入框', () => {
    render(<ChatDock />);
    expect(screen.getByPlaceholderText('输入消息...')).toBeInTheDocument();
  });
});
```

**Hook 示例：**

```typescript
import { renderHook } from '@testing-library/react';
import { useChatStream } from './useChatStream';

describe('useChatStream', () => {
  it('成功发送消息', async () => {
    const { result } = renderHook(() => useChatStream());
    await result.current.sendMessage('你好');
    expect(result.current.messages).toHaveLength(1);
  });
});
```

---

## Pull Request 流程

### 1. 提交前

- [ ] 代码遵循风格规范
- [ ] 测试通过：`npm run test:run`
- [ ] 检查通过：`npm run lint`
- [ ] TypeScript 编译：`npm run typecheck`
- [ ] 提交遵循约定格式
- [ ] 文档已更新（如需要）

### 2. 创建 PR

1. 推送分支到你的 Fork
2. 针对 `main` 分支创建 PR
3. 填写 PR 模板
4. 链接相关 Issue

### 3. PR 审查

- 维护者将在 48 小时内审查
- 处理审查意见
- 保持 PR 聚焦单一议题

### 4. 合并

审查通过后，维护者将合并你的 PR。

---

## 项目结构

```
src/
├── components/          # React 组件
│   ├── ui/             # 原始 UI 组件
│   ├── forms/          # 表单专用组件
│   └── panels/         # 面板/布局组件
├── core/               # 业务逻辑
│   ├── avatar/         # 3D 数字人引擎
│   ├── audio/          # 语音合成/识别
│   ├── dialogue/       # 对话服务
│   └── vision/         # 面部追踪
├── store/              # 状态管理
├── hooks/              # 自定义 React Hooks
├── lib/                # 工具函数
├── types/              # TypeScript 类型
└── __tests__/          # 测试
```

---

## 添加新功能

### 新组件

1. 创建文件：`components/ComponentName.tsx`
2. 添加样式（Tailwind 类）
3. 复杂 props 添加类型
4. 编写测试
5. 从 `components/index.ts` 导出

### 新 Hook

1. 创建文件：`hooks/useHookName.ts`
2. 遵循现有 Hook 模式
3. 添加 JSDoc 注释
4. 编写测试
5. 从 `hooks/index.ts` 导出

### 新 Store

1. 创建文件：`store/storeName.ts`
2. 使用 Zustand 模式
3. 定义 TypeScript 接口
4. 如需则添加持久化
5. 文档化公共 API

---

## 文档

### 代码文档

公共 API 使用 JSDoc：

```typescript
/**
 * 发送聊天消息并接收流式响应
 * @param message - 用户消息文本
 * @param options - 流式回调
 * @returns 流完成时解决的 Promise
 * @throws {ChatError} 传输失败时
 */
async function streamMessage(
  message: string,
  options: StreamOptions
): Promise<void>
```

### README 更新

添加功能时：
- 面向用户更新主 README.md
- API 变更添加到 docs/
- 更新 CHANGELOG.md

---

## 社区

### 沟通渠道

- **Issues：** Bug 报告、功能请求
- **Discussions：** 问题、想法、展示
- **Pull Requests：** 代码贡献

### 行为准则

- 尊重和包容
- 欢迎新成员
- 专注于建设性反馈
- 尊重不同观点

---

## 有问题？

- 查看现有 [issues](https://github.com/LessUp/meta-human/issues)
- 发起 [讨论](https://github.com/LessUp/meta-human/discussions)
- 在你的 PR/Issue 中提问

---

<p align="center">
  感谢为 MetaHuman Engine 做出贡献！🎉
</p>
