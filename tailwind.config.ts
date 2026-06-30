/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        undf: {
          primary: '#2062AF',
          primaryDark: '#27306E',
          primaryLight: '#4495D1',
          primaryLighter: '#90CEF1',
          black: '#231F20',
          white: '#FFFFFF',
          grayLight: '#F7FAFC',
          gray: '#E2E8F0',
          grayDark: '#4A5568',
        }
      },
    },
  },
  plugins: [],
};
