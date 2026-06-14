/** @type {import('tailwindcss').Config} */
// ordering_01 — Renkli & Hızlı: fast-casual, canlı turuncu vurgu
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#fffdf9",
        sand: "#ffefdd",
        coffee: "#27201a",
        terra: "#f97316",
        terradark: "#ea580c",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
