import { defineConfig } from 'vitepress';

// 动态 base 路径：GitHub Pages 部署时使用环境变量
const rawBase = process.env.VITEPRESS_BASE;
const base = rawBase
  ? rawBase.startsWith('/')
    ? rawBase.endsWith('/')
      ? rawBase
      : `${rawBase}/`
    : `/${rawBase}/`
  : '/';

export default defineConfig({
  base: base.endsWith('/') ? `${base}docs/` : `${base}/docs/`,
  title: 'MetaHuman Engine Docs',
  description: 'Browser-Native 3D Digital Human Engine Documentation',

  // 忽略本地开发链接和某些相对链接
  ignoreDeadLinks: [/localhost/, /CHANGELOG/, /\.\.\/api\//, /\.\.\/architecture\//],

  locales: {
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/zh/',
      title: 'MetaHuman Engine 文档',
      description: '浏览器原生 3D 数字人引擎文档',
      themeConfig: {
        nav: [
          { text: '指南', link: '/zh/guide/getting-started', activeMatch: '/zh/guide/' },
          { text: 'API 参考', link: '/zh/api/overview', activeMatch: '/zh/api/' },
          { text: '架构', link: '/zh/architecture/overview', activeMatch: '/zh/architecture/' },
        ],
        sidebar: {
          '/zh/guide/': [
            {
              text: '指南',
              items: [
                { text: '快速开始', link: '/zh/guide/getting-started' },
                { text: '安装', link: '/zh/guide/installation' },
                { text: '配置', link: '/zh/guide/configuration' },
              ],
            },
          ],
          '/zh/api/': [
            {
              text: 'API 参考',
              items: [
                { text: '概览', link: '/zh/api/overview' },
                { text: 'REST API', link: '/zh/api/rest-api' },
                { text: 'WebSocket', link: '/zh/api/websocket' },
              ],
            },
          ],
          '/zh/architecture/': [
            {
              text: '架构',
              items: [{ text: '概览', link: '/zh/architecture/overview' }],
            },
          ],
        },
      },
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      title: 'MetaHuman Engine Docs',
      description: 'Browser-Native 3D Digital Human Engine Documentation',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/en/guide/getting-started', activeMatch: '/en/guide/' },
          { text: 'API Reference', link: '/en/api/overview', activeMatch: '/en/api/' },
          {
            text: 'Architecture',
            link: '/en/architecture/overview',
            activeMatch: '/en/architecture/',
          },
        ],
        sidebar: {
          '/en/guide/': [
            {
              text: 'Guide',
              items: [
                { text: 'Getting Started', link: '/en/guide/getting-started' },
                { text: 'Installation', link: '/en/guide/installation' },
                { text: 'Configuration', link: '/en/guide/configuration' },
              ],
            },
          ],
          '/en/api/': [
            {
              text: 'API Reference',
              items: [
                { text: 'Overview', link: '/en/api/overview' },
                { text: 'REST API', link: '/en/api/rest-api' },
                { text: 'WebSocket', link: '/en/api/websocket' },
              ],
            },
          ],
          '/en/architecture/': [
            {
              text: 'Architecture',
              items: [{ text: 'Overview', link: '/en/architecture/overview' }],
            },
          ],
        },
      },
    },
  },

  themeConfig: {
    outline: [2, 3],
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/LessUp/meta-human' }],
  },
});
