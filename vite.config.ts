import { defineConfig, splitVendorChunkPlugin } from 'vite'
import react from '@vitejs/plugin-react-swc'  // SWC 编译器比 Babel 快 20 倍
import path from 'path'
import { compression } from 'vite-plugin-compression2'
import { visualizer } from 'rollup-plugin-visualizer'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

// 动态导入插件（仅在需要时加载）
const plugins: any[] = []

export default defineConfig(({ mode, command }) => {
  const isDevelopment = mode === 'development'
  const isProduction = mode === 'production'
  const isPages = mode === 'pages'
  const isMobile = mode === 'mobile'
  const isDesktop = mode === 'desktop'
  const isAR = mode === 'ar'
  const isAnalyze = mode === 'analyze'

  // 基础路径配置
  const base = isPages ? '/meta-human/' : '/'
  
  // 输出目录
  const outDir = isMobile 
    ? 'dist-mobile' 
    : isDesktop 
      ? 'dist-desktop' 
      : isAR 
        ? 'dist-ar' 
        : 'dist'

  return {
    // 基础配置
    base,
    
    // 使用 SWC 替代 Babel - 极速编译
    plugins: [
      react({
        // SWC 优化选项
        jsxImportSource: 'react',
        removeConsole: isProduction,
      }),
      
      // 代码分割
      splitVendorChunkPlugin(),
      
      // Brotli + Gzip 压缩
      isProduction && compression({
        algorithm: 'gzip',
        exclude: [/\.(br)$/, /\.(gz)$/],
        threshold: 1024,
      }),
      isProduction && compression({
        algorithm: 'brotliCompress',
        exclude: [/\.(br)$/, /\.(gz)$/],
        threshold: 1024,
      }),
      
      // 图像优化
      isProduction && ViteImageOptimizer({
        png: { quality: 85 },
        jpeg: { quality: 85, progressive: true },
        jpg: { quality: 85, progressive: true },
        webp: { quality: 85, lossless: false },
        avif: { quality: 85, lossless: false },
      }),
      
      // Bundle 分析（分析模式）
      isAnalyze && visualizer({
        open: true,
        gzipSize: true,
        brotliSize: true,
        filename: './bundle-analysis.html',
      }),
    ].filter(Boolean),

    // 路径别名
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@core': path.resolve(__dirname, './src/core'),
        '@store': path.resolve(__dirname, './src/store'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@lib': path.resolve(__dirname, './src/lib'),
        '@types': path.resolve(__dirname, './src/types'),
      },
    },

    // 构建配置
    build: {
      // 输出目录
      outDir,
      
      // 源映射（生产环境精简）
      sourcemap: isDevelopment ? 'inline' : isAnalyze ? true : 'hidden',
      
      // CSS 代码分割
      cssCodeSplit: true,
      
      // CSS 压缩
      cssMinify: 'lightningcss',  // 比 esbuild 更快
      
      // 资源内联阈值（5KB 以下内联）
      assetsInlineLimit: 5120,
      
      // 清空输出目录
      emptyOutDir: true,
      
      // chunk 大小警告阈值
      chunkSizeWarningLimit: 1000,
      
      // Rollup 优化
      rollupOptions: {
        output: {
          // 代码分割策略
          manualChunks: {
            // React 核心
            'react-vendor': [
              'react', 
              'react-dom',
              'react-dom/client',
            ],
            // Three.js 3D 引擎
            'three-vendor': [
              'three',
              '@react-three/fiber',
              '@react-three/drei',
              '@react-three/fiber/dist/three.module.js',
            ],
            // 状态管理
            'state-vendor': [
              'zustand',
              'zustand/middleware',
            ],
            // UI 组件
            'ui-vendor': [
              'lucide-react',
              'sonner',
              'clsx',
              'tailwind-merge',
            ],
            // 路由
            'router-vendor': ['react-router-dom'],
            // 媒体管道
            'mediapipe-vendor': [
              '@mediapipe/face_mesh',
              '@mediapipe/pose',
            ],
          },
          // 资源命名规范
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name || ''
            if (/\.css$/.test(info)) {
              return 'assets/styles/[name]-[hash][extname]'
            }
            if (/\.(png|jpe?g|gif|svg|webp|avif)$/.test(info)) {
              return 'assets/images/[name]-[hash][extname]'
            }
            if (/\.(woff2?|eot|ttf|otf)$/.test(info)) {
              return 'assets/fonts/[name]-[hash][extname]'
            }
            if (/\.(mp3|wav|ogg|mp4|webm)$/.test(info)) {
              return 'assets/media/[name]-[hash][extname]'
            }
            return 'assets/[name]-[hash][extname]'
          },
        },
        // 外部依赖（不打包）
        external: [],
      },
      
      // 启用模块预加载
      modulePreload: {
        polyfill: true,
      },
      
      // 生成 manifest.json
      manifest: true,
      
      // 目标浏览器
      target: 'es2020',
      
      // 压缩选项
      minify: isProduction ? 'terser' : false,
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction,
          pure_funcs: isProduction ? ['console.log', 'console.info', 'console.debug'] : [],
          passes: 2,
        },
        mangle: {
          safari10: true,
        },
        format: {
          comments: false,
        },
      },
      
      // 启用报告
      reportCompressedSize: isAnalyze,
    },

    // 开发服务器
    server: {
      host: '0.0.0.0',
      port: 5173,
      open: true,
      cors: true,
      strictPort: false,
      hmr: {
        overlay: true,
      },
      // 代理配置
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },

    // 预览服务器
    preview: {
      host: '0.0.0.0',
      port: 4173,
      open: true,
    },

    // 依赖优化
    optimizeDeps: {
      // 预构建这些包
      include: [
        'react',
        'react-dom',
        'react-dom/client',
        'three',
        '@react-three/fiber',
        '@react-three/drei',
        'zustand',
        '@mediapipe/face_mesh',
        '@mediapipe/pose',
        'lucide-react',
      ],
      // 排除这些包
      exclude: [],
      // 强制依赖重新优化
      force: false,
      // 延迟优化直到需要
      holdUntilCrawlEnd: true,
    },

    // 定义全局常量
    define: {
      __MOBILE__: isMobile,
      __DESKTOP__: isDesktop,
      __AR__: isAR,
      __PAGES__: isPages,
      __DEV__: isDevelopment,
      __PROD__: isProduction,
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __COMMIT_SHA__: JSON.stringify(process.env.VITE_COMMIT_SHA || 'unknown'),
    },

    // CSS 配置
    css: {
      // Lightning CSS 转换
      transformer: 'lightningcss',
      lightningcss: {
        targets: {
          chrome: 90,
          edge: 90,
          firefox: 90,
          safari: 15,
        },
      },
      // PostCSS 配置
      postcss: {
        plugins: [],
      },
      // 预处理器选项
      preprocessorOptions: {
        scss: {
          additionalData: '',
        },
      },
      // 开发 Source Map
      devSourcemap: isDevelopment,
    },

    // JSON 配置
    json: {
      // 命名导出
      namedExports: true,
      // 字符串化
      stringify: false,
    },

    // 环境变量前缀
    envPrefix: 'VITE_',

    // 清除屏幕
    clearScreen: false,

    // 日志级别
    logLevel: 'info',

    // 自定义 Logger
    customLogger: undefined,

    // 实验性功能
    experimental: {
      // 启用 renderBuiltUrl
      renderBuiltUrl: undefined,
    },
  }
})
