/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink: {
          50: '#f6f6f4',
          100: '#e8e8e3',
          200: '#d1d1c7',
          300: '#a8a89a',
          400: '#7d7d6e',
          500: '#5a5a4e',
          600: '#43433a',
          700: '#33332c',
          800: '#222220',
          900: '#141413',
          950: '#0a0a09',
        },
        accent: {
          50: '#fef7ec',
          100: '#fdebcd',
          200: '#fad391',
          300: '#f7b755',
          400: '#f59e2c',
          500: '#e88110',
          600: '#cd640a',
          700: '#a8480c',
          800: '#893910',
          900: '#702f10',
        },
        sage: {
          50: '#f3f6f3',
          100: '#e3ebe3',
          200: '#c7d6c7',
          300: '#9fb9a0',
          400: '#759779',
          500: '#577b5d',
          600: '#436248',
          700: '#374f3b',
          800: '#2e4032',
          900: '#27352b',
        },
        rose: {
          400: '#e87b7b',
          500: '#d85a5a',
          600: '#bf3f3f',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
        'soft-lg': '0 2px 4px rgba(0,0,0,0.04), 0 12px 32px rgba(0,0,0,0.06)',
        'soft-dark': '0 1px 2px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
