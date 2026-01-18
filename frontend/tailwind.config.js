/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        neo: {
          primary: '#4CAF50',
          'primary-dark': '#388E3C',
          secondary: '#FFA6C9',
          tertiary: '#FCE762',
          text: '#000000',
          background: '#FFF8E7',
          border: '#000000',
          card: '#FFFFFF',
          shadow: '#000000',
        },
      },
    },
  },
  plugins: [],
};
