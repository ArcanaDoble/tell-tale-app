import type { Config } from 'tailwindcss';

export default {
  content: ['./public/index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#5D3FD3',
        accent: '#FF7A59'
      }
    }
  },
  plugins: []
} satisfies Config;
