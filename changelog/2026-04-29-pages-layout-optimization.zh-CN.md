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

## 预期效果

- 页面主内容和浮层控件在桌面端与移动端都保持可感知居中
- 顶部状态栏和底部输入栏不会再因宽度计算错误而偏移
- 锚点滚动不会被固定导航栏盖住
- Landing 页各模块在中小屏幕下的对齐和留白更稳定
