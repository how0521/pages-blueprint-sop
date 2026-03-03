import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/pages-blueprint-sop/',
  server: {
    host: '0.0.0.0',
    port: 4999
  },
  preview: {
    host: '0.0.0.0',
    port: 4999
  }
})
