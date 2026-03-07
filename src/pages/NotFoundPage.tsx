import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white px-4">
      <div className="text-center space-y-6 max-w-md">
        {/* 404 大数字 */}
        <div className="relative animate-fade-in">
          <h1 className="text-[120px] sm:text-[160px] font-bold leading-none bg-gradient-to-b from-blue-400 to-blue-900 bg-clip-text text-transparent select-none animate-pulse-glow">
            404
          </h1>
          <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full -z-10 animate-pulse" />
          <div className="absolute -top-4 -left-4 w-2 h-2 bg-blue-400/60 rounded-full animate-ping" />
          <div className="absolute -bottom-2 -right-6 w-1.5 h-1.5 bg-purple-400/50 rounded-full animate-ping" style={{ animationDelay: '0.5s' }} />
          <div className="absolute top-1/2 -right-8 w-1 h-1 bg-cyan-400/40 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
        </div>

        <h2 className="text-xl font-medium text-white/80">页面未找到</h2>
        <p className="text-sm text-white/40 leading-relaxed">
          您访问的页面不存在或已被移除。请返回首页继续使用数字人交互平台。
        </p>

        <div className="flex items-center justify-center gap-3 pt-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white/80 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回上页
          </button>
          <Link
            to="/"
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm text-white transition-colors"
          >
            <Home className="w-4 h-4" />
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
