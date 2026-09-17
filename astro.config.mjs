// @ts-check
import { defineConfig } from "astro/config"
import tailwindcss from "@tailwindcss/vite"
import sitemap from "@astrojs/sitemap"

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  site: "https://jordond.dev",
  compressHTML: true,
  integrations: [sitemap()],
  image: {
    remotePatterns: [{ protocol: "https" }],
  },
})
