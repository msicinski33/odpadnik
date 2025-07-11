/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pgkblue: {
          dark: '#003e6b',
          DEFAULT: '#005fa3',
          light: '#0074c2',
        },
        pgkgreen: {
          light: '#b6e2c6',
          DEFAULT: '#4caf50',
        },
        pgkred: {
          DEFAULT: '#e57373',
        },
        pgkgray: {
          light: '#f5f5f5',
          dark: '#333333',
        },
        pgkwhite: '#ffffff',
      },
      keyframes: {
        'slide-truck-1': {
          '0%': { left: '-5rem' },
          '100%': { left: '100vw' },
        },
        'slide-truck-2': {
          '0%': { right: '-5rem' },
          '100%': { right: '100vw' },
        },
        'slide-truck-3': {
          '0%': { left: '-4rem' },
          '100%': { left: '100vw' },
        },
      },
      animation: {
        'slide-truck-1': 'slide-truck-1 15s linear infinite',
        'slide-truck-2': 'slide-truck-2 18s linear infinite 3s',
        'slide-truck-3': 'slide-truck-3 12s linear infinite 6s',
      },
    },
  },
  plugins: [],
  safelist: [
    'bg-yellow-400',
    'bg-blue-400',
    'bg-white',
  ],
}

