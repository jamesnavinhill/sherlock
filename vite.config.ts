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
      rollupOptions: {
        output: {
          manualChunks: {
            // React core - cached well, rarely changes
            'vendor-react': ['react', 'react-dom'],
            // D3 visualization library - large, separate chunk
            'vendor-d3': ['d3'],
            // Lucide icons - many icons, separate chunk
            'vendor-icons': ['lucide-react'],
            // Markdown rendering
            'vendor-markdown': ['react-markdown'],
            // Google Gemini SDK
            'vendor-gemini': ['@google/genai'],
          }
        }
      }
    }
  };
});
