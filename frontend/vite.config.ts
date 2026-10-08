import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': '/src' },
  },
  // Dev: /api -> backend local, mismo camino relativo que el rewrite de vercel.json en producción.
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
