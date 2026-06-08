import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    watch: {
      ignored: ['**/node_modules/**', '**/backend/**', '**/venv/**', '**/.git/**'],
    },
    fs: {
      allow: [fileURLToPath(new URL('.', import.meta.url))],
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    entries: ['src/main.tsx'],
  },
  build: {
    rollupOptions: {
      maxParallelFileOps: 2,
    },
  },
})
