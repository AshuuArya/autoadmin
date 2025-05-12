/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f1ff',
          100: '#cce3ff',
          200: '#99c8ff',
          300: '#66adff',
          400: '#3392ff',
          500: '#0077ff',
          600: '#0062e6',
          700: '#0046ad',
          800: '#003380',
          900: '#001c4d',
        },
        secondary: {
          50: '#e6f7fc',
          100: '#cceff9',
          200: '#99dff3',
          300: '#66d0ed',
          400: '#33c0e7',
          500: '#00a3e0',
          600: '#0082b3',
          700: '#006286',
          800: '#00415a',
          900: '#00212d',
        },
        accent: {
          50: '#fff9e6',
          100: '#fff3cc',
          200: '#ffe799',
          300: '#ffdb66',
          400: '#ffcf33',
          500: '#ffb81c',  // Gold color
          600: '#cc9300',
          700: '#996e00',
          800: '#664a00',
          900: '#332500',
        },
        luxuryGold: '#D4AF37',  // Luxury Gold color
        luxurySilver: '#C0C0C0', // Luxury Silver color
        darkBackground: '#0A0A0A', // Dark background
        lightText: '#f2f2f2', // Light text for contrast
      },
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Open Sans', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
