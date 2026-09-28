import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Three.js pèse lourd, on évite le warning inutile
    chunkSizeWarningLimit: 1500,
  },
})
