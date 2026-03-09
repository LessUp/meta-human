import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Home, ArrowLeft, Sparkles } from "lucide-react";

/**
 * 404 页面
 * 增强版：入场动画、浮动粒子、响应式适配
 */
export default function NotFoundPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 延迟触发入场动画
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex flex-col items-center justify-center text-slate-800 dark:text-white px-4">
      <div
        className={`text-center space-y-6 max-w-md transition-all duration-700 ease-out ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* 404 大数字 */}
        <div className="relative">
          <h1 className="text-[100px] sm:text-[140px] md:text-[160px] font-bold leading-none bg-gradient-to-b from-blue-400 to-blue-900 bg-clip-text text-transparent select-none">
            404
          </h1>
          <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full -z-10 animate-pulse" />

          {/* 浮动粒子 */}
          <div className="absolute -top-4 -left-4 w-2 h-2 bg-blue-400/60 rounded-full animate-ping" />
          <div
            className="absolute -bottom-2 -right-6 w-1.5 h-1.5 bg-purple-400/50 rounded-full animate-ping"
            style={{ animationDelay: "0.5s" }}
          />
          <div
            className="absolute top-1/2 -right-8 w-1 h-1 bg-cyan-400/40 rounded-full animate-ping"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute top-1/4 -left-6 w-1 h-1 bg-blue-300/30 rounded-full animate-ping"
            style={{ animationDelay: "1.5s" }}
          />

          {/* 装饰图标 */}
          <Sparkles
            className="absolute -top-2 right-0 w-5 h-5 text-blue-400/40 animate-pulse"
            style={{ animationDelay: "0.3s" }}
          />
        </div>

        <h2 className="text-lg sm:text-xl font-medium text-slate-700 dark:text-white/80">
          页面未找到
        </h2>
        <p className="text-sm text-slate-400 dark:text-white/40 leading-relaxed px-4">
          您访问的页面不存在或已被移除。请返回首页继续使用数字人交互平台。
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-5 py-2.5 w-full sm:w-auto justify-center bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-600 dark:text-white/80 transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            返回上页
          </button>
          <Link
            to="/"
            className="flex items-center gap-2 px-5 py-2.5 w-full sm:w-auto justify-center bg-blue-600 hover:bg-blue-500 rounded-xl text-sm text-white transition-all active:scale-95 shadow-lg shadow-blue-600/20"
          >
            <Home className="w-4 h-4" />
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
