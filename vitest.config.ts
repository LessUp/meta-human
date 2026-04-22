import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/setup.ts',
        '**/*.d.ts',
        '**/*.config.ts',
        '**/*.config.js'
      ],
      include: ['src/**/*.{ts,tsx}'],
      thresholds: {
        lines: 40,
        functions: 35,
        branches: 30,
        statements: 40
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})