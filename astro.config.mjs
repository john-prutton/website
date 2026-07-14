// @ts-check
import { defineConfig } from "astro/config"

import tailwindcss from "@tailwindcss/vite"
import mdx from "@astrojs/mdx"
import rehypeExternalLinks from "rehype-external-links"

export default defineConfig({
  markdown: {
    shikiConfig: {
      theme: "catppuccin-frappe",
    },
    rehypePlugins: [
      [
        rehypeExternalLinks,
        { target: "_blank", rel: ["noopener", "noreferrer"] },
      ],
    ],
  },

  vite: {
    plugins: [tailwindcss()],
    assetsInclude: ["**/*.heic"],
  },

  integrations: [mdx()],
})
