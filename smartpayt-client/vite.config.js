import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'belle-staying-profits-migration.trycloudflare.com', // ✅ วางใน array ให้ปิด ] ถูก
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // 🟢 พอร์ต backend ของคุณ
        changeOrigin: true,
        secure: false,
      },
    },
    host: true, // ✅ เพื่อให้รับการเชื่อมต่อจากทุก IP ได้
  },
});
