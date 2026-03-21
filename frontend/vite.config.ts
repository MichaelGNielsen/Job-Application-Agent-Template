import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0', // Vigtigt for Docker
    proxy: {
      '/api': {
        target: 'http://backend:3002',
        changeOrigin: true,
      },
      '/api-docs': {
        target: 'http://backend:3002',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://backend:3002',
        ws: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
