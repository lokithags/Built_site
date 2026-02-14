import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  server: {
    port: 3000,
    host: true,
  },
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/Built_site/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  envPrefix: ['VITE_', 'GEMINI_'],
  build: {
    outDir: 'dist',
  },
});
