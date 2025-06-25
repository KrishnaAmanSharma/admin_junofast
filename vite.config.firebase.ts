import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// Firebase hosting configuration
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@assets": path.resolve(__dirname, "./attached_assets"),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://junofast-ebd0a.replit.app',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  define: {
    // Point to your Replit backend for production
    'import.meta.env.VITE_API_URL': JSON.stringify('https://junofast-ebd0a.replit.app')
  }
})