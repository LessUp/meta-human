# MetaHuman - 3D数字人交互平台

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-r150+-000000?logo=threedotjs&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)

基于Web技术的3D数字人交互平台，支持实时3D渲染、语音交互、表情控制和智能行为系统。

## � 界面预览

> 运行 `npm run dev` 后访问 `http://localhost:5173` 查看完整效果

| 主界面 | 控制面板 | 404页面 |
|:---:|:---:|:---:|
| ![主界面](docs/screenshots/main-ui.png) | ![控制面板](docs/screenshots/control-panel.png) | ![404页面](docs/screenshots/404-page.png) |

**主要界面特性：**
- 全屏3D数字人渲染，支持鼠标交互和头部跟踪
- 底部浮动聊天栏，支持文字和语音输入
- 右侧滑出式控制面板（基础/表情/行为/视觉/语音五大模块）
- 顶部HUD显示连接状态、行为状态、会话数和FPS
- 键盘快捷键帮助面板

> **截图说明：** 请运行项目后手动截图并保存到 `docs/screenshots/` 目录，替换上方占位图。

## � 项目介绍

这是一个完整的数字人项目，实现了3D建模与动画系统、语音交互系统、行为控制系统和渲染引擎等核心功能。采用深色主题设计，全中文界面。

## ✨ 核心功能

### 1. 3D建模与动画系统
- ✅ 基于Three.js的高精度3D渲染
- ✅ 支持FBX/GLTF模型格式
- ✅ 实时光影渲染和材质系统
- ✅ 骨骼绑定和面部表情控制

### 2. 语音交互系统
- ✅ TTS语音合成技术（Web Speech API）
- ✅ ASR语音识别功能
- ✅ 多语言支持（中文优先）
- ✅ 自定义语音参数（音量、音调、语速）

### 3. 行为控制系统
- ✅ 情感状态机
- ✅ AI驱动的智能决策
- ✅ 可视化行为编辑器
- ✅ 复杂动作序列支持

### 4. 渲染引擎
- ✅ WebGL实时渲染
- ✅ 响应式设计
- ✅ 多平台适配
- ✅ 性能优化

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript
- **3D渲染**: Three.js + React Three Fiber
- **状态管理**: Zustand
- **UI组件**: Tailwind CSS + Lucide React
- **构建工具**: Vite
- **部署**: Vercel

## 📦 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建项目
```bash
# 标准构建
npm run build

# 移动端构建
npm run build:mobile

# 桌面端构建
npm run build:desktop

# AR模式构建
npm run build:ar
```

### 部署
```bash
# 部署到Vercel
npm run deploy
```

## 🎯 使用说明

### 基础控制
- **播放/暂停**: 控制数字人动画播放
- **重置**: 重置数字人到初始状态
- **自动旋转**: 开启/关闭自动旋转展示

### 语音交互
- **录音**: 点击录音按钮开始语音识别
- **语音合成**: 支持自定义文本转语音
- **快速命令**: 预设常用语音命令

### 表情控制
- **基础表情**: 微笑、惊讶、悲伤、愤怒等
- **强度调节**: 0-100%表情强度控制
- **自定义颜色**: 支持表情颜色自定义

### 行为控制
- **行为模式**: 待机、打招呼、倾听、思考、说话、兴奋
- **自动决策**: AI驱动的自动行为决策
- **自动驾驶**: 开启后数字人自动切换行为状态

### 键盘快捷键

| 快捷键 | 功能 |
|:---:|:---|
| `空格` | 播放 / 暂停 |
| `R` | 重置数字人 |
| `M` | 静音切换 |
| `V` | 录音切换 |
| `S` | 设置面板开关 |
| `Esc` | 关闭设置面板 |
| `1` ~ `4` | 快速触发预设行为 |

> 在输入框内时快捷键不生效。点击顶部工具栏的键盘图标可查看完整列表。

## 🔧 开发文档

### 项目结构
```
src/
├── components/                    # React组件
│   ├── DigitalHumanViewer.enhanced.tsx  # 增强版3D数字人查看器
│   ├── ControlPanel.tsx                # 基础控制面板
│   ├── VoiceInteractionPanel.dark.tsx  # 语音交互面板（深色主题）
│   ├── ExpressionControlPanel.new.tsx  # 表情控制面板（中文化）
│   ├── BehaviorControlPanel.new.tsx    # 行为控制面板（中文化）
│   ├── VisionMirrorPanel.tsx           # 视觉镜像面板（摄像头情感检测）
│   ├── KeyboardShortcutsHelp.tsx       # 键盘快捷键帮助弹窗
│   └── ui/                            # 基础UI组件
│       ├── LoadingSpinner.new.tsx      # 加载动画
│       └── ErrorBoundary.new.tsx       # 错误边界
├── core/                          # 核心引擎
│   ├── audio/audioService.ts           # TTS/ASR语音服务
│   ├── avatar/DigitalHumanEngine.ts    # 数字人行为引擎
│   ├── dialogue/dialogueService.ts     # 对话服务
│   ├── dialogue/dialogueOrchestrator.ts # 对话编排器
│   ├── vision/visionService.ts         # 视觉识别服务（MediaPipe）
│   └── performance/performanceMonitor.ts # 性能监控
├── pages/                         # 页面组件
│   ├── AdvancedDigitalHumanPage.tsx    # 高级数字人页面（主页面）
│   ├── DigitalHumanPage.tsx            # 基础数字人页面
│   └── NotFoundPage.tsx                # 404页面
├── store/                         # 状态管理
│   └── digitalHumanStore.ts            # Zustand全局状态
├── hooks/                         # 自定义Hooks
│   ├── usePerformance.ts               # 性能监控Hook
│   ├── useTheme.ts                     # 主题切换Hook
│   └── useTouch.ts                     # 触控手势Hook
└── lib/utils.ts                   # 工具函数（cn等）
```

### 核心API

#### 数字人查看器组件
```tsx
<DigitalHumanViewer
  modelUrl="/models/digital-human.glb"
  autoRotate={true}
  showControls={true}
  onModelLoad={(model) => console.log('模型加载完成')}
/>
```

#### 语音服务
```typescript
// 语音合成
const tts = new TTSService();
tts.speak('你好，我是数字人助手！', 'zh-CN');

// 语音识别
const asr = new ASRService();
asr.start(); // 开始录音
```

#### 状态管理
```typescript
const {
  isPlaying,
  currentExpression,
  setExpression,
  play,
  pause
} = useDigitalHumanStore();
```

## 🌐 多平台支持

### Web平台
- ✅ 现代浏览器支持
- ✅ 响应式设计
- ✅ PWA支持

### 移动端
- ✅ 触摸交互优化
- ✅ 移动端UI适配
- ✅ 性能优化

### 桌面端
- ✅ 桌面级交互体验
- ✅ 键盘快捷键支持
- ✅ 多窗口支持

### AR/VR
- ✅ WebXR支持
- ✅ 空间交互
- ✅ 沉浸式体验

## 📊 性能指标

- **首次加载时间**: < 3秒
- **3D渲染帧率**: 60 FPS
- **语音响应延迟**: < 500ms
- **内存占用**: < 200MB
- **CPU使用率**: < 30%

## 🔒 安全特性

- ✅ HTTPS强制
- ✅ CSP安全策略
- ✅ XSS防护
- ✅ 内容安全策略

## 🤝 贡献指南

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 📄 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 支持

如遇到问题，请通过以下方式获取支持：
- 📧 邮箱: support@digital-human.com
- 💬 社区: [GitHub Discussions](https://github.com/digital-human/platform/discussions)
- 🐛 问题报告: [GitHub Issues](https://github.com/digital-human/platform/issues)

## 🌟 更新日志

### v1.1.0 (2025-03)
- 🎨 全局深色主题重构，统一视觉风格
- 🤖 增强版3D CyberAvatar（嘴巴、眉毛、手臂、身体）
- 🎭 完善表情系统（smile/laugh/surprise/sad/angry + 平滑过渡）
- 🖱️ 鼠标头部跟踪交互
- 💡 情绪灯光系统（颜色随情感变化）
- 🎬 丰富行为动画（挥手、思考、倾听、兴奋等）
- ⌨️ 键盘快捷键帮助面板
- 🌐 全中文界面（设置面板、表情/行为控制、HUD等）
- 📄 404页面（渐变动画 + 粒子效果）
- 🔧 修复 checkServerHealth 返回类型、VisibilityOptimizer 崩溃、CSS属性错误
- ⚡ OrbitControls 阻尼优化 + 触控支持
- 🎨 美化 LoadingSpinner、ErrorBoundary、PageLoader

### v1.0.0 (2024-01)
- 🎉 初始版本发布
- ✅ 基础3D渲染功能
- ✅ 语音交互系统
- ✅ 表情控制系统
- ✅ 行为控制系统
- ✅ 多平台支持

---

**⭐ 如果这个项目对你有帮助，请给我们一个星标！**
