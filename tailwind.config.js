/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: 'var(--accent-solid)',
          text: 'var(--accent-text)',
        },
      },
      boxShadow: {
        accent: '0 0 30px var(--accent-ring)',
      },
    },
  },
  plugins: [],
};
