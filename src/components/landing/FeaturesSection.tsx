import { Box, Mic, Eye, Brain, Monitor, Cpu, ArrowRight } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';

export default function FeaturesSection() {
  const { t, lang } = useI18n();

  // Define features based on current language
  const features = [
    {
      icon: Box,
      title: t('features.avatar.title'),
      description: t('features.avatar.desc'),
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      icon: Mic,
      title: t('features.voice.title'),
      description: t('features.voice.desc'),
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
    },
    {
      icon: Brain,
      title: t('features.dialogue.title'),
      description: t('features.dialogue.desc'),
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
    {
      icon: Eye,
      title: t('features.vision.title'),
      description: t('features.vision.desc'),
      color: 'from-amber-500 to-orange-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
    {
      icon: Monitor,
      title: lang === 'zh-CN' ? '自适应性能' : 'Adaptive Performance',
      description:
        lang === 'zh-CN'
          ? '基于设备能力自动调整渲染质量，确保在各种设备上流畅运行 60fps。减少动画偏好检测，为低性能设备提供降级体验。'
          : 'Automatically adjusts rendering quality based on device capabilities for smooth 60fps performance. Reduced animation preferences, degraded experience for low-end devices.',
      color: 'from-rose-500 to-red-500',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/20',
    },
    {
      icon: Cpu,
      title: lang === 'zh-CN' ? '零配置部署' : 'Zero Config Deployment',
      description:
        lang === 'zh-CN'
          ? '开箱即用的开发体验，默认回退到本地 Mock 模式无需 API Key。前端可直接部署到 GitHub Pages；如需后端，可按需接入 `examples/backend-python/` 参考实现。'
          : 'Out-of-the-box development with automatic local mock fallback and no required API key. The frontend deploys directly to GitHub Pages, and `examples/backend-python/` remains the optional backend reference.',
      color: 'from-indigo-500 to-violet-500',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
    },
  ];

  const stats =
    lang === 'zh-CN'
      ? [
          { value: '60+', label: 'FPS 流畅渲染' },
          { value: '468', label: '面部关键点' },
          { value: '<100ms', label: '首字响应延迟' },
          { value: '0 配置', label: '开箱即用' },
        ]
      : [
          { value: '60+', label: 'FPS Smooth' },
          { value: '468', label: 'Facial Landmarks' },
          { value: '<100ms', label: 'First Token Latency' },
          { value: '0 Config', label: 'Out-of-the-box' },
        ];

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

      <div className="landing-shell relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t('features.title')}</h2>
          <p className="text-lg text-gray-400">
            {lang === 'zh-CN' ? (
              <>
                从 3D 渲染到智能对话，从语音交互到视觉感知，
                <br className="hidden sm:block" />
                一站式构建你的数字人应用
              </>
            ) : (
              <>
                From 3D rendering to intelligent dialogue, voice interaction to visual perception,
                <br className="hidden sm:block" />
                build your digital human application all-in-one.
              </>
            )}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`group relative flex flex-col rounded-2xl border p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${feature.borderColor} ${feature.bgColor}`}
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
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="flex-1 text-sm leading-relaxed text-gray-400">{feature.description}</p>

              {/* Learn More Link */}
              <div className="mt-4 flex items-center gap-1 text-sm text-gray-500 group-hover:text-white transition-colors">
                <span>{lang === 'zh-CN' ? '了解更多' : 'Learn more'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Hover Glow Effect */}
              <div
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity`}
              />
            </div>
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
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
