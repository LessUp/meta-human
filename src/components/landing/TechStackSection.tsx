import { 
  ReactLogo,
  ThreeJsIcon,
  TypeScriptIcon,
  ViteIcon,
  TailwindIcon,
  ZustandIcon
} from './icons';

const techLayers = [
  {
    title: 'UI 层',
    description: 'React 18 + TypeScript 构建现代化界面',
    items: [
      { name: 'React', icon: ReactLogo, color: '#61DAFB' },
      { name: 'TypeScript', icon: TypeScriptIcon, color: '#3178C6' },
      { name: 'Tailwind', icon: TailwindIcon, color: '#06B6D4' },
    ],
  },
  {
    title: '3D 渲染层',
    description: 'Three.js + React Three Fiber 实现实时 3D',
    items: [
      { name: 'Three.js', icon: ThreeJsIcon, color: '#ffffff' },
      { name: 'React Three Fiber', icon: ReactLogo, color: '#61DAFB' },
      { name: 'Drei', icon: ThreeJsIcon, color: '#ffffff' },
    ],
  },
  {
    title: '状态管理',
    description: 'Zustand 轻量状态管理，高性能更新',
    items: [
      { name: 'Zustand', icon: ZustandIcon, color: '#FFAA00' },
    ],
  },
  {
    title: '构建工具',
    description: 'Vite 5 极速开发体验',
    items: [
      { name: 'Vite', icon: ViteIcon, color: '#646CFF' },
    ],
  },
];

const browserApis = [
  { name: 'WebGL 2.0', desc: '硬件加速 3D 渲染' },
  { name: 'Web Speech API', desc: '语音识别与合成' },
  { name: 'MediaPipe', desc: '本地视觉处理' },
  { name: 'WebSocket', desc: '实时双向通信' },
];

export default function TechStackSection() {
  return (
    <section id="tech-stack" className="relative overflow-hidden py-24 bg-[#050508]">
      {/* Background Gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(1000px,100vw)] h-[500px] bg-indigo-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="landing-shell relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            现代技术栈
          </h2>
          <p className="text-lg text-gray-400">
            基于业界领先的开源技术构建，确保性能、可维护性和扩展性
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="landing-center mb-20 max-w-5xl">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.02] to-transparent p-6 sm:p-8">
            {/* Layers */}
            <div className="grid gap-5">
              {techLayers.map((layer, index) => (
                <div key={layer.title} className="relative">
                  {/* Connection Line */}
                  {index < techLayers.length - 1 && (
                    <div className="absolute left-8 top-full w-px h-5 bg-gradient-to-b from-white/20 to-transparent" />
                  )}
                  
                  <div className="flex flex-col gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:border-white/10 sm:flex-row sm:items-center sm:gap-8">
                    {/* Layer Title */}
                    <div className="sm:w-56 flex-shrink-0">
                      <h3 className="text-white font-semibold">{layer.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{layer.description}</p>
                    </div>
                    
                    {/* Tech Items */}
                    <div className="flex flex-1 flex-wrap gap-3">
                      {layer.items.map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                        >
                          <item.icon className="w-5 h-5" style={{ color: item.color }} />
                          <span className="text-sm text-gray-300">{item.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Center Flow Indicator */}
            <div className="hidden lg:flex absolute top-1/2 right-8 -translate-y-1/2 flex-col items-center gap-2 text-gray-600">
              <div className="w-px h-8 bg-gradient-to-b from-transparent to-gray-600" />
              <div className="text-xs font-mono">FLOW</div>
              <div className="w-px h-8 bg-gradient-to-t from-transparent to-gray-600" />
            </div>
          </div>
        </div>

        {/* Browser APIs */}
        <div className="landing-center max-w-5xl grid gap-8 lg:grid-cols-2 lg:items-start [&>*]:min-w-0">
          <div>
            <h3 className="text-xl font-semibold text-white mb-6">
              浏览器原生 API
            </h3>
            <div className="space-y-3">
              {browserApis.map((api) => (
                <div
                  key={api.name}
                  className="flex flex-col items-start gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:border-white/10 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-white font-medium">{api.name}</span>
                  <span className="text-sm text-gray-500 sm:text-right">{api.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Code Example */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-6">
              极简 API 设计
            </h3>
            <div className="rounded-xl overflow-hidden bg-[#0d1117] border border-white/10 max-w-full">
              <div className="flex items-center gap-2 px-4 py-2 bg-[#161b22] border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-2 text-xs text-gray-500 font-mono">example.ts</span>
              </div>
              <pre className="p-4 text-sm font-mono text-gray-300 overflow-x-auto">
                <code>{`import { digitalHumanEngine } from '@core/avatar';
import { dialogueService } from '@core/dialogue';

// 发送消息并驱动数字人响应
const response = await dialogueService.send(
  '你好，请介绍一下自己'
);

// 数字人自动执行对应的情绪和动作
digitalHumanEngine.perform({
  emotion: response.emotion,
  expression: response.expression,
  animation: response.action,
  speech: response.replyText,
});`}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
