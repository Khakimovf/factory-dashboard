import { defineConfig } from 'vite'
import path from 'path'
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
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    watch: {
      ignored: ['**/node_modules/**', '**/backend/**', '**/.git/**'],
    },
    fs: {
      allow: [path.resolve(__dirname)],
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
