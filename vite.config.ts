import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ''); // Load all env vars

  return {
    server: {
      port: 3000,
      host: true,
    },
    plugins: [react()],
    define: {
      'process.env.GROQ_API_KEY': JSON.stringify(env.GROQ_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    envPrefix: ['VITE_', 'GEMINI_'], // Allow GEMINI_ prefix
    build: {
      outDir: 'dist', // Ensure output directory is set to dist
    },
  };
});
