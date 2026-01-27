/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        'osint-dark': '#000000',
        'osint-panel': '#09090b',
        'osint-surface': '#18181b',
        'osint-border': '#27272a',
        'osint-primary': 'var(--osint-primary)',
        'osint-text': '#a1a1aa',
        'osint-warn': '#fbbf24',
        'osint-danger': '#f87171',
        'osint-success': '#34d399',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};