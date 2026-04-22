import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production' || mode === 'pages'
  const isPages = mode === 'pages'

  return {
    base: isPages ? '/meta-human/' : '/',
    
    plugins: [
      react({
        jsxImportSource: 'react',
        removeConsole: isProduction,
      }),
    ].filter(Boolean),

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

    build: {
      outDir: 'dist',
      sourcemap: false,
      cssCodeSplit: true,
      cssMinify: 'esbuild',
      assetsInlineLimit: 5120,
      emptyOutDir: true,
      chunkSizeWarningLimit: 1500,
      target: 'es2020',
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-dom/client'],
            'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
            'state-vendor': ['zustand'],
            'ui-vendor': ['lucide-react', 'sonner', 'clsx', 'tailwind-merge'],
            'router-vendor': ['react-router-dom'],
          },
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
    },

    server: {
      host: '0.0.0.0',
      port: 5173,
      open: true,
    },

    preview: {
      host: '0.0.0.0',
      port: 4173,
    },

    define: {
      __PAGES__: isPages,
      __PROD__: isProduction,
    },
  }
})
