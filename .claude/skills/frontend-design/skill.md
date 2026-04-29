# Frontend Design Skill

为 MetaHuman Engine 项目提供前端设计指导和规范。

## 设计系统

### 色彩系统

项目采用深色主题为主，强调科技感和未来感。

```css
/* 主色调 - 蓝紫渐变 */
--primary-gradient: linear-gradient(135deg, #3080ff, #625fff);

/* 强调色 */
--accent-blue: oklch(0.6 0.2 250); /* 主蓝色 */
--accent-indigo: oklch(0.5 0.23 277); /* 靛蓝色 */
--accent-purple: oklch(0.6 0.25 292); /* 紫色 */

/* 背景色 */
--bg-primary: #0a0a0a; /* 主背景 */
--bg-secondary: #050508; /* 次级背景 */
--bg-elevated: #0d1117; /* 提升背景 */

/* 文本色 */
--text-primary: #fafafa; /* 主文本 */
--text-secondary: #a1a1aa; /* 次级文本 */
--text-muted: #71717a; /* 弱化文本 */
```

### 字体系统

使用 Inter 作为主字体，避免过度使用系统字体。

```css
/* 主字体栈 */
font-family:
  'Inter',
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  sans-serif;

/* 等宽字体 */
font-family: 'JetBrains Mono', 'SF Mono', Consolas, monospace;

/* 字体大小比例 */
--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.25rem; /* 20px */
--text-2xl: 1.5rem; /* 24px */
--text-3xl: 1.875rem; /* 30px */
--text-4xl: 2.25rem; /* 36px */
--text-5xl: 3rem; /* 48px */
--text-6xl: 3.75rem; /* 60px */
```

### 间距系统

使用 4px 基准的间距系统。

```css
--spacing-1: 0.25rem; /* 4px */
--spacing-2: 0.5rem; /* 8px */
--spacing-3: 0.75rem; /* 12px */
--spacing-4: 1rem; /* 16px */
--spacing-6: 1.5rem; /* 24px */
--spacing-8: 2rem; /* 32px */
--spacing-12: 3rem; /* 48px */
--spacing-16: 4rem; /* 64px */
--spacing-24: 6rem; /* 96px */
```

### 圆角系统

```css
--radius-sm: 0.25rem; /* 4px */
--radius-md: 0.375rem; /* 6px */
--radius-lg: 0.5rem; /* 8px */
--radius-xl: 0.75rem; /* 12px */
--radius-2xl: 1rem; /* 16px */
--radius-3xl: 1.5rem; /* 24px */
--radius-full: 9999px; /* 完全圆角 */
```

### 阴影系统

深色主题下的阴影需要配合模糊和透明度。

```css
/* 发光阴影 */
--glow-blue: 0 0 20px rgba(48, 128, 255, 0.3);
--glow-purple: 0 0 20px rgba(164, 75, 255, 0.3);

/* 提升阴影 */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.5);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.5);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.5);
```

## 组件设计规范

### 按钮样式

```tsx
// 主要按钮
<button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all hover:shadow-xl hover:shadow-blue-600/20">

// 次要按钮
<button className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all">

// 图标按钮
<button className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
```

### 卡片样式

```tsx
// 基础卡片
<div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm">

// 带图标的功能卡片
<div className="group relative p-6 rounded-2xl border border-blue-500/20 bg-blue-500/10 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
```

### 输入框样式

```tsx
// 文本输入
<input className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-transparent transition-all" />

// 带图标的输入框
<div className="flex items-center gap-2 p-3 rounded-xl bg-black/40 backdrop-blur border border-white/10">
  <SearchIcon className="w-5 h-5 text-gray-400" />
  <input className="flex-1 bg-transparent border-none outline-none text-white" />
</div>
```

### 导航栏样式

```tsx
// 固定导航栏
<nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/10">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{/* 导航内容 */}</div>
</nav>
```

## 布局规范

### 容器最大宽度

```tsx
// 主容器
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

// 内容容器
<div className="max-w-3xl mx-auto">

// 全宽容器
<div className="w-full">
```

### 响应式断点

```css
/* Tailwind 默认断点 */
sm: 640px   /* 手机横屏 */
md: 768px   /* 平板竖屏 */
lg: 1024px  /* 平板横屏/小屏电脑 */
xl: 1280px  /* 桌面 */
2xl: 1536px /* 大屏桌面 */
```

### 网格布局

```tsx
// 两列网格
<div className="grid md:grid-cols-2 gap-6">

// 三列网格
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

// 四列网格
<div className="grid grid-cols-2 md:grid-cols-4 gap-8">
```

## 动画规范

### 过渡动画

```tsx
// 基础过渡
<div className="transition-all duration-300">

// 颜色过渡
<div className="transition-colors duration-200">

// 变换过渡
<div className="transition-transform duration-300">
```

### 悬停效果

```tsx
// 上浮效果
<div className="hover:-translate-y-0.5 transition-transform">

// 缩放效果
<div className="hover:scale-[1.02] transition-transform">

// 发光效果
<div className="hover:shadow-xl hover:shadow-blue-600/20 transition-shadow">
```

### 加载动画

```tsx
// 脉冲动画
<div className="animate-pulse">

// 旋转动画
<div className="animate-spin">

// 弹跳动画
<div className="animate-bounce">
```

## 特殊效果

### 玻璃拟态

```tsx
<div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl">
```

### 渐变背景

```tsx
// 线性渐变
<div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">

// 径向渐变
<div className="bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-600/10 to-transparent">
```

### 模糊光晕

```tsx
// 背景光晕
<div className="absolute w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px]" />
```

## 可访问性

### 焦点状态

```tsx
// 可见焦点环
<button className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black">
```

### 减少动画

```tsx
// 自动适配用户偏好
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 屏幕阅读器

```tsx
// 仅视觉隐藏
<span className="sr-only">描述性文本</span>

// ARIA 标签
<button aria-label="关闭菜单">
  <XIcon className="w-5 h-5" />
</button>
```

## 设计原则

1. **一致性** - 保持视觉元素的一致性，使用统一的设计系统
2. **层次感** - 通过颜色、大小、间距建立清晰的视觉层次
3. **留白** - 合理使用负空间，避免界面过于拥挤
4. **反馈** - 为用户操作提供即时的视觉反馈
5. **性能** - 避免过度使用动画和效果，保持流畅体验
6. **可访问性** - 确保所有用户都能正常使用界面

## 避免的设计模式

1. **过度使用渐变** - 不要每个元素都使用渐变，保持克制
2. **过多阴影** - 深色主题下过多阴影会显得杂乱
3. **过小的点击区域** - 移动端点击区域至少 44x44px
4. **低对比度文本** - 确保文本可读性，对比度至少 4.5:1
5. **动画滥用** - 动画应该有意义，不是为了炫技
