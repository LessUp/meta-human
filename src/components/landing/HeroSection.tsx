import { Link } from 'react-router-dom';
import { Play, BookOpen, ArrowRight, Sparkles, Zap, Shield } from 'lucide-react';

const highlights = [
  { icon: Sparkles, label: '零配置启动' },
  { icon: Zap, label: '离线可用' },
  { icon: Shield, label: '生产级品质' },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0a1a] to-black" />
      
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(99, 102, 241, 0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
      
      {/* Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px]" />
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]" />
      
      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              <span>开源 3D 数字人引擎 v1.0</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              让 AI 拥有
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                实时交互的数字身体
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-gray-400 mb-8 max-w-xl mx-auto lg:mx-0">
              浏览器原生的 3D 数字人交互引擎，支持语音、视觉、对话能力。
              <span className="text-gray-300">零配置启动，离线可用，生产级品质。</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
              <Link
                to="/app"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all hover:shadow-xl hover:shadow-blue-600/20 hover:-translate-y-0.5"
              >
                <Play className="w-5 h-5" />
                立即体验
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="docs/"
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 transition-all hover:border-white/20"
              >
                <BookOpen className="w-5 h-5" />
                查看文档
              </a>
            </div>

            {/* Highlights */}
            <div className="flex flex-wrap gap-6 justify-center lg:justify-start">
              {highlights.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-gray-400">
                  <item.icon className="w-4 h-4 text-blue-400" />
                  <span className="text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Visual Preview */}
          <div className="relative">
            {/* Main Preview Card */}
            <div className="relative aspect-square max-w-lg mx-auto">
              {/* Outer Glow Ring */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 blur-2xl" />
              
              {/* Card Container */}
              <div className="relative h-full rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm">
                {/* Top Bar */}
                <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/40 to-transparent flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <div className="flex-1 text-center text-xs text-gray-500 font-mono">
                    MetaHuman Engine Preview
                  </div>
                </div>

                {/* 3D Placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {/* Central Avatar Icon */}
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-600/30 flex items-center justify-center border border-white/20">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400/40 to-purple-500/40 flex items-center justify-center">
                        <Sparkles className="w-10 h-10 text-blue-300" />
                      </div>
                    </div>
                    
                    {/* Orbiting Elements */}
                    <div className="absolute inset-0 animate-spin" style={{ animationDuration: '20s' }}>
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-400 rounded-full blur-sm" />
                    </div>
                    <div className="absolute inset-0 animate-spin" style={{ animationDuration: '15s', animationDirection: 'reverse' }}>
                      <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-3 h-3 bg-purple-400 rounded-full blur-sm" />
                    </div>
                  </div>
                </div>

                {/* UI Elements Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                  {/* Chat Input Mock */}
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-black/40 backdrop-blur border border-white/10">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 text-sm text-gray-400">输入消息与数字人互动...</div>
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  
                  {/* Status Bar */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span>系统已连接</span>
                    </div>
                    <div>Three.js | WebGL 2.0</div>
                  </div>
                </div>

                {/* Decorative Corner Accents */}
                <div className="absolute top-16 left-4 w-20 h-20 border-l-2 border-t-2 border-blue-500/20 rounded-tl-lg" />
                <div className="absolute bottom-20 right-4 w-20 h-20 border-r-2 border-b-2 border-purple-500/20 rounded-br-lg" />
              </div>
            </div>

            {/* Floating Stats Cards */}
            <div className="absolute -left-8 top-1/4 hidden lg:block">
              <div className="p-3 rounded-xl bg-black/60 backdrop-blur border border-white/10">
                <div className="text-2xl font-bold text-white">60<span className="text-blue-400">fps</span></div>
                <div className="text-xs text-gray-400">流畅渲染</div>
              </div>
            </div>
            
            <div className="absolute -right-4 bottom-1/3 hidden lg:block">
              <div className="p-3 rounded-xl bg-black/60 backdrop-blur border border-white/10">
                <div className="text-2xl font-bold text-white">468</div>
                <div className="text-xs text-gray-400">面部关键点</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500">
        <span className="text-xs">向下滚动了解更多</span>
        <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-1">
          <div className="w-1.5 h-3 bg-blue-400 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}
