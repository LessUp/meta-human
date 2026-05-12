---
layout: home
hero:
  name: MetaHuman Engine
  text: 浏览器原生 3D 数字人引擎
  tagline: '完整的交互循环：语音输入 → AI 对话 → 语音输出 → 3D 表情动画'
  actions:
    - theme: brand
      text: 快速开始
      link: /zh/guide/getting-started
    - theme: alt
      text: API 参考
      link: /zh/api/overview
features:
  - icon: 🎭
    title: 3D 数字人
    details: Three.js + React Three Fiber 实现高质量 3D 渲染，支持表情动画和手势
  - icon: 🗣️
    title: 语音交互
    details: Web Speech API 语音识别 + Edge TTS 语音合成，支持中英文多音色
  - icon: 👁️
    title: 视觉感知
    details: MediaPipe 人脸网格和姿态检测，实时捕捉用户表情驱动数字人
  - icon: 🧠
    title: AI 对话
    details: OpenAI 兼容 API 接口，支持流式响应和上下文管理
---

# MetaHuman Engine 文档

## 核心能力

| 能力             | 技术栈                       | 状态    |
| ---------------- | ---------------------------- | ------- |
| 🎭 **3D 数字人** | Three.js + React Three Fiber | ✅ 可用 |
| 🗣️ **语音交互**  | Web Speech API + Edge TTS    | ✅ 可用 |
| 👁️ **视觉感知**  | MediaPipe Face Mesh & Pose   | ✅ 可用 |
| 🧠 **AI 对话**   | OpenAI 兼容 API              | ✅ 可用 |

## 快速链接

- [快速开始](/zh/guide/getting-started) - 5 分钟上手
- [安装指南](/zh/guide/installation) - 详细安装说明
- [配置参考](/zh/guide/configuration) - 环境变量配置
- [API 文档](/zh/api/overview) - 后端 API 参考
- [架构设计](/zh/architecture/overview) - 系统架构

## 设计原则

1. **零配置开箱** — 默认即可运行，自动降级到本地模式
2. **优雅降级** — 外部服务失败不影响核心体验
3. **模块化架构** — 数字人、语音、视觉、对话独立可替换
4. **最小重渲染** — 聚焦状态存储，避免不必要的更新
5. **浏览器优先** — 尽可能在客户端处理，减少服务器依赖
6. **隐私优先** — 人脸数据不离开浏览器
