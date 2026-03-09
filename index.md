---
layout: default
title: MetaHuman
---

# MetaHuman — 3D 数字人交互平台

基于 React + Three.js 的 3D 数字人交互平台，支持语音交互、行为控制和情绪状态机。

## 核心特性

- **3D 数字人渲染** — Three.js + React Three Fiber，支持骨骼动画和面部表情
- **语音交互** — Web Speech API 语音识别 + TTS 语音合成
- **行为控制** — 可编程的行为序列和动画状态机
- **情绪系统** — 基于 FSM 的情绪状态转换（高兴、悲伤、惊讶等）
- **实时渲染** — 60fps 渲染管线，支持后处理效果

## 文档

- [README](README.md) — 项目概述与快速开始
- [API 文档](docs/api.md) — 接口参考
- [架构设计](docs/architecture.md) — 系统架构
- [开发指南](docs/development.md) — 开发环境搭建

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm test
```

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 18, TypeScript |
| 3D 渲染 | Three.js, React Three Fiber |
| 构建 | Vite |
| 样式 | Tailwind CSS |
| 测试 | Vitest |

## 链接

- [GitHub 仓库](https://github.com/LessUp/MetaHuman)
- [README](README.md)
