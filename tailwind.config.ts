import type { Config } from 'tailwindcss';

export default {
  content: ['./public/index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#5D3FD3',
        accent: '#FF7A59',
        surface: '#0B1220',
        'surface-muted': '#111827'
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif'
        ]
      },
      boxShadow: {
        glow: '0 20px 50px -25px rgba(93, 63, 211, 0.65)',
        'glow-accent': '0 25px 65px -30px rgba(255, 122, 89, 0.55)'
      },
      backgroundImage: {
        'grid-light':
          'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)'
      }
    }
  },
  plugins: []
} satisfies Config;
