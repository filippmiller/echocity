import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontFamily: {
      sans: ['var(--font-manrope)', 'system-ui', '-apple-system', 'sans-serif'],
    },
    extend: {
      colors: {
        brand: {
          50: '#f2e8dc',
          100: '#eadccb',
          200: '#d8c4ad',
          500: '#71412f',
          600: '#5f3728',
          700: '#43271d',
        },
        deal: {
          discount: '#71412f',
          savings: '#235848',
          urgent: '#9a641b',
          premium: '#1f2933',
          flash: '#8b2f25',
        },
        surface: {
          primary: '#fffdf8',
          secondary: '#f7f3ed',
          tertiary: '#f2e8dc',
        },
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'nav-height': '56px',
        'header-height': '56px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
export default config;
