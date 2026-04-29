import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production' || mode === 'pages';
  const isPages = mode === 'pages';

  return {
    base: isPages ? '/meta-human/' : '/',

    css: {
      transformer: 'lightningcss',
      lightningcss: {
        targets: {
          chrome: 105 << 16,
          safari: 16 << 16,
          ios_saf: 16 << 16,
          firefox: 105 << 16,
        },
      },
    },

    plugins: [
      react({
        jsxImportSource: 'react',
        removeConsole: isProduction,
      }),
      tailwindcss(),
    ].filter(Boolean),

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    build: {
      outDir: 'dist',
      sourcemap: false,
      cssCodeSplit: true,
      cssMinify: 'lightningcss',
      assetsInlineLimit: 5120,
      emptyOutDir: true,
      chunkSizeWarningLimit: 1500,
      target: 'es2020',
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (/[\\/]node_modules[\\/](react|react-dom)[\\/]/.test(id)) return 'react-vendor';
              if (/[\\/]node_modules[\\/](three|@react-three)[\\/]/.test(id)) return 'three-vendor';
              if (/[\\/]node_modules[\\/]zustand[\\/]/.test(id)) return 'state-vendor';
              if (/[\\/]node_modules[\\/](lucide-react|sonner|clsx|tailwind-merge)[\\/]/.test(id)) return 'ui-vendor';
              if (/[\\/]node_modules[\\/]react-router-dom[\\/]/.test(id)) return 'router-vendor';
            }
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

  };

});
