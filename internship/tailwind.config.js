/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        "short-stack": ["var(--font-short-stack)", "cursive"],
        nastaliq: ["var(--font-nastaliq)", "serif"],
      },
    },
  },
  plugins: [],
};
