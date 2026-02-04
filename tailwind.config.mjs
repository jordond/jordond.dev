/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#14B8A6",
          light: "#5EEAD4",
        },
        surface: {
          DEFAULT: "#0a0a0f",
          card: "#16161d",
          elevated: "#1e1e26",
          light: "#fafafa",
          "card-light": "#ffffff",
          "elevated-light": "#f5f5f5",
        },
      },
      fontFamily: {
        sans: ["Space Mono", "monospace"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
}
