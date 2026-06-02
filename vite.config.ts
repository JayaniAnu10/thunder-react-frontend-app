import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/oauth2': {
        target: 'https://localhost:8090',
        changeOrigin: true,
        secure: false,
      },
      '/users': {
        target: 'https://localhost:8090',
        changeOrigin: true,
        secure: false,
      },
      '/scim2': {
        target: 'https://localhost:8090',
        changeOrigin: true,
        secure: false,
      },
      '/flow': {
        target: 'https://localhost:8090',
        changeOrigin: true,
        secure: false,
      },
      '/.well-known': {
        target: 'https://localhost:8090',
        changeOrigin: true,
        secure: false,
      },
      '/t': {
        target: 'https://localhost:8090',
        changeOrigin: true,
        secure: false,
      },
      '/gate': {
        target: 'https://localhost:8090',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})