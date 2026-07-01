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
        sans: ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        // Segue a cor do app escolhida nas configurações (CSS vars de globals.css/theme.ts)
        brand: {
          50:  'rgba(var(--accent-rgb), 0.06)',
          100: 'rgba(var(--accent-rgb), 0.12)',
          200: 'rgba(var(--accent-rgb), 0.24)',
          300: 'var(--accent-light)',
          400: 'var(--accent-light)',
          500: 'var(--accent)',
          600: 'var(--accent-dark)',
          700: 'var(--accent-dark)',
          800: '#122035',
          900: '#1F1F20',
        },
        surface: {
          page: '#f5f6f8',
          card: '#ffffff',
          input: '#f0f1f5',
          hover: '#e8eaee',
          border: '#DCE0E6',
        },
        fg: {
          DEFAULT: '#1F1F20',
          secondary: '#606D80',
          muted: '#9ca3af',
          onDark: '#ffffff',
        },
      },
      borderRadius: {
        '2xl': '16px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 2px 8px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.05)',
        'blue': '0 4px 16px rgba(var(--accent-rgb), 0.2)',
      },
      backgroundImage: {
        'gradient-blue': 'linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)',
        'gradient-sidebar': 'linear-gradient(180deg, var(--accent) 0%, #1F1F20 100%)',
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
