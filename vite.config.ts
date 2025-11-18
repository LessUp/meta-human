import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isMobile = mode === 'mobile'
  const isDesktop = mode === 'desktop'
  const isAR = mode === 'ar'
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: isMobile ? 'dist-mobile' : isDesktop ? 'dist-desktop' : isAR ? 'dist-ar' : 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
            'ui-vendor': ['lucide-react', 'sonner'],
            'router-vendor': ['react-router-dom'],
            'state-vendor': ['zustand']
          }
        }
      }
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      open: true
    },
    preview: {
      host: '0.0.0.0',
      port: 3000
    },
    define: {
      __MOBILE__: isMobile,
      __DESKTOP__: isDesktop,
      __AR__: isAR,
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
    },
    optimizeDeps: {
      include: ['three', '@react-three/fiber', '@react-three/drei']
    }
  }
})
