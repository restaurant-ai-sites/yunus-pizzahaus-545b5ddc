/** @type {import('tailwindcss').Config} */
// ordering_04 — Orient & Grill: warmes Gold, elegante Serife (Döner/Kebap-Stil)
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#fffaf2",
        sand: "#f3e3c3",
        coffee: "#3a2a14",
        terra: "#b8860b",
        terradark: "#93690a",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
