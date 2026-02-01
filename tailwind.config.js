/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#f2f2f7',
          dark: '#000000',
        },
        card: {
          DEFAULT: '#ffffff',
          dark: '#1c1c1e',
        },
        separator: {
          DEFAULT: '#e5e5ea',
          dark: '#38383a',
        },
        accent: {
          DEFAULT: '#5856d6',
          light: '#7a79e0',
          dark: '#7d7aff',
        },
      },
    },
  },
  plugins: [],
};
