import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const apiUrl = env.VITE_API_URL || 'https://j77wpptx-8000.brs.devtunnels.ms/api/docs/'

  return {
    plugins: [react()],
    server: {
      allowedHosts: ['.devtunnels.ms'],
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
