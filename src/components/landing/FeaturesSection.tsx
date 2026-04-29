import { 
  Box, 
  Mic, 
  Eye, 
  Brain, 
  Monitor, 
  Cpu,
  ArrowRight
} from 'lucide-react';

const features = [
  {
    icon: Box,
    title: '3D 虚拟形象',
    description: '支持 GLB/GLTF 模型加载，内置程序化生成数字人。情绪驱动的表情映射，骨骼动画系统支持挥手、打招呼、点头等动作。',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  {
    icon: Mic,
    title: '语音交互',
    description: '集成 Edge TTS 实现自然语音合成，浏览器原生语音识别 API 支持实时对话。智能静音检测，自动暂停 TTS 当用户说话。',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/20',
  },
  {
    icon: Brain,
    title: '智能对话',
    description: '支持 OpenAI、Claude 等主流 LLM，返回结构化响应包含回复文本、情绪和动作。SSE 流式传输，支持会话上下文管理。',
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
  },
  {
    icon: Eye,
    title: '视觉感知',
    description: 'MediaPipe Face Mesh 468 个面部关键点检测，实时微表情识别。姿态估计支持上半身手势识别，所有处理均在浏览器本地完成。',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
  },
  {
    icon: Monitor,
    title: '自适应性能',
    description: '基于设备能力自动调整渲染质量，确保在各种设备上流畅运行 60fps。减少动画偏好检测，为低性能设备提供降级体验。',
    color: 'from-rose-500 to-red-500',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/20',
  },
  {
    icon: Cpu,
    title: '零配置部署',
    description: '开箱即用的开发体验，自动降级到本地 Mock 模式无需 API Key。支持 GitHub Pages 一键部署，Docker 容器化后端快速启动。',
    color: 'from-indigo-500 to-violet-500',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/20',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="relative overflow-hidden py-24 bg-black">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0a0f] to-black" />
      
      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            核心功能特性
          </h2>
          <p className="text-lg text-gray-400">
            从 3D 渲染到智能对话，从语音交互到视觉感知，
            <br className="hidden sm:block" />
            一站式构建你的数字人应用
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`group relative flex h-full flex-col rounded-2xl border p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${feature.borderColor} ${feature.bgColor}`}
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} p-0.5 mb-4`}>
                <div className="w-full h-full rounded-xl bg-black/80 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="flex-1 text-sm leading-relaxed text-gray-400">
                {feature.description}
              </p>

              {/* Learn More Link */}
              <div className="mt-4 flex items-center gap-1 text-sm text-gray-500 group-hover:text-white transition-colors">
                <span>了解更多</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Hover Glow Effect */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
            </div>
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '60+', label: 'FPS 流畅渲染' },
            { value: '468', label: '面部关键点' },
            { value: '<100ms', label: '首字响应延迟' },
            { value: '0', label: '配置即开即用' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
