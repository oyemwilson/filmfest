/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        gupter: ['Gupter', 'sans-serif'],
        'libre-sans-serif': ['Libre Sans Serif', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
