/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#111215',
          subtle: '#16181c',
          muted: '#1c1f24',
          border: '#262a30',
          borderSubtle: '#1e2126',
        },
        action: {
          DEFAULT: '#2563eb',
          hover: '#1d4ed8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        'step-arrival': 'stepArrival 0.15s ease-out',
      },
      keyframes: {
        stepArrival: {
          '0%': { opacity: '0', transform: 'translateY(2px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
};
