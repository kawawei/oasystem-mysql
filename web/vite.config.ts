import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['html2pdf.js']
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://server:3001',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://server:3001',
        changeOrigin: true,
      }
    },
  },
}) 