import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    allowedHosts: ['d1e4-171-4-239-88.ngrok-free.app', 'localhost']
  }
})
