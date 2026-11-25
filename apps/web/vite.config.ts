/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
    proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: false } },
  },
  build: { outDir: 'dist', sourcemap: false },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // Node >= 25 ships a global localStorage that shadows jsdom's; disable it in workers.
    poolOptions: {
      forks: {
        execArgv: Number(process.versions.node.split('.')[0]) >= 22 ? ['--no-experimental-webstorage'] : [],
      },
    },
  },
});
