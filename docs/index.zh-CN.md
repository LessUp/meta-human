# MetaHuman Engine 文档

<p align="center">
  <img src="../public/favicon.svg" width="80" alt="MetaHuman Engine" />
</p>

<p align="center">
  <strong>基于浏览器的 3D 数字人引擎完整文档</strong>
</p>

---

## 📚 文档索引

### 🚀 快速开始

| 文档 | 描述 | 链接 |
|------|------|------|
| **快速开始** | 5 分钟快速上手 | [指南 →](./guide/README.zh-CN.md) |
| **安装指南** | 详细安装说明 | [指南 →](./guide/installation.zh-CN.md) |
| **配置说明** | 环境变量和设置 | [指南 →](./guide/configuration.zh-CN.md) |

### 🏗️ 架构

| 文档 | 描述 | 链接 |
|------|------|------|
| **架构概览** | 系统架构和数据流 | [架构 →](./architecture/README.zh-CN.md) |
| **前端架构** | React 组件架构 | [前端 →](./architecture/frontend.zh-CN.md) |
| **后端架构** | FastAPI 后端设计 | [后端 →](./architecture/backend.zh-CN.md) |

### 🔌 API 参考

| 文档 | 描述 | 链接 |
|------|------|------|
| **API 概览** | API 介绍和认证 | [API →](./api/README.zh-CN.md) |
| **REST API** | HTTP 接口和请求/响应格式 | [REST API →](./api/rest-api.zh-CN.md) |
| **WebSocket** | 实时双向通信 | [WebSocket →](./api/websocket.zh-CN.md) |

### 🤝 贡献指南

| 文档 | 描述 | 链接 |
|------|------|------|
| **贡献指南** | 如何为项目做贡献 | [贡献 →](./contributing/README.zh-CN.md) |

---

## 🌐 语言选择

- **[English](./index.md)**
- **[中文](./index.zh-CN.md)**（当前）

---

## 🎯 MetaHuman Engine 是什么？

MetaHuman Engine 是一个**基于浏览器的 3D 数字人引擎**，提供完整的交互循环：

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   用户输入 ──► 语音/文字 ──► 对话 ──► 语音合成 ──► 数字人    │
│                     │                              │        │
│                     └──────── 视觉反馈 ────────────┘        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 核心能力

| 能力 | 技术栈 | 状态 |
|------|--------|------|
| 🎭 **3D 数字人** | Three.js + React Three Fiber | ✅ 已可用 |
| 🗣️ **语音交互** | Web Speech API + Edge TTS | ✅ 已可用 |
| 👁️ **视觉感知** | MediaPipe 人脸网格和姿态估计 | ✅ 已可用 |
| 🧠 **智能对话** | OpenAI 兼容 API | ✅ 已可用 |

---

## 🚀 快速链接

- **[GitHub 仓库](https://github.com/LessUp/meta-human)**
- **[在线演示](https://lessup.github.io/meta-human/)**
- **[问题反馈](https://github.com/LessUp/meta-human/issues)**
- **[讨论区](https://github.com/LessUp/meta-human/discussions)**

---

## 📖 设计原则

1. **零配置默认** — 开箱即用，本地兜底
2. **优雅降级** — 外部服务失败不中断体验
3. **模块化架构** — 数字人、语音、视觉、对话相互独立
4. **最小重渲染** — 聚焦状态存储，避免不必要更新
5. **浏览器优先** — 尽可能在客户端处理
6. **隐私优先** — 人脸数据绝不上传

---

## 🎯 适用场景

- 🤖 **智能客服** — 7×24 小时情感化自动服务
- 🎓 **教育助手** — 互动式学习伴侣
- 🏢 **信息亭** — 智能接待和导览
- 🎮 **虚拟主播** — 实时数字人表演
- 💬 **数字陪伴** — 心理健康和情感支持

---

## 📋 版本信息

**当前版本：** `v1.0.0`

查看 [CHANGELOG](../CHANGELOG.zh-CN.md) 了解版本历史。

---

<p align="center">
  用 ❤️ 打造，让每个人都能拥有自己的数字人
</p>

<p align="center">
  <a href="https://github.com/LessUp/meta-human/blob/master/LICENSE">MIT 许可证</a>
</p>
