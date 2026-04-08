/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#f2f5ec',
          100: '#E5EAD4',
          200: '#c8d9a8',
          400: '#9ACC77',
          500: '#9ACC77',
          600: '#45936C',
          700: '#367554',
          800: '#2a5a42',
          900: '#1F0A1D',
        },
        surface: {
          0: '#1F0A1D',
          1: '#251528',
          2: '#2c2236',
          3: '#334F53',
          4: '#3d5d61',
        },
      },
      borderRadius: {
        '2xl': '16px',
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(69, 147, 108, 0.2)',
        'glow-blue': '0 0 20px rgba(51, 79, 83, 0.2)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.1)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-dark': 'linear-gradient(135deg, #1F0A1D 0%, #251528 50%, #1F0A1D 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'count-up': 'countUp 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.7' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
