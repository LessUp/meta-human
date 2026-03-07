# CLAUDE.md — MetaHuman 项目指南

本文件为 AI 编码助手提供项目上下文，帮助快速理解代码库并高效协作。

## 项目概述

MetaHuman 是一个基于 Web 技术的 **3D 数字人交互平台**，支持实时 3D 渲染、语音交互、表情控制和智能行为系统。全中文界面，深色/浅色双主题。

## 技术栈

- **前端框架**: React 18 + TypeScript 5
- **3D 渲染**: Three.js r158 + @react-three/fiber + @react-three/drei
- **状态管理**: Zustand 4
- **样式**: Tailwind CSS 3（`darkMode: "class"`，默认深色）
- **图标**: Lucide React
- **通知**: Sonner
- **路由**: React Router DOM 6
- **构建工具**: Vite 5
- **测试**: Vitest + @testing-library/react + fast-check（属性测试）
- **部署**: Vercel

## 常用命令

```bash
npm install          # 安装依赖
npm run dev          # 启动开发服务器 (localhost:5173)
npm run build        # TypeScript 编译 + Vite 构建
npm run test         # 运行测试
npm run test:run     # 单次运行测试
npm run lint         # ESLint 检查
npm run preview      # 预览构建产物
```

## 项目结构

```
src/
├── App.tsx                              # 根组件（路由、Suspense、ErrorBoundary）
├── main.tsx                             # 入口文件
├── global.css / index.css               # 全局样式
├── pages/
│   ├── AdvancedDigitalHumanPage.tsx      # 主页面（聊天、HUD、设置抽屉、键盘快捷键）
│   ├── DigitalHumanPage.tsx             # 基础页面
│   └── NotFoundPage.tsx                 # 404 页面
├── components/
│   ├── DigitalHumanViewer.enhanced.tsx   # ★ 核心：3D 数字人渲染 + CyberAvatar 组件
│   ├── DigitalHumanViewer.tsx           # 基础版查看器
│   ├── BehaviorControlPanel.new.tsx     # 行为控制面板（16 种动作）
│   ├── ExpressionControlPanel.new.tsx   # 表情控制面板
│   ├── VoiceInteractionPanel.dark.tsx   # 语音交互面板
│   ├── ControlPanel.tsx                 # 基础控制面板
│   ├── VisionMirrorPanel.tsx            # 摄像头情感检测
│   ├── KeyboardShortcutsHelp.tsx        # 快捷键帮助弹窗
│   └── ui/                             # 基础 UI 组件
├── core/
│   ├── avatar/DigitalHumanEngine.ts     # ★ 数字人行为引擎（动画队列、组合动作）
│   ├── audio/audioService.ts            # TTS/ASR 语音服务
│   ├── dialogue/                        # 对话服务 + 编排器
│   ├── vision/                          # 视觉识别（MediaPipe）
│   └── performance/                     # 性能监控
├── store/
│   └── digitalHumanStore.ts             # ★ Zustand 全局状态（表情/情感/行为/连接/聊天）
├── hooks/
│   ├── useTheme.ts                      # 主题切换（dark/light，localStorage 持久化）
│   ├── usePerformance.ts                # 性能监控
│   └── useTouch.ts                      # 触控手势
└── lib/utils.ts                         # 工具函数（cn = clsx + tailwind-merge）
```

## 核心架构

### 3D 数字人 (`DigitalHumanViewer.enhanced.tsx`)

- **CyberAvatar 组件**：纯几何体构建的赛博风数字人
  - 头部组 (`headGroupRef`)：颅骨、下颌、鼻子、眼睛（5层）、眉毛、嘴巴、耳机 — 独立旋转
  - 身体组 (`group`)：躯干、胸甲、能量核心、肩甲、手臂（分段）— 整体倾斜/弹跳
- **动画系统**：`useFrame` 驱动，`animState` ref 存储插值目标，`THREE.MathUtils.lerp` 平滑过渡
  - 头部：3轴旋转（鼠标跟踪 + 动作覆盖）
  - 身体：前倾 `bodyRotX`、侧倾 `bodyRotZ`、弹跳 `bodyPosY`
  - 手臂：侧展 `armRotZ` + 前后摆 `armRotX`
  - 面部：眼睛缩放（眨眼）、嘴巴开合、眉毛位移+旋转
  - 装饰：全息光环旋转、情绪灯光颜色
- **材质**：4 种共享 `useMemo` 材质（skinMat / armorMat / frameMat / glowCyan）

### 状态管理 (`digitalHumanStore.ts`)

关键类型：
- `EmotionType`: neutral | happy | surprised | sad | angry
- `ExpressionType`: neutral | smile | laugh | surprise | sad | angry | blink | eyebrow_raise | eye_blink | mouth_open | head_nod
- `BehaviorType`: idle | greeting | listening | thinking | speaking | excited | wave | bow | clap | thumbsUp | headTilt | shrug | lookAround | cheer | sleep | crossArms | point | ...

防抖更新机制：限制每秒最多 10 次状态更新，避免性能问题。

### 行为引擎 (`DigitalHumanEngine.ts`)

- 动画队列系统（`queueAnimation` / `processAnimationQueue`）
- `playAnimation(name, autoReset)` — 立即播放，自动恢复 idle
- 组合动作方法：`performGreeting()` / `performBow()` / `performClap()` 等
- `ANIMATION_DURATIONS` 配置每种动作持续时间

### 主题系统 (`useTheme.ts`)

- `darkMode: "class"` 模式，`<html>` 元素添加/移除 `dark` class
- 默认深色，支持切换，持久化到 `localStorage`
- 所有 UI 组件使用 `dark:` Tailwind 变体

## 编码约定

1. **双主题样式**：所有 UI 组件必须同时写浅色基础样式和 `dark:` 变体
2. **3D 材质**：使用共享 `useMemo` 材质节省内存，避免在 JSX 中重复创建
3. **动画插值**：所有动画目标值先算出 `target*`，再通过 `lerp` 平滑过渡，不要直接设值
4. **状态更新**：高频更新（如 FPS）走 `debouncedSetState`，UI 交互走正常 `set()`
5. **组件命名**：`.new.tsx` 后缀表示中文化重构版本，`.dark.tsx` 表示深色主题版本
6. **路径别名**：`@/*` 映射到 `./src/*`

## 已知注意事项

- `@react-three/fiber` 和 `@react-three/drei` 缺少类型声明文件，IDE 会报模块找不到的 lint 警告，但编译和运行不受影响
- `server/` 目录包含 Python Flask 后端（`requirements.txt`），当前前端独立运行不依赖后端
- 测试文件在 `src/__tests__/`，包含属性测试（`properties/` 子目录使用 fast-check）
- 构建分 4 种模式：默认 / mobile / desktop / ar，通过 Vite mode 区分
