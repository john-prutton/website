// @ts-check
import { defineConfig } from "astro/config"

import tailwindcss from "@tailwindcss/vite"
import mdx from "@astrojs/mdx"

export default defineConfig({
  markdown: {
    shikiConfig: {
      theme: "catppuccin-frappe",
    },
  },

  image: { service: { entrypoint: "astro/assets/services/sharp" } },

  vite: {
    plugins: [tailwindcss()],
    assetsInclude: ["**/*.heic"],
  },

  integrations: [mdx()],
})
