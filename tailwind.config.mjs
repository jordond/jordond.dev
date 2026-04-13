/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        display: [
          '"Petrona"',
          '"Petrona Fallback"',
          "ui-serif",
          "Georgia",
          "serif",
        ],
        body: [
          '"Schibsted Grotesk"',
          '"Schibsted Fallback"',
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        sans: [
          '"Schibsted Grotesk"',
          '"Schibsted Fallback"',
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
}
