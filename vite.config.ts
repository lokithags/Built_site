
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
      'process.env.GEMINI_API_KEY_1': JSON.stringify(env.GEMINI_API_KEY_1),
      'process.env.GEMINI_API_KEY_2': JSON.stringify(env.GEMINI_API_KEY_2),
      'process.env.GEMINI_API_KEY_3': JSON.stringify(env.GEMINI_API_KEY_3),
      'process.env.GROQ_API_KEY': JSON.stringify(env.GROQ_API_KEY),

    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    envPrefix: ['VITE_', 'GEMINI_'], // Allow GEMINI_ prefix
  };
});