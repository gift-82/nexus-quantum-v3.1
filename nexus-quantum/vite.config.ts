import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      // Proxy Binance REST API to avoid CORS issues
      '/api/binance': {
        target: 'https://api.binance.com',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/binance/, ''),
      },
    },
  },
  define: {
    global: 'globalThis',
  },
})
