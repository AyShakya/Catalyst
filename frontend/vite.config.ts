import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), svgr(), tailwindcss()],
  build: {
    assetsInlineLimit: 4096, // Inline assets smaller than 4KB
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('recharts')) {
            return 'vendor-recharts';
          }
          if (id.includes('framer-motion')) {
            return 'vendor-framer';
          }
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
