/** @type {import('tailwindcss').Config} */
module.exports = {
  // tailwind.config.ts
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}", // This is the most important line
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}