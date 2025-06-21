import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['d1e4-171-4-239-88.ngrok-free.app', 'localhost'],
    host:true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // 🟢 พอร์ต backend ของคุณ
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
