import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [
	react(),
	tailwindcss(),
    ],
    server: {
    proxy: {
      // Proxying standard HTTP API calls
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
	secure: false,
      },
      // Proxying WebSocket connections
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true, // Crucial for WebSocket support
      },
    },
  },
})
