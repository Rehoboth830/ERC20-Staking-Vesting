/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        lionBlack: "#0b0b0b",
        amberGlow: "#ffbf00",
        goldGlow: "#ffd700",
        lionGray: "#1f1f1f",
        lionWhite: "#f5f5f5",
      },
      boxShadow: {
        'lion-glow': '0 0 10px #ffd700, 0 0 20px #ffbf00',
        'lion-glow-lg': '0 0 15px #ffd700, 0 0 30px #ffbf00',
      },
      fontFamily: {
        lion: ['"Inter"', 'sans-serif'],
        eagle: ['"Poppins"', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
      }
    },
  },
  plugins: [],
};
