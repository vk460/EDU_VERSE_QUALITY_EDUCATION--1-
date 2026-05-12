import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/socket.io': {
        target: 'http://localhost:8001',
        ws: true,
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ['recharts', 'react-markdown', 'mermaid', 'd3']
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        features: resolve(__dirname, 'features.html'),
        auth: resolve(__dirname, 'auth.html'),
        profile: resolve(__dirname, 'profile.html'),
        aptitude: resolve(__dirname, 'aptitude.html'),
        pdf: resolve(__dirname, 'pdf_agent.html'),
        research: resolve(__dirname, 'research_agent.html'),
        email: resolve(__dirname, 'email_agent.html'),
        comms: resolve(__dirname, 'comms_agent.html'),
      }
    }
  }
})
