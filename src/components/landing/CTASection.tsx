import { Link } from 'react-router-dom';
import { Play, Github, ArrowRight, Download, Code2, Terminal } from 'lucide-react';

export default function CTASection() {
  return (
    <section id="quickstart" className="relative overflow-hidden py-24 bg-black">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-indigo-950/20 to-black" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(600px,80vw)] h-[min(600px,80vh)] bg-blue-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start">
          {/* Left: CTA Content */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              准备好开始了吗？
            </h2>
            <p className="text-lg text-gray-400 mb-8">
              无论是个人项目还是企业应用，MetaHuman Engine 都能帮你快速构建下一代 AI 交互体验。
            </p>

            {/* Quick Install */}
            <div className="p-4 rounded-xl bg-[#0d1117] border border-white/10 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 font-mono">Quick Start</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500/80" />
                  <div className="w-2 h-2 rounded-full bg-yellow-500/80" />
                  <div className="w-2 h-2 rounded-full bg-green-500/80" />
                </div>
              </div>
              <code className="block overflow-x-auto whitespace-pre-wrap break-words text-sm font-mono text-gray-300">
                <span className="text-gray-500">$</span> git clone https://github.com/LessUp/meta-human.git
                <br />
                <span className="text-gray-500">$</span> cd meta-human && npm install
                <br />
                <span className="text-gray-500">$</span> npm run dev
              </code>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/app"
                className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-blue-600/20"
              >
                <Play className="w-5 h-5" />
                立即体验
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="https://github.com/LessUp/meta-human"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all"
              >
                <Github className="w-5 h-5" />
                GitHub
              </a>
            </div>
          </div>

          {/* Right: Feature Cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: Download,
                title: '多种安装方式',
                desc: 'Git Clone、Docker、Vite 模板',
              },
              {
                icon: Code2,
                title: '完整 TypeScript 支持',
                desc: '类型安全，智能提示',
              },
              {
                icon: Terminal,
                title: '命令行工具',
                desc: '脚手架快速创建项目',
              },
              {
                icon: Play,
                title: '在线演示',
                desc: '无需安装，浏览器即用',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="h-full rounded-xl border border-white/5 bg-white/[0.02] p-5 transition-colors hover:border-white/10"
              >
                <item.icon className="w-8 h-8 text-blue-400 mb-3" />
                <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Links */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <div className="flex flex-wrap justify-center gap-4 text-sm sm:gap-8">
            <a href="docs/" className="text-gray-400 hover:text-white transition-colors">
              文档
            </a>
            <a href="docs/api/" className="text-gray-400 hover:text-white transition-colors">
              API 参考
            </a>
            <a href="CHANGELOG.md" className="text-gray-400 hover:text-white transition-colors">
              更新日志
            </a>
            <a
              href="https://github.com/LessUp/meta-human/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              问题反馈
            </a>
            <a
              href="https://github.com/LessUp/meta-human/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              讨论区
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
