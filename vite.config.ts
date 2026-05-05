import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: './', // 👈 Tambahkan baris ini agar path index.html aman
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
