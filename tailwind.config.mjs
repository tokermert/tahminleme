/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        pitch: { 900:"#0b1120", 800:"#111827", 700:"#1e293b", 600:"#334155" },
        gold: { 400:"#c9a84c", 500:"#a67c2e" },
      }
    }
  },
  plugins: [],
};
