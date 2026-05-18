import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#B92D3A',
        accent: '#1E7A78',
        paper: '#F6F0E4',
        ink: '#161312'
      }
    }
  },
  plugins: []
} satisfies Config;
