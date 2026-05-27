import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/vvc_web/vvc/frontend/',
  plugins: [react()],
  server: {
    port: 3000,
    host: '127.0.0.1',
    strictPort: false,
    allowedHosts: [
      '.trycloudflare.com',
    ],
    proxy: {
      '/api': {
        target: 'https://app.vvc.asia/vvc_web/vvc/backend/public/index.php',
        changeOrigin: true,
        secure: false,
      },
      '/vvc-upload-proxy': {
        target: 'https://app.vvc.asia/vvc_web/vvc/backend/public',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/vvc-upload-proxy/, ''),
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 500,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios'],
  }
})
