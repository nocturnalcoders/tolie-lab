import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `npm run dev` proxies the API to the Python backend (gunicorn on :8000).
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://127.0.0.1:8000' } },
  build: { outDir: 'dist', sourcemap: false },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    exclude: ['node_modules/**', 'dist/**'],
  },
});
