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
          primary: '#A881EA',
          secondary: '#FFA6C9',
          tertiary: '#FCE762',
          text: '#000000',
          background: '#EDEDED',
          border: '#000000',
          card: '#FFFFFF',
          shadow: '#000000',
        },
      },
    },
  },
  plugins: [],
};
