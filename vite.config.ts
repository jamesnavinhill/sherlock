import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  // Support both VITE_GEMINI_API_KEY (Vite standard) and GEMINI_API_KEY (legacy)
  const apiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY;
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
    },
    plugins: [react()],
    define: {
      // Backwards compatibility shim for process.env access
      'process.env.API_KEY': JSON.stringify(apiKey),
      'process.env.GEMINI_API_KEY': JSON.stringify(apiKey)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    build: {
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalizedId = id.replace(/\\/g, '/');
            if (!normalizedId.includes('/node_modules/')) return undefined;

            if (normalizedId.includes('/node_modules/react-markdown/')) return 'vendor-markdown';
            if (normalizedId.includes('/node_modules/lucide-react/')) return 'vendor-icons';
            if (normalizedId.includes('/node_modules/d3')) return 'vendor-d3';
            if (normalizedId.includes('/node_modules/@google/genai/')) return 'vendor-gemini';
            if (
              normalizedId.includes('/node_modules/wa-sqlite/')
              || normalizedId.includes('/node_modules/drizzle-orm/')
            ) return 'vendor-db';
            if (
              normalizedId.includes('/node_modules/react/')
              || normalizedId.includes('/node_modules/react-dom/')
              || normalizedId.includes('/node_modules/scheduler/')
            ) return 'vendor-react';

            return 'vendor';
          },
        }
      }
    }
  };
});
