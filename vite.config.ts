import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://j77wpptx-8000.brs.devtunnels.ms',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
