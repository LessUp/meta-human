# 2026-04-29 GitHub Pages 布局优化记录

## 范围

- 修复 `LandingPage` 与 `/app` 在线演示页在 GitHub Pages 下的整体居中与对齐问题
- 优化顶部 HUD、底部聊天区、设置抽屉在移动端和窄屏下的布局稳定性
- 收紧落地页各区块的栅格与间距，减少元素错位和横向溢出

## 主要修改

- 将 `/app` 根容器从 `w-screen h-screen` 改为 `w-full` + `100dvh`，避免浏览器滚动条导致的横向偏移
- 重构 `TopHUD` 为居中的最大宽度容器，并允许状态信息自动换行
- 重构 `ChatDock` 的定位方式，去掉 `left-1/2` 平移，改为底部居中容器
- 将 `SettingsDrawer` 改为固定定位遮罩抽屉，避免相对定位父容器影响面板位置
- 为页面增加 `scroll-padding-top`，修复固定导航栏遮挡锚点区域的问题
- 优化 `HeroSection`、`FeaturesSection`、`TechStackSection`、`CTASection`、`Footer` 在平板和手机上的栅格与间距
- 统一使用全局 `Toaster`，移除页面级重复挂载，减少顶部叠层干扰

## 二次修复 — 页面整体偏移与布局居中

### 问题

GitHub Pages 页面整体偏移，内容未居中，右侧出现大量空白，各区块布局混乱。

### 根因

1. `#root` 缺少 `overflow-x: hidden` 和 `max-width: 100vw`，绝对定位的大尺寸光晕元素（`w-[800px]`、`w-[1000px]` 等）撑宽了文档
2. HeroSection 浮动统计卡片使用负偏移（`-left-8`、`-right-4`）溢出容器
3. 各 section 缺少 `overflow-hidden`，背景装饰元素可从 section 边界溢出

### 修复内容

| 文件 | 修改 |
|------|------|
| `src/index.css` | `#root` 添加 `max-width: 100vw; overflow-x: hidden` |
| `index.html` | 内联 CSS 中 `#root` 同步添加 `max-width` 和 `overflow-x: hidden` |
| `HeroSection.tsx` | 光晕尺寸改用 `min()` 限制；浮动卡片负偏移改为 `left-0` / `right-0` |
| `FeaturesSection.tsx` | section 添加 `overflow-hidden` |
| `TechStackSection.tsx` | section 和背景容器添加 `overflow-hidden`；光晕用 `min()` 限制；grid 子元素加 `min-w-0`；代码容器加 `max-w-full` |
| `CTASection.tsx` | section 和背景容器添加 `overflow-hidden`；光晕用 `min()` 限制 |

## 预期效果

- 页面主内容和浮层控件在桌面端与移动端都保持可感知居中
- 顶部状态栏和底部输入栏不会再因宽度计算错误而偏移
- 锚点滚动不会被固定导航栏盖住
- Landing 页各模块在中小屏幕下的对齐和留白更稳定
- 所有绝对定位装饰元素不再撑宽文档，页面无水平溢出
