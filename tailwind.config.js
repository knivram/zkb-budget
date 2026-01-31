/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        canvas: '#f5f6fb',
        'canvas-dark': '#0b0f19',
        surface: '#ffffff',
        'surface-dark': '#141a26',
        'surface-muted': '#eef2f7',
        'surface-muted-dark': '#1c2433',
        border: '#d7deea',
        'border-dark': '#2a3548',
        ink: '#17223b',
        'ink-dark': '#f5f7fb',
        muted: '#5b677d',
        'muted-dark': '#a7b3c8',
        subtle: '#8c98b0',
        'subtle-dark': '#7f8aa3',
        brand: '#4f5bff',
        'brand-dark': '#8ea2ff',
        success: '#16a34a',
        'success-dark': '#4ade80',
        danger: '#e11d48',
        'danger-dark': '#fb7185',
        warning: '#f59e0b',
        'warning-dark': '#fbbf24',
      },
    },
  },
  plugins: [],
};
